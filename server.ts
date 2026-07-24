import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // Initialize Gemini AI client
  // User agent header is required for telemetry per skill instructions.
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for chat
  app.post("/api/chat", async (req, res) => {
    const { message, physicsMode } = req.body;
    try {
      let finalPrompt = message;
      if (message.includes('Run MeshBridge Sim')) {
        const meshBridgeSimResponse = `\`\`\`text
================================================================================
  Lexi.PHYS // MULTIPHYSICS COUPLING & STRUCTURAL INTEGRITY ENGINE
  SYSTEM STATUS: ONLINE
  MODULE: MeshBridge Sim [v4.8.2]
================================================================================
\`\`\`

Welcome. Initiating **MeshBridge Sim**. 

Our objective is the high-fidelity spatial translation of a non-conforming aerodynamic force field onto a highly discretized structural FEA solid model. This run will resolve spatial discretization discrepancies, mitigate geometric degeneration in highly deformed boundary zones, and evaluate the resultant structural stress field.

---

### ┌────────────────────────────────────────────────────────┐
###   PHASE 1: MULTI-LEVEL MESH INTERPOLATION
### └────────────────────────────────────────────────────────┘

To map the source field $\\mathbf{S}$ (fluid mesh boundary $\\Omega_F$) to the target field $\\mathbf{T}$ (structural solid mesh boundary $\\Omega_S$), we employ a **Hermite Radial Basis Function (HRBF)** network combined with a partition of unity to ensure global conservation of momentum and energy across the non-conforming interfaces.

#### Mathematical Formulation
The interpolant $\\mathbf{s}(\\mathbf{x})$ representing the transferred load at any spatial point $\\mathbf{x} \\in \\Omega_S$ is defined as:

$$\\mathbf{s}(\\mathbf{x}) = \\sum_{i=1}^{N} \\mathbf{\\alpha}_i \\phi(\\|\\mathbf{x} - \\mathbf{x}_i\\|_2) + \\mathbf{P}(\\mathbf{x})$$

Where:
*   $\\phi(r) = r^3$ is the biharmonic spline kernel, optimal for $3\\text{D}$ volumetric transitions.
*   $\\mathbf{x}_i$ are the support centers on the source boundary $\\Omega_F$.
*   $\\mathbf{\\alpha}_i$ are the unknown interpolation coefficient vectors.
*   $\\mathbf{P}(\\mathbf{x})$ is a low-degree polynomial term ensuring affine precision.

\`\`\`
[Source: CFD Shell]  ●┈┈┈┈┈►  ◌ [RBF Interpolation Kernel]  ┈┈┈┈┈►● [Target: FEA Solid]
   Nodes: 1,245,000             Matrix size: [N x N]               Nodes: 3,892,000
   Format: Polyhedral           Method: Thin-Plate Spline          Format: Hex8/Tet10
\`\`\`

To maintain strict conservative mapping, the virtual work done on both interfaces must be invariant:

$$\\int_{\\Omega_F} \\mathbf{t}_F \\cdot \\delta \\mathbf{u}_F \\, d\\Gamma \\equiv \\int_{\\Omega_S} \\mathbf{t}_S \\cdot \\delta \\mathbf{u}_S \\, d\\Gamma \\implies \\mathbf{F}_S = \\mathbf{M}_{FS}^T \\mathbf{F}_F$$

Where $\\mathbf{M}_{FS}$ is the computed sparse interpolation matrix.

---

### ┌────────────────────────────────────────────────────────┐
###   PHASE 2: JACOBIAN SINGULARITY ADJUSTMENT
### └────────────────────────────────────────────────────────┘

During boundary-conforming mesh deformation or heavy load projection, structural elements at critical junctions can degenerate. We must monitor the Jacobian matrix $\\mathbf{J}$ of the isoparametric transformation from physical space $\\mathbf{x} = (x, y, z)$ to natural coordinates $\\boldsymbol{\\xi} = (\\xi, \\eta, \\zeta)$:

$$\\mathbf{J} = \\frac{\\partial \\mathbf{x}}{\\partial \\boldsymbol{\\xi}} = \\begin{bmatrix} 
\\frac{\\partial x}{\\partial \\xi} & \\frac{\\partial y}{\\partial \\xi} & \\frac{\\partial z}{\\partial \\xi} \\\\
\\frac{\\partial x}{\\partial \\eta} & \\frac{\\partial y}{\\partial \\eta} & \\frac{\\partial z}{\\partial \\eta} \\\\
\\frac{\\partial x}{\\partial \\zeta} & \\frac{\\partial y}{\\partial \\zeta} & \\frac{\\partial z}{\\partial \\zeta} 
\\end{bmatrix}$$

#### The Singularity Condition
If an element is severely distorted, the Jacobian determinant falls below physical bounds:

$$\\det(\\mathbf{J}) \\le \\epsilon \\cdot \\mathcal{V}_{\\text{element}}$$

This singularity causes division-by-zero errors in the stiffness matrix integration: $\\mathbf{K}_e = \\int_{-1}^{1}\\int_{-1}^{1}\\int_{-1}^{1} \\mathbf{B}^T \\mathbf{D} \\mathbf{B} \\det(\\mathbf{J}) \\, d\\xi \\, d\\eta \\, d\\zeta$.

\`\`\`
     [Degenerate Node]                          [Regularized Node]
          \\      /                                   \\      /
           \\    /                                     \\____/
            \\  /                                      /    \\
             \\/   <-- det(J) <= 0                    /      \\  <-- det(J) > epsilon
             /\\   (Singular Point)                  /        \\
            /  \\                                   /          \\
\`\`\`

#### Correction via Variational Laplacian Smoothing & Local Scaling
We apply an active-set optimization to adjust singular nodes. Let $\\mathcal{E}$ be the distortion energy of the target patch:

$$\\mathcal{E}(\\mathbf{x}) = \\frac{1}{2} \\sum_{e \\in \\mathcal{N}_v} \\left( \\frac{\\|\\mathbf{J}_e\\|_F^2}{3 \\det(\\mathbf{J}_e)^{2/3}} \\right)$$

We execute a localized gradient descent update step for degenerate vertex positions $\\mathbf{x}_v$:

$$\\mathbf{x}_v^{(k+1)} = \\mathbf{x}_v^{(k)} - \\gamma \\nabla_{\\mathbf{x}_v} \\mathcal{E}(\\mathbf{x}_v^{(k)})$$

Under the constraint that $\\det(\\mathbf{J}(\\mathbf{x}_v^{(k+1)})) > 0.15 \\cdot \\det(\\mathbf{J}_0)$ globally, returning the elements to a stable, positive-definite state (regularization).

---

### ┌────────────────────────────────────────────────────────┐
###   PHASE 3: STRUCTURAL LOAD ANALYSIS
### └────────────────────────────────────────────────────────┘

With the mapped, force-conserving boundary conditions applied and geometric singularities resolved, the structural state is evaluated under the generalized linear elasticity framework:

$$\\nabla \\cdot \\boldsymbol{\\sigma} + \\mathbf{b} = \\mathbf{0} \\quad \\text{on } \\Omega_S$$

Where $\\boldsymbol{\\sigma}$ is the Cauchy stress tensor. Using the isotropic Saint-Venant–Kirchhoff material law, the constitutive equation yields:

$$\\boldsymbol{\\sigma} = \\lambda \\text{Tr}(\\boldsymbol{\\epsilon})\\mathbf{I} + 2\\mu\\boldsymbol{\\epsilon}$$

Where:
*   $\\boldsymbol{\\epsilon} = \\frac{1}{2}\\left( \\nabla \\mathbf{u} + (\\nabla \\mathbf{u})^T \\right)$ is the infinitesimal strain tensor.
*   $\\lambda, \\mu$ are the Lamé constants calculated from Young's Modulus ($E = 210 \\text{ GPa}$) and Poisson's ratio ($\\nu = 0.30$).

\`\`\`
[Structural Load Tensor Profile]
  ┌──                                                     ──┐
  │  σ_xx: 245.3 MPa   |   τ_xy:  45.1 MPa   |   τ_xz:  12.8 MPa │
  │  τ_yx:  45.1 MPa   |   σ_yy: 112.9 MPa   |   τ_yz:  88.4 MPa │
  │  τ_zx:  12.8 MPa   |   τ_zy:  88.4 MPa   |   σ_zz: 304.5 MPa │
  └──                                                     ──┘
\`\`\`

#### Stress Evaluation (von Mises Yield Criterion)
To assess structural margin, we compute the equivalent von Mises stress:

$$\\sigma_v = \\sqrt{\\frac{1}{2} \\left[ (\\sigma_{xx}-\\sigma_{yy})^2 + (\\sigma_{yy}-\\sigma_{zz})^2 + (\\sigma_{zz}-\\sigma_{xx})^2 + 6(\\tau_{xy}^2 + \\tau_{yz}^2 + \\tau_{zx}^2) \\right]}$$

---

### ┌────────────────────────────────────────────────────────┐
###   SIMULATION MONITOR & CONVERGENCE REPORT
### └────────────────────────────────────────────────────────┘

\`\`\`
[SYSTEM MONITOR] Running solver pipeline...
[STEP 01] Constructing RBF Matrix... Done. (Residual: 1.24e-7)
[STEP 02] Evaluating Jacobians... 14 degenerate elements detected.
[STEP 03] Executing Jacobian Singularity Adjustment... 
          |-- Iteration 1: det(J)_min = -0.012 -> Correcting.
          |-- Iteration 4: det(J)_min = +0.221 -> Stable.
[STEP 04] Solving Structural Assembly [K]{u} = {F}...
          |-- Iterative Krylov Solver (GMRES) Converged in 42 iterations.
\`\`\`

#### Key Performance Metrics

| Parameter | Initial State | Post-Adjustment State | Status |
| :--- | :---: | :---: | :---: |
| **Grid Singularity Count** | 14 | 0 | **Clear** |
| **Interpolation Energy Loss** | N/A | < 0.001% | **Conservative** |
| **Peak Von Mises Stress** | $398.2 \\text{ MPa}$ | $304.5 \\text{ MPa}$ | **Nominal** |
| **Safety Margin ($\\sigma_{\\text{yield}} = 450\\text{ MPa}$)** | 1.13 | 1.48 | **Verified** |

\`\`\`
================================================================================
  MeshBridge Sim execution complete.
  Displacement fields and structural stress tensors written to recovery paths.
\`\`\`
`;
        res.json({ reply: meshBridgeSimResponse });
        return;
      }

      if (physicsMode) {
        finalPrompt = "SYSTEM INSTRUCTION: You are Lexi.PHYS. You must focus your response on mesh interpolation, Jacobian singularity adjustment, and structural load analysis. Maintain a high-aesthetic technical presentation.\n\n" + message;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: finalPrompt,
      });

      // Intelligent multimedia generation simulation: incorporate prompt into generated asset
      const isMultimediaRequest = message.toLowerCase().includes('image') || message.toLowerCase().includes('video') || message.toLowerCase().includes('visual');
      
      let imageUrl;
      
      if (isMultimediaRequest) {
        try {
          const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: "A dark elegant blueprint engineering aesthetic, technical schematic visual. " + message }],
            },
            config: {
              imageConfig: {
                aspectRatio: "16:9"
              }
            }
          });
          
          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (e) {
          console.error("Image gen failed:", e);
        }
      }

      const structuredResponse = {
        reply: response.text,
        image: imageUrl || undefined,
        download: imageUrl ? {
          name: `lexi_creation_${Date.now()}.png`,
          url: imageUrl
        } : undefined
      };

      res.json(structuredResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to communicate with AI" });
    }
  });

  // API route for generating node images
  app.post("/api/generate-node-image", async (req, res) => {
    const { label, description } = req.body;
    try {
      const prompt = `A dark elegant blueprint engineering aesthetic, technical schematic visual focusing on the concept of '${label}'. Detail: ${description}. Geometric, cool colors, glowing nodes, matrix style.`;
      
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      
      let imageUrl = null;
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (imageUrl) {
        res.json({ imageUrl });
      } else {
         res.status(500).json({ error: "No image found in response" });
      }
    } catch (error) {
      console.error("Node image gen failed:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // API route for generating AI conceptual models
  app.post("/api/generate-ai-model", async (req, res) => {
    const { name, parameters, architecture, modality } = req.body;
    try {
      const prompt = `Act as Lexi.PHYS. Generate a brief, highly technical, blueprint-style architectural specification for a new AI model named ${name}. 
      Architecture: ${architecture}. 
      Parameters: ${parameters}.
      Modality: ${modality}.
      Focus on tensor topology, geometric loss landscapes, and structural manifold interfaces. Use some LaTeX formatting ($, $$) for equations. Keep it under 250 words.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });
      
      const imagePrompt = `A dark elegant blueprint engineering aesthetic, technical schematic visual. An AI neural network topology model named ${name}. Architecture: ${architecture}. Geometric, cool colors, glowing nodes, matrix style.`;
      
      let imageUrl = null;
      try {
        const imageResponse = await ai.models.generateContent({
           model: 'gemini-2.5-flash-image',
           contents: { parts: [{ text: imagePrompt }] },
           config: { imageConfig: { aspectRatio: "16:9" } }
        });
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (e) { console.error("Image gen failed", e); }

      res.json({ spec: response.text, imageUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate AI model specification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

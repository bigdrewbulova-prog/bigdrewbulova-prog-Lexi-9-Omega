import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface NodeData {
  id: string;
  label: string;
  group: number;
  image: string;
  description: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export default function ManifoldDiagram({ darkMode, onNodeSelect }: { darkMode: boolean, onNodeSelect?: (id: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customGeneratedImages, setCustomGeneratedImages] = useState<Record<string, string>>({});

  const handleGenerateHighRes = async (node: NodeData) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-node-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: node.label, description: node.description })
      });
      const data = await response.json();
      if (data.imageUrl) {
        setCustomGeneratedImages(prev => ({ ...prev, [node.id]: data.imageUrl }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;
    const nodes: NodeData[] = [
      {
        id: 'core',
        label: 'Kineto-Cognitive Core',
        group: 2,
        image: '/images/kineto-manifold.png',
        description: 'The central manifold connecting motion, load, and cognition.'
      },
      {
        id: 'stress',
        label: 'Stress Field',
        group: 1,
        image: '/images/stress-field.png',
        description: 'Shows high-load regions using a stress-map style visual.'
      },
      {
        id: 'singularity',
        label: 'Jacobian Singularity',
        group: 3,
        image: '/images/jacobian-singularity.png',
        description: 'Represents instability zones where control can fail.'
      },
      {
        id: 'stability',
        label: 'Stabilized State',
        group: 1,
        image: '/images/stabilized-state.png',
        description: 'Shows the regularized, safe operating state.'
      }
    ];

    const links = [
      { source: 'core', target: 'stress', value: 1 },
      { source: 'core', target: 'singularity', value: 1 },
      { source: 'core', target: 'stability', value: 1 },
      { source: 'stress', target: 'singularity', value: 1 },
    ];

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3
      .forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', darkMode ? '#334155' : '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => d.id === 'core' ? 12 : 8)
      .attr('fill', (d) => (d.group === 1 ? '#3b82f6' : d.group === 2 ? '#ef4444' : '#10b981'))
      .attr('stroke', darkMode ? '#1e293b' : '#ffffff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer');

    // Make nodes draggable and clickable
    node.call(
      d3.drag()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any
    );

    node.on('click', (event, d: any) => {
      setSelectedNode(d);
      if (onNodeSelect) onNodeSelect(d.id);
    });

    // Node labels
    const labels = svg
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => d.label)
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('fill', darkMode ? '#94a3b8' : '#64748b')
      .attr('pointer-events', 'none')
      .attr('dx', 15)
      .attr('dy', 4);

    node.append('title').text((d) => d.label);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      labels.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });
    
    // Set initially selected node
    setSelectedNode(nodes[0]);
    if (onNodeSelect) onNodeSelect(nodes[0].id);
  }, [darkMode]);

  return (
    <div className="w-full flex-col items-center">
      <svg ref={svgRef} width="400" height="300" className="mx-auto" />
      {selectedNode && (
        <div className={`mt-4 w-full max-w-[400px] mx-auto border p-3 rounded-lg shadow-xl ${darkMode ? 'bg-gray-950/60 border-blue-500/30' : 'bg-gray-50 border-blue-400/50'} backdrop-blur-md transition-all`}>
           <div className="aspect-video w-full rounded border overflow-hidden mb-3 relative group bg-black">
            <img 
              src={customGeneratedImages[selectedNode.id] || selectedNode.image} 
              alt={selectedNode.label} 
              className={`w-full h-full object-cover transition-opacity ${isGenerating ? 'opacity-50' : 'opacity-100'}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${selectedNode.id}/600/400`;
              }}
              referrerPolicy="no-referrer"
            />
            {darkMode && <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay pointer-events-none"></div>}
            
            {/* Generate Button Overlay */}
            {!customGeneratedImages[selectedNode.id] && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm">
                 <button 
                   onClick={() => handleGenerateHighRes(selectedNode)}
                   disabled={isGenerating}
                   className={`px-3 py-1.5 text-xs font-mono rounded border flex items-center gap-2 ${darkMode ? 'bg-blue-600/30 border-blue-400 text-blue-300 hover:bg-blue-600/50' : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'}`}
                 >
                   {isGenerating ? (
                     <span className="animate-pulse">Synthesizing Tensor...</span>
                   ) : (
                     <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Generate Hi-Res Visual
                     </>
                   )}
                 </button>
               </div>
            )}
            
            {isGenerating && (
              <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] font-mono text-blue-400 bg-black/70 px-2 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                Awaiting API...
              </div>
            )}
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {selectedNode.label}
          </h3>
          <p className={`text-xs font-mono opacity-80 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {selectedNode.description}
          </p>
        </div>
      )}
    </div>
  );
}

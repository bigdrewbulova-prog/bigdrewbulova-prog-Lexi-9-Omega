import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Cpu, Activity, LayoutTemplate, Layers } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ModelGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function ModelGeneratorModal({ isOpen, onClose, darkMode }: ModelGeneratorModalProps) {
  const [name, setName] = useState('');
  const [architecture, setArchitecture] = useState('Transformer');
  const [parameters, setParameters] = useState('1.5B');
  const [modality, setModality] = useState('Multimodal');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ spec: string, imageUrl: string | null } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-ai-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parameters, architecture, modality })
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ spec: data.spec, imageUrl: data.imageUrl });
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row rounded-xl border shadow-2xl ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            
            {/* Form Section */}
            <div className={`p-6 w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`font-mono font-bold flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  <Cpu size={18} />
                  MODEL SYNTHESIS
                </h2>
                <button onClick={onClose} className={`md:hidden ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} p-1 rounded`}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleGenerate} className="flex flex-col gap-4 flex-1">
                <div>
                  <label className={`block text-xs font-mono mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Model Designation</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nexus-7"
                    required
                    className={`w-full p-2 rounded border font-mono text-sm ${darkMode ? 'bg-black border-gray-700 text-gray-200 focus:border-green-500' : 'bg-white border-gray-300 text-gray-800 focus:border-green-500'} outline-none focus:ring-1 focus:ring-green-500 transition-all`}
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-mono mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Architecture Base</label>
                  <select 
                    value={architecture} 
                    onChange={(e) => setArchitecture(e.target.value)}
                    className={`w-full p-2 rounded border font-mono text-sm ${darkMode ? 'bg-black border-gray-700 text-gray-200 focus:border-green-500' : 'bg-white border-gray-300 text-gray-800 focus:border-green-500'} outline-none`}
                  >
                    <option>Transformer (Auto-regressive)</option>
                    <option>Diffusion Model</option>
                    <option>Continuous Time RNN</option>
                    <option>Spiking Neural Network</option>
                    <option>Retentive Network (RetNet)</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-xs font-mono mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Parameter Count</label>
                  <select 
                    value={parameters} 
                    onChange={(e) => setParameters(e.target.value)}
                    className={`w-full p-2 rounded border font-mono text-sm ${darkMode ? 'bg-black border-gray-700 text-gray-200 focus:border-green-500' : 'bg-white border-gray-300 text-gray-800 focus:border-green-500'} outline-none`}
                  >
                    <option>Distilled (700M)</option>
                    <option>Edge/Mobile (1.5B)</option>
                    <option>Mid-Tier (7B)</option>
                    <option>Enterprise (70B)</option>
                    <option>Frontier (&gt;500B)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-mono mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Modality Profile</label>
                  <select 
                    value={modality} 
                    onChange={(e) => setModality(e.target.value)}
                    className={`w-full p-2 rounded border font-mono text-sm ${darkMode ? 'bg-black border-gray-700 text-gray-200 focus:border-green-500' : 'bg-white border-gray-300 text-gray-800 focus:border-green-500'} outline-none`}
                  >
                    <option>Text-Only (Unimodal)</option>
                    <option>Multimodal (Vision/Text)</option>
                    <option>Audio-Native</option>
                    <option>Spatial/Robotics (Kineto-Cognitive)</option>
                  </select>
                </div>

                <div className="mt-auto pt-6">
                  <button 
                    type="submit" 
                    disabled={isGenerating || !name}
                    className={`w-full py-3 rounded-lg font-mono font-bold flex items-center justify-center gap-2 transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed bg-green-600/50 text-white' : 'bg-green-600 hover:bg-green-500 text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]'} ${!name && !isGenerating ? 'opacity-50 cursor-not-allowed hover:shadow-none hover:bg-green-600' : ''}`}
                  >
                    {isGenerating ? (
                      <><Activity size={18} className="animate-spin" /> SYNTHESIZING...</>
                    ) : (
                      <><Zap size={18} /> INITIATE GENERATION</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Result Section */}
            <div className={`p-6 w-full md:w-2/3 flex flex-col relative overflow-y-auto ${darkMode ? 'bg-black text-gray-300' : 'bg-white text-gray-700'}`}>
              <button onClick={onClose} className={`absolute top-4 right-4 hidden md:block ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-black'} p-2 rounded transition-colors`}>
                <X size={20} />
              </button>
              
              {!result && !isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
                  <Layers size={64} className="mb-4" />
                  <p className="font-mono text-lg uppercase tracking-widest font-bold">Awaiting Input Parameters</p>
                  <p className="font-mono text-xs max-w-sm mt-2">Configure the model profile in the adjacent panel to generate architectural schematics.</p>
                </div>
              ) : isGenerating ? (
                 <div className="flex-1 flex flex-col items-center justify-center">
                  <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin ${darkMode ? 'border-green-500' : 'border-green-600'}`}></div>
                  <p className="font-mono text-sm mt-6 animate-pulse uppercase tracking-widest">Constructing Manifold Topology...</p>
                </div>
              ) : result ? (
                <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto pb-4">
                  <div className={`border-b pb-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <h3 className={`font-mono text-xl font-bold uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {name} Architecture Summary
                    </h3>
                  </div>
                  
                  {result.imageUrl && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-700 bg-black relative group shadow-lg">
                      <img src={result.imageUrl} alt={`${name} Schema`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-[3px] border-transparent group-hover:border-blue-500/30 transition-colors pointer-events-none rounded-xl"></div>
                    </div>
                  )}

                  <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {result.spec}
                    </Markdown>
                  </div>
                </div>
              ) : null}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion } from 'motion/react';
import { Bot, User, Copy, Volume2, Code2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Typewriter from './Typewriter';
import MessageContextMenu from './MessageContextMenu';
import ManifoldDiagram from './ManifoldDiagram';
import JacobianMap from './JacobianMap';
import { useSpeech } from '../lib/useSpeech';
import { parseLanguage } from '../lib/languageParser';

export default function MessageBubble({ message, index, onDelete, onClear, darkMode, settings, setMessages, onImageClick, viewMode }: any) {
  const { speak } = useSpeech(settings.voiceOutputEnabled);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  
  const showDiagram = message.text.toLowerCase().includes('ncmi-01') || message.text.toLowerCase().includes('manifold');
  const showJacobian = message.text.toLowerCase().includes('jacobian') || message.text.toLowerCase().includes('tensor');

  // Extract code blocks for blueprint view
  const getBlueprintBlocks = (text: string) => {
    // Very simple extraction: anything inside ``` ... ```
    const codeRegex = /```[\s\S]*?```/g;
    const codes = text.match(codeRegex);
    if (codes) return codes;
    // If no code, just return a short snippet or empty string
    return null;
  };

  const codeBlocks = viewMode === 'blueprint' ? getBlueprintBlocks(message.text) : null;

  // Keyword mapping for concept highlighting
  const isSegmentHighlighted = (textStr: string) => {
    if (!activeHighlight) return false;
    const t = textStr.toLowerCase();
    switch (activeHighlight) {
      case 'core':
        return t.includes('manifold') || t.includes('kineto') || t.includes('symbolic') || t.includes('core');
      case 'stress':
        return t.includes('stress') || t.includes('load') || t.includes('pressure');
      case 'singularity':
        return t.includes('jacobian') || t.includes('singularity') || t.includes('unstable') || t.includes('warning');
      case 'stability':
        return t.includes('damped least squares') || t.includes('stabilized') || t.includes('regularization') || t.includes('safe');
      default:
        return false;
    }
  };

  if (viewMode === 'blueprint' && message.role === 'user') {
     return (
       <div className={`p-4 rounded-xl border-l-4 ${darkMode ? 'bg-gray-900 border-blue-500 text-gray-300' : 'bg-white border-blue-400 text-gray-700'} shadow-sm flex flex-col justify-start`}>
         <div className="text-[10px] uppercase font-mono tracking-widest text-blue-500 mb-2 font-bold">Query Parameters</div>
         <div className="font-mono text-sm opacity-80">{message.text}</div>
       </div>
     );
  }

  if (viewMode === 'blueprint' && message.role === 'assistant') {
    return (
       <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-950/80 border-gray-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'} backdrop-blur-md flex flex-col col-span-1 md:col-span-1`}>
         <div className="flex items-center justify-between border-b pb-2 mb-3">
           <div className="flex items-center gap-2">
             <Code2 size={14} className="text-emerald-500" />
             <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 font-bold">Blueprint Output</div>
           </div>
           <div className="text-[10px] font-mono text-gray-500">ID: {index.toString().padStart(4, '0')}</div>
         </div>
         {codeBlocks ? (
           <div className={`prose prose-sm ${darkMode ? 'prose-invert' : ''} max-w-none flex-1 overflow-auto`}>
             {codeBlocks.map((block, i) => (
               <Markdown key={i} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{block}</Markdown>
             ))}
           </div>
         ) : (
           <div className={`text-xs font-mono opacity-60 p-4 border border-dashed rounded ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-gray-100/50'}`}>
             No structural telemetry detected in this node.
           </div>
         )}
         {showDiagram && (
            <div className={`mt-4 p-2 rounded scale-95 origin-top border flex justify-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
               <ManifoldDiagram darkMode={darkMode} onNodeSelect={setActiveHighlight} />
            </div>
         )}
         {showJacobian && (
            <div className={`mt-4 p-2 rounded scale-95 origin-top border flex justify-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <JacobianMap darkMode={darkMode} />
            </div>
         )}
       </div>
    );
  }

  const renderMarkdown = (textParam: string) => {
    return (
      <Markdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: (props) => {
            const textContent = Array.isArray(props.children) 
              ? props.children.map(c => typeof c === 'string' ? c : '').join('') 
              : typeof props.children === 'string' ? props.children : '';
            
            const isHighlighted = isSegmentHighlighted(textContent);
            
            return (
              <p className={`${isHighlighted ? (darkMode ? 'bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] border-l-2 border-blue-400 pl-3 py-1 rounded-r' : 'bg-blue-50 shadow-[0_0_10px_rgba(59,130,246,0.1)] border-l-2 border-blue-500 pl-3 py-1 rounded-r') : 'transition-colors duration-300'}`}>
                {props.children}
              </p>
            );
          },
          li: (props) => {
            const textContent = Array.isArray(props.children) 
              ? props.children.map(c => typeof c === 'string' ? c : '').join('') 
              : typeof props.children === 'string' ? props.children : '';
            
            const isHighlighted = isSegmentHighlighted(textContent);
            return (
              <li className={`${isHighlighted ? (darkMode ? 'text-blue-300 font-bold bg-blue-500/10 px-2 rounded' : 'text-blue-700 font-bold bg-blue-50 px-2 rounded') : 'transition-colors duration-300'}`}>
                {props.children}
              </li>
            );
          }
        }}
      >
        {textParam}
      </Markdown>
    );
  };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`p-4 rounded-xl max-w-2xl group ${darkMode ? (message.role === 'user' ? 'bg-gray-900 text-gray-100' : 'bg-gray-800 text-gray-100') : (message.role === 'user' ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-900')}`}>
        <div className={`flex items-center justify-between mb-1 text-xs font-mono opacity-70 ${darkMode ? 'text-gray-300' : ''}`}>
          <div className="flex items-center gap-2">
            {message.role === 'user' ? <User size={12}/> : <Bot size={12}/>}
            {message.role === 'user' ? 'YOU' : 'LEXI'}
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
            {message.role === 'assistant' && (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(message.text)}
                  className={`hover:text-gray-900 transition p-1 ${darkMode ? 'text-gray-400 hover:text-gray-100' : ''}`}
                  title="Copy response"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => speak(message.text)}
                  className={`hover:text-gray-900 transition p-1 ${darkMode ? 'text-gray-400 hover:text-gray-100' : ''}`}
                  title="Read aloud"
                >
                  <Volume2 size={12} />
                </button>
              </>
            )}
            <MessageContextMenu onDelete={onDelete} onClear={onClear} darkMode={darkMode} />
          </div>
        </div>
        <div className={`prose prose-sm ${darkMode ? 'prose-invert prose-headings:text-white' : 'prose-gray'} max-w-none`}>
          {settings.coreKnowledgeEnabled && message.role === 'user' && (
            <div className="mb-2 p-2 border border-blue-500 rounded text-xs font-mono">
              {(() => {
                const { subject, object } = parseLanguage(message.text);
                return (
                  <>
                    <p><strong>Subject:</strong> {subject}</p>
                    <p><strong>Object:</strong> {object}</p>
                  </>
                );
              })()}
            </div>
          )}
          {message.role === 'assistant' && message.isNew ? (
            <Typewriter 
              text={message.text} 
              speed={5}
              onComplete={() => setMessages((prev: any) => prev.map((msg: any, i: number) => i === index ? { ...msg, isNew: false } : msg))} 
              renderText={(text) => renderMarkdown(text)}
            />
          ) : (
            renderMarkdown(message.text)
          )}
          {showDiagram && (
            <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
              <ManifoldDiagram darkMode={darkMode} onNodeSelect={setActiveHighlight} />
            </div>
          )}
          {message.image && (
            <img 
              src={message.image} 
              alt="Generated content" 
              className="mt-4 rounded-xl shadow-md cursor-pointer hover:opacity-90 transition" 
              referrerPolicy="no-referrer" 
              onClick={() => onImageClick(message.image)}
            />
          )}
          {message.download && (
            <a
              href={message.download.url}
              download={message.download.name}
              className={`inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
            >
              Download {message.download.name}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

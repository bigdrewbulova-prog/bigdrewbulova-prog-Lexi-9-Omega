/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Copy, Settings, Sun, Moon, Mic, ChevronRight, ChevronLeft, Activity, LayoutGrid, MessageSquare, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import Typewriter from './components/Typewriter';
import MessageBubble from './components/MessageBubble';
import DiagnosticNode from './components/DiagnosticNode';
import ModelGeneratorModal from './components/ModelGeneratorModal';
import { parseLanguage } from './lib/languageParser';
import MatrixBackground from './components/MatrixBackground';

type Message = { 
  role: 'user' | 'assistant'; 
  text: string; 
  isNew?: boolean; 
  image?: string; 
  download?: { name: string; url: string } 
};
type UserSettings = { aspectRatio: string; style: string; coreKnowledgeEnabled: boolean; physicsMode: boolean; voiceOutputEnabled: boolean };

const DEFAULT_MESSAGES: Message[] = [
  { role: 'assistant', text: 'Hello. I am Lexi. How can I assist you with your engineering, design, or research work today?' }
];

const DEFAULT_SETTINGS: UserSettings = { aspectRatio: '16:9', style: 'realistic', coreKnowledgeEnabled: false, physicsMode: false, voiceOutputEnabled: false };

const QUICK_PROMPTS = ['Initialize Aurelian Tensor Rig', 'Analyze Kineto-Cognitive Manifold', 'Run MeshBridge Sim'];

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('lexi_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[];
        return parsed.map(m => ({ ...m, isNew: false }));
      } catch (e) {
        console.error('Failed to parse previous messages from localStorage', e);
      }
    }
    return DEFAULT_MESSAGES.map(m => ({ ...m, isNew: false }));
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('lexi_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showModelGenerator, setShowModelGenerator] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'blueprint'>('chat');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('lexi_dark_mode') === 'true');

  useEffect(() => {
    localStorage.setItem('lexi_messages', JSON.stringify(messages));
    localStorage.setItem('lexi_settings', JSON.stringify(settings));
    localStorage.setItem('lexi_dark_mode', String(darkMode));
  }, [messages, settings, darkMode]);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleDelete = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, physicsMode: settings.physicsMode }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.reply, 
        isNew: true, 
        image: data.image,
        download: data.download
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error.', isNew: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative flex flex-col h-screen ${darkMode ? 'bg-gray-950/80 text-white' : 'bg-gray-50 text-gray-900'} font-sans`}>
      <MatrixBackground active={darkMode} />
      <header className={`relative z-10 p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-950/90' : 'border-gray-200 bg-white'} shadow-sm flex items-center justify-between`}>
        <h1 className="text-xl font-medium tracking-tight">Lexi <span className="text-blue-500 font-mono">MeshBridge</span></h1>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 font-mono hidden sm:block">GODMODE // ENABLED</div>
          
          <div className={`flex items-center p-1 rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <button 
              onClick={() => setViewMode('chat')} 
              className={`p-1.5 rounded-md transition flex items-center gap-2 ${viewMode === 'chat' ? (darkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600 shadow-sm') : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
              title="Chat Mode"
            >
              <MessageSquare size={16} />
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold hidden md:inline">Chat</span>
            </button>
            <button 
              onClick={() => setViewMode('blueprint')} 
              className={`p-1.5 rounded-md transition flex items-center gap-2 ${viewMode === 'blueprint' ? (darkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600 shadow-sm') : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
              title="Blueprint View"
            >
              <LayoutGrid size={16} />
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold hidden md:inline">Blueprint</span>
            </button>
          </div>

          <button 
            onClick={() => setShowModelGenerator(true)} 
            className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800 text-green-400' : 'hover:bg-gray-100 text-green-600'}`}
            title="AI Model Generator"
          >
            <Cpu size={20} />
          </button>

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <Activity size={20} className={isSidebarOpen ? 'text-blue-500' : darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setShowSettings(true)} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <Settings size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>
      </header>

      <ModelGeneratorModal 
        isOpen={showModelGenerator} 
        onClose={() => setShowModelGenerator(false)} 
        darkMode={darkMode} 
      />

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`${darkMode ? 'bg-gray-950 border border-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-sm shadow-xl`}
            >
              <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Creation Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Aspect Ratio</label>
                  <select
                    value={settings.aspectRatio}
                    onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value })}
                    className={`w-full p-2 border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'border-gray-300'} rounded-lg`}
                  >
                    <option value="16:9">16:9 (Widescreen)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Language Algorithm</label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.coreKnowledgeEnabled}
                      onChange={(e) => setSettings({ ...settings, coreKnowledgeEnabled: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-gray-900"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enable Core Knowledge</span>
                  </label>
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      checked={settings.physicsMode}
                      onChange={(e) => setSettings({ ...settings, physicsMode: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-gray-900"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enable Physics Mode</span>
                  </label>
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      checked={settings.voiceOutputEnabled}
                      onChange={(e) => setSettings({ ...settings, voiceOutputEnabled: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-gray-900"
                    />
                    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enable Voice Output</span>
                  </label>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`w-full p-3 ${darkMode ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white'} rounded-lg transition`}
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-gray-800 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img src={selectedImage} alt="Full screen" className="max-w-full max-h-full object-contain rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex overflow-hidden">
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-widest backdrop-blur-md transition-all duration-300 shadow-sm ${darkMode ? 'bg-gray-900/60 border-gray-700 text-gray-300' : 'bg-white/60 border-gray-200 text-gray-600'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isSidebarOpen ? 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]' : 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]'}`} />
          <span>{isSidebarOpen ? 'SIMULATION ACTIVE' : 'SYSTEM READY'}</span>
        </div>

        <motion.div layout className={`flex-1 overflow-y-auto p-4 ${viewMode === 'blueprint' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 content-start' : 'space-y-4'}`}>
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              message={m}
              index={i}
              onDelete={() => handleDelete(i)}
              onClear={handleClear}
              darkMode={darkMode}
              settings={settings}
              setMessages={setMessages}
              onImageClick={setSelectedImage}
              viewMode={viewMode}
            />
          ))}
          {isLoading && <div className="text-sm text-gray-500 font-mono p-4">Lexi is processing...</div>}
        </motion.div>
        
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`flex-shrink-0 overflow-hidden border-l z-20 backdrop-blur-2xl ${darkMode ? 'bg-black/50 border-green-500/50 shadow-[-10px_0_30px_rgba(34,197,94,0.15),inset_10px_0_30px_rgba(34,197,94,0.05)]' : 'bg-white/60 border-green-400/50 shadow-[-10px_0_30px_rgba(74,222,128,0.2),inset_10px_0_30px_rgba(74,222,128,0.1)]'}`}
            >
              <div className="w-[320px] h-full relative">
                {/* Extra internal border glow line */}
                <div className={`absolute top-0 bottom-0 left-0 w-[1px] ${darkMode ? 'bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-50 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gradient-to-b from-transparent via-green-500 to-transparent opacity-60 shadow-[0_0_8px_rgba(74,222,128,0.6)]'}`}></div>
                <DiagnosticNode darkMode={darkMode} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`relative z-10 p-4 border-t ${darkMode ? 'border-gray-800 bg-gray-950/90' : 'border-gray-200 bg-white'}`}>
        <div className="flex flex-wrap gap-2 mb-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className={`px-3 py-1 rounded-full text-xs font-mono border transition ${
                darkMode
                  ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className={`flex-1 p-3 border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none`}
            placeholder="MeshBridge commands or research query..."
          />
          <button onClick={sendMessage} className={`p-3 ${darkMode ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white'} rounded-lg transition`}>
            <Send size={20} />
          </button>
          <button 
            onClick={toggleListening}
            className={`p-3 ${isListening ? 'bg-red-500' : darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg transition`}
          >
            <Mic size={20} className={isListening ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>
      </div>
    </div>
  );
}

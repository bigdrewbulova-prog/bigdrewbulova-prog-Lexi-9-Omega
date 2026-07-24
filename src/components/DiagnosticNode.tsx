import { useState } from 'react';
import JacobianMap from './JacobianMap';
import SparklineChart from './SparklineChart';
import { Camera, X, Download } from 'lucide-react';

export default function DiagnosticNode({ darkMode }: { darkMode: boolean }) {
  const [showSnapshot, setShowSnapshot] = useState(false);

  return (
    <div className={`h-full p-4 font-mono text-xs relative overflow-y-auto transition-all duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      <div className={`absolute top-0 left-0 w-full h-[1px] ${darkMode ? 'bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-80 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60 shadow-[0_0_10px_rgba(74,222,128,0.6)]'}`}></div>
      <div className={`font-bold mb-4 uppercase tracking-widest border-b pb-2 flex justify-between items-center ${darkMode ? 'border-green-500/40 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'border-green-300 text-green-600 drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]'}`}>
        <span>DiagnosticNode // Active Module</span>
        <button 
          onClick={() => setShowSnapshot(true)}
          className={`p-1.5 rounded-md transition hover:scale-105 active:scale-95 flex items-center justify-center ${darkMode ? 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-green-50 text-green-600 border border-green-300 hover:bg-green-100'}`}
          title="Capture High-Res Snapshot"
        >
          <Camera size={14} />
        </button>
      </div>
      <div className="mb-4">
        <JacobianMap darkMode={darkMode} />
        <SparklineChart darkMode={darkMode} />
      </div>
      <div className="space-y-3 relative z-10">
        {[
          { label: 'Load Path Singularity', value: '0.000432 [STABLE]', colorClass: 'text-green-400', dropShadow: 'drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' },
          { label: 'Interpolation Kernel', value: 'NCMI-01 // ACTIVE', colorClass: 'text-yellow-400', dropShadow: 'drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' },
          { label: 'Kineto-Cognitive State', value: 'SYNC-ACTIVE', colorClass: 'text-purple-400', dropShadow: 'drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]' },
          { label: 'Jacobian Adjustment', value: '1.0028 // OPTIMIZED', colorClass: 'text-blue-400', dropShadow: 'drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' },
          { label: 'Aurelian Tensor State', value: 'ALIGNED // 4D', colorClass: 'text-pink-400', dropShadow: 'drop-shadow-[0_0_5px_rgba(244,114,182,0.5)]' },
          { label: 'Entropic Heat', value: '34.2 MJ/s', colorClass: 'text-red-400', dropShadow: 'drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' },
        ].map((item, i) => (
          <div key={i} className={`p-3 rounded-lg border backdrop-blur-md transition-all ${darkMode ? 'bg-black/40 border-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-white/60 border-green-300/40 hover:border-green-400 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]'}`}>
            <div className={`mb-1 opacity-80 ${darkMode ? 'text-green-100/60' : 'text-gray-600'}`}>{item.label}</div>
            <div className={`font-bold ${item.colorClass} ${darkMode ? item.dropShadow : ''}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {showSnapshot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-2xl rounded-xl border p-6 font-mono relative shadow-[0_0_40px_rgba(34,197,94,0.15)] ${darkMode ? 'bg-black/80 border-green-500/40 text-gray-300' : 'bg-white/90 border-green-400/50 text-gray-700 backdrop-blur-xl'}`}>
            <button 
              onClick={() => setShowSnapshot(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-md transition ${darkMode ? 'text-gray-400 hover:text-white hover:bg-green-500/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-6">
               <Camera className={darkMode ? 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'text-green-600'} />
               <h2 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'text-green-600'}`}>Diagnostic Snapshot Generated</h2>
            </div>
            
            <div className={`p-4 rounded-lg border mb-6 flex justify-center transform scale-125 my-8 ${darkMode ? 'bg-black/60 border-green-500/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]' : 'bg-gray-50 border-gray-200'}`}>
               <JacobianMap darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs mt-10">
              <div>
                <span className="opacity-50 block mb-1">TIMESTAMP:</span>
                <span className={darkMode ? 'text-green-100' : ''}>{new Date().toISOString().split('T')[1].split('.')[0]} UTC</span>
              </div>
              <div>
                <span className="opacity-50 block mb-1">LOAD PATH:</span>
                <span className="text-green-500 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">STABLE</span>
              </div>
              <div>
                <span className="opacity-50 block mb-1">RESOLUTION:</span>
                <span className={darkMode ? 'text-green-100' : ''}>Hi-Res Tensor Mesh</span>
              </div>
               <div>
                <span className="opacity-50 block mb-1">HEAT LOSS:</span>
                <span className="text-red-400 font-bold drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">34.2 MJ/s</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
               <button 
                 onClick={() => setShowSnapshot(false)}
                 className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition flex items-center gap-2 ${darkMode ? 'bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/40 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-300'}`}
               >
                 <Download size={14} />
                 <span>Export Blueprint to File</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

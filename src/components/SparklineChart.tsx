import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function SparklineChart({ darkMode }: { darkMode: boolean }) {
  const [data, setData] = useState<{ time: number; value: number }[]>([]);

  useEffect(() => {
    // Generate initial synthetic data for the last 5 minutes (300 seconds / 2 seconds per tick = 150 points)
    const initialData = Array.from({ length: 150 }).map((_, i) => ({
      time: i,
      value: 0.0004 + (Math.random() * 0.0001 - 0.00005)
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData(prev => {
        // Keep a rolling window of 150 points (5 minutes)
        const newData = prev.length > 150 ? [...prev.slice(1)] : [...prev];
        if (newData.length === prev.length) {
          newData.shift(); // ensure we always remove the oldest if at cap
        }
        newData.push({
          time: prev[prev.length - 1].time + 1,
          value: 0.0004 + (Math.random() * 0.0001 - 0.00005)
        });
        return newData;
      });
    }, 2000); // update every 2 seconds to simulate telemetry

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`mt-2 ${darkMode ? 'opacity-90' : 'opacity-80'} transition-opacity hover:opacity-100 flex flex-col`}>
      <div className={`flex justify-between items-center mb-1 text-[9px] uppercase font-mono tracking-widest ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
        <span>Jacobian Singularity [5m Rolling]</span>
        <span className="flex items-center gap-1 font-bold">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${darkMode ? 'bg-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]' : 'bg-green-500'}`}></span>
          LIVE
        </span>
      </div>
      <div className={`h-12 w-full rounded border overflow-hidden backdrop-blur-md relative ${darkMode ? 'border-green-500/30 bg-black/40 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]' : 'border-green-400/50 bg-white/60 shadow-[inset_0_0_15px_rgba(74,222,128,0.15)]'}`}>
        {/* Subtle grid lines background overlay */}
        <div className={`absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none`}></div>
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: -5 }}>
            <defs>
              <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={darkMode ? "#22c55e" : "#16a34a"} stopOpacity={0.2} />
                <stop offset="50%" stopColor={darkMode ? "#4ade80" : "#22c55e"} stopOpacity={0.8} />
                <stop offset="100%" stopColor={darkMode ? "#86efac" : "#4ade80"} stopOpacity={1} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <YAxis domain={['dataMin - 0.00005', 'dataMax + 0.00005']} hide />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="url(#neonGradient)"
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
              filter={darkMode ? "url(#glow)" : ""}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

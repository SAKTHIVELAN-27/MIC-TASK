'use client';
import { motion } from 'framer-motion';

interface CapacityBarProps {
  registered: number;
  checkedIn: number;
  capacity: number;
}

export function CapacityBar({ registered, checkedIn, capacity }: CapacityBarProps) {
  const regPct = Math.min((registered / capacity) * 100, 100);
  const checkPct = Math.min((checkedIn / capacity) * 100, 100);
  const isWarning = regPct > 85;

  return (
    <div className="glass rounded-xl border border-white/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="tech-label">Event Capacity</div>
        <div className="font-mono text-xs text-gray-400">{registered.toLocaleString()} / {capacity.toLocaleString()} registered</div>
      </div>

      {/* Registration bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Registered</span><span>{regPct.toFixed(1)}%</span>
        </div>
        <div className="capacity-bar">
          <motion.div className={`capacity-bar-fill ${isWarning ? 'warning' : ''}`}
            initial={{ width: 0 }} animate={{ width: `${regPct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
      </div>

      {/* Check-in bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Checked In</span><span>{checkPct.toFixed(1)}%</span>
        </div>
        <div className="capacity-bar">
          <motion.div className="capacity-bar-fill" style={{ background: 'linear-gradient(90deg, #00ff9d, #00ffed)', boxShadow: '0 0 8px rgba(0,255,157,0.5)' }}
            initial={{ width: 0 }} animate={{ width: `${checkPct}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }} />
        </div>
      </div>

      {/* Block visualization */}
      <div className="mt-4 flex gap-0.5 flex-wrap">
        {Array.from({ length: Math.min(50, capacity) }).map((_, i) => {
          const blockPct = i / Math.min(50, capacity);
          const isCheckedIn = blockPct < checkedIn / capacity;
          const isRegistered = blockPct < registered / capacity;
          return (
            <div key={i} className={`h-2.5 flex-1 min-w-[4px] rounded-sm transition-colors ${
              isCheckedIn ? 'bg-green-500 shadow-[0_0_4px_rgba(0,255,157,0.6)]'
              : isRegistered ? 'bg-cyan-500/60'
              : 'bg-white/8'
            }`} />
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-green-500" /><span className="text-gray-400">Checked In</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-cyan-500/60" /><span className="text-gray-400">Registered</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-white/8" /><span className="text-gray-400">Available</span></div>
      </div>
    </div>
  );
}

'use client';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'cyan' | 'green' | 'yellow' | 'red';
  sublabel?: string;
}

const colorMap = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', val: 'text-cyan-300' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', val: 'text-green-300' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', val: 'text-yellow-300' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', val: 'text-red-300' },
};

export function StatCard({ label, value, icon: Icon, color = 'cyan', sublabel }: StatCardProps) {
  const c = colorMap[color];
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="glass rounded-xl border border-white/8 p-5 hover:border-cyan-500/15 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
      <motion.div key={String(value)} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
        className={`text-3xl font-black font-mono ${c.val} mb-1`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </motion.div>
      <div className="tech-label">{label}</div>
      {sublabel && <div className="text-gray-500 text-xs mt-1">{sublabel}</div>}
    </motion.div>
  );
}

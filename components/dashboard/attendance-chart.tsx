'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AttendanceChartProps {
  data: Array<{ time: string; count: number }>;
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl border border-white/8 p-5">
        <div className="tech-label mb-4">Check-ins Over Time</div>
        <div className="h-48 flex items-center justify-center">
          <span className="text-gray-500 text-sm">No check-in data yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-white/8 p-5">
      <div className="tech-label mb-4">Check-ins Over Time</div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: 'rgba(13,21,37,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, color: '#fff', fontSize: 12 }}
            labelStyle={{ color: '#00d4ff' }}
          />
          <Area type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={2} fill="url(#colorCount)" dot={{ fill: '#00d4ff', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#00ffed' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

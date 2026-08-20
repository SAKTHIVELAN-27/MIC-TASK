'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, RefreshCw, AlertCircle } from 'lucide-react';

const SUGGESTED = [
  'How many people have checked in so far?',
  'What percentage of registered attendees are no-shows?',
  'When did check-ins peak?',
  'How many spots are left?',
  'What was the busiest 30-minute period?',
];

export function AIInsightPanel({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [error, setError] = useState('');

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setAnswer(''); setError(''); setAiUnavailable(false); setQuestion(q);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, eventId }) });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Failed to get insights'); return; }
      setStats(data.stats);
      if (data.aiUnavailable) setAiUnavailable(true);
      else setAnswer(data.answer || '');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="tech-label mb-1">Gemini AI</div>
        <h1 className="text-3xl font-black text-white">AI Event Insights</h1>
        <p className="text-gray-400 text-sm mt-1">{eventName}</p>
      </div>

      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="tech-label mb-3">Ask About Your Event</div>
        <div className="flex gap-3">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask(question)}
            placeholder="How many people have checked in so far?"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" />
          <button onClick={() => ask(question)} disabled={loading || !question.trim()}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-semibold px-4 py-3 rounded-xl transition-colors">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-4">
          <div className="tech-label mb-2 text-[10px]">Suggested</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((p) => (
              <button key={p} onClick={() => ask(p)}
                className="text-xs text-gray-400 hover:text-cyan-400 bg-white/3 hover:bg-cyan-500/10 border border-white/8 hover:border-cyan-500/20 rounded-lg px-3 py-1.5 transition-all">{p}</button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="glass rounded-2xl border border-cyan-500/15 p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Analyzing Event Data</div>
            <div className="flex gap-1 mt-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {(answer || aiUnavailable || error) && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass rounded-2xl border border-white/8 p-6">
            {error && <div className="flex items-start gap-3 text-red-400"><AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{error}</p></div>}
            {aiUnavailable && <div className="mb-4 flex items-center gap-2 text-yellow-400 text-sm"><AlertCircle className="w-4 h-4" /><span>AI INSIGHTS TEMPORARILY UNAVAILABLE</span></div>}
            {answer && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-cyan-400" /><span className="tech-label">AI Response</span></div>
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm">{answer}</p>
              </div>
            )}
            {stats && (
              <div className={answer ? 'border-t border-white/5 pt-4' : ''}>
                <div className="tech-label mb-3">{aiUnavailable ? 'Current Statistics' : 'Data Used'}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[['Capacity', stats.capacity],['Registered',stats.registered],['Checked In',stats.checkedIn],['No-Shows',stats.noShows],['Remaining',stats.remaining],['Check-In Rate',`${stats.checkInRate}%`]].map(([label, value]) => (
                    <div key={label} className="bg-white/3 rounded-lg p-3 border border-white/5">
                      <div className="tech-label text-[10px] mb-1">{label}</div>
                      <div className="text-white font-bold font-mono text-sm">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                    </div>
                  ))}
                </div>
                {stats.peakCheckInTime && <div className="mt-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-3 py-2 text-xs text-cyan-400">Peak: <strong>{stats.peakCheckInTime}</strong> — {stats.peakCheckInCount} check-ins</div>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

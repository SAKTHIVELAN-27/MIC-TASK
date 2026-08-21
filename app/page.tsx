'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, QrCode, Shield, Wifi, WifiOff, BarChart3, CheckCircle, ArrowRight, Users, Calendar, Activity, Brain, Lock, Database, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';

function AnimatedNumber({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{value.toLocaleString()}</span>;
}

function CapacityMeter({ filled, total, label }: { filled: number; total: number; label: string }) {
  const pct = (filled / total) * 100;
  const blocks = 20;
  const filledBlocks = Math.round((pct / 100) * blocks);
  return (
    <div className="font-mono text-xs">
      <div className="text-cyan-400/60 mb-1 uppercase tracking-widest text-[10px]">{label}</div>
      <div className="flex gap-0.5 mb-1">
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} className={`h-3 w-2.5 rounded-sm ${ i < filledBlocks ? 'bg-cyan-500 shadow-[0_0_4px_rgba(0,212,255,0.8)]' : 'bg-white/10' }`} />
        ))}
      </div>
      <div className="text-white/70">{filled.toLocaleString()} / {total.toLocaleString()} CHECKED IN</div>
    </div>
  );
}

export default function LandingPage() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const h1 = () => setOnline(true);
    const h2 = () => setOnline(false);
    window.addEventListener('online', h1);
    window.addEventListener('offline', h2);
    return () => { window.removeEventListener('online', h1); window.removeEventListener('offline', h2); };
  }, []);

  const stats = [ { label: 'Events Created', value: 1284, suffix: '' }, { label: 'Registered Attendees', value: 48291, suffix: '' }, { label: 'Check-ins Today', value: 3847, suffix: '' }, { label: 'Active Scanners', value: 24, suffix: '' } ];

  const securityFeatures = [
    { icon: QrCode, title: 'Unique QR Tokens', desc: 'Every registration generates a cryptographically secure token — never reusable.' },
    { icon: Database, title: 'DB-Level Protection', desc: 'PostgreSQL transactions + UNIQUE constraints guarantee exactly one check-in per QR.' },
    { icon: WifiOff, title: 'Offline-First', desc: 'Scanner works without internet. Scans queue locally and sync on reconnection.' },
    { icon: Lock, title: 'Role-Based Auth', desc: 'Server-side authorization — never trust the client for access control.' },
    { icon: Shield, title: 'Capacity Enforcement', desc: 'Atomic DB transactions prevent over-registration even under concurrent load.' },
    { icon: Radio, title: 'Real-Time Sync', desc: 'WebSocket push updates keep all organizer dashboards synchronized instantly.' },
  ];

  const aiPrompts = [
    'How many people have checked in so far?',
    'What percentage of registered attendees are no-shows?',
    'When did check-ins peak today?',
    'How many spots are left?',
    'What was the busiest 30-minute period?',
  ];

  return (
    <div className="min-h-screen bg-[#080d14] text-white overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 glow-bg pointer-events-none" />
      <div className="fixed inset-0 glow-bg-green pointer-events-none" />

      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
                <div className="live-dot" />
                <span className="text-cyan-400 text-xs font-mono uppercase tracking-widest">Real-Time Infrastructure</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
                <span className="block text-white">CHECK IN.</span>
                <span className="block text-glow" style={{ background: 'linear-gradient(90deg, #00d4ff, #00ffed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LIVE.</span>
                <span className="block text-white">VERIFIED.</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-xl">
                Production-grade event management and QR-based check-in platform for modern campus events. Real-time attendance, AI analytics, and offline-first scanning.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/30 text-sm">
                  Create Event <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/events" className="inline-flex items-center gap-2 border border-white/10 hover:border-cyan-500/30 hover:bg-white/5 text-white px-8 py-4 rounded-xl transition-all text-sm">
                  Browse Events
                </Link>
              </div>
            </motion.div>

            {/* Hero visual */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <div className="glass rounded-2xl border border-cyan-500/15 p-6 space-y-4">
                {/* Event header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="tech-label mb-1">Event Command Center</div>
                    <div className="text-white font-bold text-lg">TechFest 2026</div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                    <div className="live-dot" />
                    <span className="text-green-400 text-xs font-mono">LIVE</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[{ l: 'REGISTERED', v: '1,248' }, { l: 'CHECKED IN', v: '982' }, { l: 'REMAINING', v: '266' }, { l: 'CAPACITY', v: '1,500' }].map((s) => (
                    <div key={s.l} className="bg-white/3 rounded-lg p-3 border border-white/5">
                      <div className="tech-label text-[9px] mb-1">{s.l}</div>
                      <div className="text-white font-bold text-sm font-mono">{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Capacity bar */}
                <CapacityMeter filled={982} total={1500} label="Event Capacity" />

                {/* Recent check-ins */}
                <div className="space-y-2">
                  <div className="tech-label">Recent Check-ins</div>
                  {['Arun K', 'Priya S', 'Rahul M'].map((name, i) => (
                    <motion.div key={name} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.15 }}
                      className="flex items-center gap-3 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#00ff9d]" />
                      <span className="text-white text-xs font-medium">{name}</span>
                      <span className="text-gray-500 text-xs ml-auto font-mono">6:4{2 - i}:0{i * 3}s PM</span>
                    </motion.div>
                  ))}
                </div>

                {/* Network status */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {online ? <Wifi className="w-3.5 h-3.5 text-green-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                    <span className={`text-xs font-mono ${online ? 'text-green-400' : 'text-red-400'}`}>{online ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                  <span className="text-gray-500 text-xs font-mono">3 scanners active</span>
                </div>
              </div>

              {/* Floating QR card */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 glass rounded-xl border border-cyan-500/20 p-3 shadow-xl shadow-cyan-500/10">
                <QrCode className="w-10 h-10 text-cyan-400" />
                <div className="tech-label mt-1 text-[9px]">Scan to Check-In</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 border border-white/5 text-center">
                <div className="text-4xl font-black font-mono text-cyan-400 mb-2">
                  <AnimatedNumber target={stat.value} />
                </div>
                <div className="tech-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="tech-label mb-3">Process</div>
            <h2 className="text-4xl font-black text-white">How It Works</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, step: '01', title: 'REGISTER', desc: 'Sign up for an event. Capacity is enforced at the database level — no race conditions.' },
              { icon: QrCode, step: '02', title: 'GET QR', desc: 'Receive a unique, cryptographically secure QR code linked only to your registration.' },
              { icon: CheckCircle, step: '03', title: 'SCAN & CHECK-IN', desc: 'Organizer scans your QR. Duplicate scans are rejected instantly. Real-time updates everywhere.' },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative glass rounded-2xl border border-white/8 p-8 hover:border-cyan-500/20 transition-colors group">
                <div className="text-[80px] font-black text-white/3 absolute top-4 right-6 leading-none font-mono">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:border-cyan-500/40 transition-colors">
                  <item.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-xs font-mono text-cyan-400/60 tracking-widest mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3 font-mono">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="tech-label mb-3">Security Architecture</div>
            <h2 className="text-4xl font-black text-white">Built for Production</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">Database-level guarantees that hold under concurrent load across multiple server instances.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-xl border border-white/8 p-6 hover:border-cyan-500/15 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="tech-label mb-3">AI Analytics</div>
              <h2 className="text-4xl font-black text-white mb-6">Ask Your Event Anything</h2>
              <p className="text-gray-400 leading-relaxed mb-8">Natural-language queries powered by Google Gemini. The AI only sees real database values — it never invents or estimates data.</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm text-gray-300">Powered by Google Gemini 1.5 Flash</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-3">
              {aiPrompts.map((prompt, i) => (
                <motion.div key={prompt} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="glass rounded-xl border border-white/8 px-4 py-3 flex items-center gap-3 hover:border-cyan-500/20 transition-colors cursor-pointer group">
                  <Brain className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  <span className="text-gray-300 text-sm group-hover:text-white transition-colors">&ldquo;{prompt}&rdquo;</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="glass rounded-3xl border border-cyan-500/15 p-12 relative overflow-hidden">
              <div className="absolute inset-0 glow-bg opacity-50" />
              <div className="relative z-10">
                <div className="tech-label mb-4">Get Started</div>
                <h2 className="text-5xl font-black text-white mb-4">READY TO RUN<br />YOUR NEXT EVENT?</h2>
                <p className="text-gray-400 mb-10 max-w-lg mx-auto">Create events, register attendees, scan QR codes, and view real-time analytics — all in one platform.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/register?role=ORGANIZER" className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/30">
                    <Calendar className="w-5 h-5" /> Create Event
                  </Link>
                  <Link href="/events" className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-white px-8 py-4 rounded-xl transition-all">
                    <Users className="w-5 h-5" /> Browse Events
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Zap className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-gray-400 text-sm">EventSync — Real-Time Event Infrastructure</span>
          </div>
          <div className="text-gray-600 text-xs font-mono">Built with Next.js · PostgreSQL · Socket.IO · Gemini AI</div>
        </div>
      </footer>
    </div>
  );
}

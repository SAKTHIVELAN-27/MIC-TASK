'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Zap, LayoutDashboard, QrCode, BarChart3, Brain, Calendar, User, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = (session?.user as any)?.role;

  const organizerLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/scanner', icon: QrCode, label: 'Scanner' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/ai-insights', icon: Brain, label: 'AI Insights' },
  ];

  const attendeeLinks = [
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/my-events', icon: User, label: 'My Events' },
  ];

  const publicLinks = [
    { href: '/events', icon: Calendar, label: 'Events' },
  ];

  const links = session ? (role === 'ORGANIZER' ? organizerLinks : attendeeLinks) : publicLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-bold text-white hidden sm:block">EventSync</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              {/* Role badge */}
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                role === 'ORGANIZER' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-300'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${ role === 'ORGANIZER' ? 'bg-cyan-400' : 'bg-gray-400' }`} />
                {role}
              </div>

              {/* User menu */}
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 glass rounded-lg px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <span className="text-cyan-400 text-xs font-bold">{session.user?.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-white text-xs hidden sm:block max-w-[100px] truncate">{session.user?.name}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-xl border border-white/10 overflow-hidden shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-white text-sm font-medium truncate">{session.user?.name}</p>
                      <p className="text-gray-500 text-xs truncate">{session.user?.email}</p>
                    </div>
                    <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/login' }); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white px-3 py-1.5 transition-colors">Sign In</Link>
              <Link href="/register" className="text-sm bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-1.5 rounded-lg transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile links */}
      {session && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-white/5 flex">
          {links.slice(0, 5).map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${ active ? 'text-cyan-400' : 'text-gray-500' }`}>
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

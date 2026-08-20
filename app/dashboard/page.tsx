import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';
import { ArrowRight, Plus, Calendar, Users, CheckCircle, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id!, status: { not: 'CANCELLED' } },
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: 'asc' },
  });

  const eventsWithStats = await Promise.all(
    events.map(async (event) => {
      const checkedIn = await prisma.checkIn.count({ where: { registration: { eventId: event.id } } });
      return { ...event, checkedIn };
    })
  );

  const totalRegistered = eventsWithStats.reduce((s, e) => s + e._count.registrations, 0);
  const totalCheckedIn = eventsWithStats.reduce((s, e) => s + e.checkedIn, 0);

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="tech-label mb-1">Organizer Dashboard</div>
            <h1 className="text-3xl font-black text-white">Command Center</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, <span className="text-cyan-400">{session.user.name}</span></p>
          </div>
          <Link href="/dashboard/create" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Event
          </Link>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: events.length, icon: Calendar, color: 'text-cyan-400' },
            { label: 'Total Registered', value: totalRegistered, icon: Users, color: 'text-cyan-400' },
            { label: 'Total Checked In', value: totalCheckedIn, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Active Events', value: eventsWithStats.filter(e => e.status === 'PUBLISHED').length, icon: Zap, color: 'text-yellow-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl border border-white/8 p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <div className="text-2xl font-black font-mono text-white">{stat.value.toLocaleString()}</div>
              <div className="tech-label mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Events */}
        {eventsWithStats.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-16 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-white font-bold text-xl mb-2">NO EVENTS YET</div>
            <p className="text-gray-400 text-sm mb-6">Your event infrastructure starts here.</p>
            <Link href="/dashboard/create" className="inline-flex items-center gap-2 bg-cyan-500 text-black font-semibold px-6 py-2.5 rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Create First Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsWithStats.map((event) => {
              const pct = Math.min((event._count.registrations / event.capacity) * 100, 100);
              return (
                <div key={event.id} className="glass rounded-2xl border border-white/8 hover:border-cyan-500/20 transition-all overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        {event.status === 'PUBLISHED' && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="live-dot" style={{ width: 6, height: 6 }} />
                            <span className="text-green-400 text-[10px] font-mono">LIVE</span>
                          </div>
                        )}
                        <h3 className="text-white font-bold truncate">{event.name}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">{formatDate(event.date)} · {event.venue}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-white/3 rounded-lg p-2 text-center">
                        <div className="text-white font-bold font-mono">{event._count.registrations}</div>
                        <div className="text-gray-500 text-[10px]">Registered</div>
                      </div>
                      <div className="bg-green-500/5 rounded-lg p-2 text-center border border-green-500/10">
                        <div className="text-green-400 font-bold font-mono">{event.checkedIn}</div>
                        <div className="text-gray-500 text-[10px]">Checked In</div>
                      </div>
                    </div>

                    <div className="capacity-bar mb-1">
                      <div className="capacity-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-gray-500 text-[10px] font-mono text-right">{pct.toFixed(0)}% capacity</div>
                  </div>

                  <div className="px-5 pb-5 flex gap-2">
                    <Link href={`/dashboard/${event.id}`} className="flex-1 flex items-center justify-between bg-white/3 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 rounded-lg px-3 py-2 text-xs text-gray-300 hover:text-cyan-400 transition-all">
                      Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/scanner/${event.id}`} className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg px-3 py-2 text-xs text-cyan-400 transition-all">
                      Scanner
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';
import { BarChart3, ArrowRight, Calendar, MapPin, Users, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AnalyticsSelectPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id, status: { not: 'CANCELLED' } },
    include: {
      _count: { select: { registrations: true } },
    },
    orderBy: { date: 'desc' },
  });

  const eventsWithStats = await Promise.all(
    events.map(async (event) => {
      const checkedIn = await prisma.checkIn.count({
        where: { registration: { eventId: event.id } },
      });
      return { ...event, checkedIn };
    })
  );

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <div className="tech-label mb-1">Performance & Trends</div>
          <h1 className="text-3xl font-black text-white">Event Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Select an event to view real-time check-in velocity, hourly breakdown, and export attendance records.
          </p>
        </div>

        {eventsWithStats.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Events Found</h3>
            <p className="text-gray-400 text-sm mb-6">Create an event to view attendance analytics.</p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {eventsWithStats.map((event) => {
              const regCount = event._count.registrations;
              const rate = regCount > 0 ? Math.round((event.checkedIn / regCount) * 100) : 0;
              return (
                <div
                  key={event.id}
                  className="glass rounded-2xl border border-white/8 hover:border-cyan-500/30 transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cyan-400 text-xs font-mono font-semibold">
                        {rate}% Turnout
                      </span>
                      <span className="text-gray-400 font-mono text-xs">
                        {event.checkedIn} / {regCount} Checked In
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 truncate">{event.name}</h3>

                    <div className="space-y-1.5 text-xs text-gray-400 mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400/60" />
                        <span>{formatDate(event.date)} · {event.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400/60" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/analytics/${event.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-white hover:text-cyan-300 font-semibold py-3 rounded-xl text-sm transition-all"
                  >
                    <BarChart3 className="w-4 h-4 text-cyan-400" /> View Analytics <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

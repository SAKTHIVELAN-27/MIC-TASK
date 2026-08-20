import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';
import { QrCode, ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ScannerSelectPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id, status: { not: 'CANCELLED' } },
    include: {
      _count: { select: { registrations: true } },
    },
    orderBy: { date: 'asc' },
  });

  // If there's only 1 published event, redirect directly to scanner for speed
  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED');
  if (publishedEvents.length === 1 && events.length === 1) {
    redirect(`/scanner/${publishedEvents[0].id}`);
  }

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
          <div className="tech-label mb-1">Check-In Operations</div>
          <h1 className="text-3xl font-black text-white">Select Event to Scan</h1>
          <p className="text-gray-400 text-sm mt-1">
            Choose an active event to start scanning attendee QR codes with your camera.
          </p>
        </div>

        {eventsWithStats.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 text-center">
            <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Active Events</h3>
            <p className="text-gray-400 text-sm mb-6">Create an event before launching the scanner.</p>
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
              const isLive = event.status === 'PUBLISHED';
              return (
                <div
                  key={event.id}
                  className="glass rounded-2xl border border-white/8 hover:border-cyan-500/30 transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {isLive ? (
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-0.5">
                          <div className="live-dot" style={{ width: 6, height: 6 }} />
                          <span className="text-green-400 text-[10px] font-mono">LIVE</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[10px] font-mono uppercase">
                          {event.status}
                        </span>
                      )}
                      <span className="text-gray-400 font-mono text-xs">
                        {event.checkedIn} / {event._count.registrations} checked in
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
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-cyan-400/60" />
                        <span>{event.capacity} Capacity</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/scanner/${event.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <QrCode className="w-4 h-4" /> Launch Scanner <ArrowRight className="w-4 h-4" />
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

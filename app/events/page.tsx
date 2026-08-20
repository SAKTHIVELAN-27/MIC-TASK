import { prisma } from '@/lib/db';
import { Navbar } from '@/components/layout/navbar';
import { EventCard } from '@/components/events/event-card';
import { Calendar, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  const events = await prisma.event.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: {
      organizer: { select: { name: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { date: 'asc' },
  });

  const eventsWithStats = await Promise.all(
    events.map(async (event) => {
      const checkedIn = await prisma.checkIn.count({ where: { registration: { eventId: event.id } } });
      let userReg = null;
      if (session?.user?.id) {
        userReg = await prisma.registration.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        });
      }
      return { ...event, checkedIn, userRegistration: userReg };
    })
  );

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="tech-label mb-1">All Events</div>
            <h1 className="text-3xl font-black text-white">Event Directory</h1>
          </div>
          {role === 'ORGANIZER' && (
            <Link href="/dashboard/create" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
              <Plus className="w-4 h-4" /> Create Event
            </Link>
          )}
        </div>

        {eventsWithStats.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-16 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-white font-bold text-xl mb-2">NO EVENTS YET</div>
            <p className="text-gray-400 text-sm mb-6">Your event infrastructure starts here.</p>
            {role === 'ORGANIZER' && (
              <Link href="/dashboard/create" className="inline-flex items-center gap-2 bg-cyan-500 text-black font-semibold px-6 py-2.5 rounded-lg text-sm">
                <Plus className="w-4 h-4" /> Create First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsWithStats.map((event) => (
              <EventCard key={event.id} event={event} isRegistered={!!event.userRegistration} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

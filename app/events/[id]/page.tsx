import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { EventRegisterButton } from '@/components/events/event-register-button';
import { Calendar, MapPin, Clock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { id },
    include: { organizer: { select: { name: true } }, _count: { select: { registrations: true } } },
  });

  if (!event) notFound();

  const checkedIn = await prisma.checkIn.count({ where: { registration: { eventId: id } } });
  const pct = Math.min((event._count.registrations / event.capacity) * 100, 100);
  const remaining = event.capacity - event._count.registrations;
  const isFull = remaining <= 0;

  let userRegistration = null;
  if (session?.user?.id) {
    userRegistration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId: id } },
      include: { qrToken: true, checkIn: true },
    });
  }

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <Link href="/events" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Events
        </Link>

        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="p-8 border-b border-white/5">
            {event.status === 'PUBLISHED' && (
              <div className="flex items-center gap-1.5 mb-3">
                <div className="live-dot" style={{ width: 6, height: 6 }} />
                <span className="text-green-400 text-xs font-mono">LIVE EVENT</span>
              </div>
            )}
            <h1 className="text-4xl font-black text-white mb-3">{event.name}</h1>
            <p className="text-gray-400 leading-relaxed">{event.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="p-8 space-y-4">
              <div className="tech-label mb-3">Event Details</div>
              {[
                { icon: Calendar, label: 'Date', value: formatDate(event.date) },
                { icon: Clock, label: 'Time', value: `${event.startTime} – ${event.endTime}` },
                { icon: MapPin, label: 'Venue', value: event.venue },
                { icon: User, label: 'Organizer', value: event.organizer.name },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">{label}</div>
                    <div className="text-white text-sm font-medium">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8">
              <div className="tech-label mb-3">Capacity</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Registered', value: event._count.registrations, color: 'text-white' },
                  { label: 'Checked In', value: checkedIn, color: 'text-green-400' },
                  { label: 'Spots Left', value: remaining, color: isFull ? 'text-red-400' : 'text-cyan-400' },
                  { label: 'Capacity', value: event.capacity, color: 'text-white' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/3 rounded-xl p-4 border border-white/5">
                    <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
                    <div className="text-gray-400 text-xs mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="capacity-bar mb-2">
                <div className={`capacity-bar-fill ${pct > 85 ? 'warning' : ''}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-gray-500 text-xs font-mono text-right mb-6">{pct.toFixed(1)}% full</div>
              <EventRegisterButton eventId={id} isFull={isFull} isLoggedIn={!!session?.user} userRegistration={userRegistration as any} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

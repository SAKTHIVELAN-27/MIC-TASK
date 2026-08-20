import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, QrCode, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { MyEventsList } from '@/components/events/my-events-list';

export const dynamic = 'force-dynamic';

export default async function MyEventsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const registrations = await prisma.registration.findMany({
    where: { userId: session.user.id },
    include: {
      event: { include: { organizer: { select: { name: true } } } },
      qrToken: true,
      checkIn: { include: { station: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <div className="tech-label mb-1">Attendee Portal</div>
          <h1 className="text-3xl font-black text-white">My Events</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, <span className="text-cyan-400">{session.user.name}</span></p>
        </div>

        <MyEventsList registrations={registrations as any} />

        {registrations.length === 0 && (
          <div className="glass rounded-2xl border border-white/8 p-16 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-white font-bold text-xl mb-2">NO REGISTRATIONS YET</div>
            <p className="text-gray-400 text-sm mb-6">Browse upcoming events and register to get your QR pass.</p>
            <Link href="/events" className="inline-flex items-center gap-2 bg-cyan-500 text-black font-semibold px-6 py-2.5 rounded-lg text-sm">
              Browse Events <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

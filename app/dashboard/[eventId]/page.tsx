import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { StatCard } from '@/components/dashboard/stat-card';
import { CapacityBar } from '@/components/dashboard/capacity-bar';
import { AttendanceChart } from '@/components/dashboard/attendance-chart';
import { CheckInFeed } from '@/components/dashboard/checkin-feed';
import { getEventStats } from '@/lib/analytics';
import Link from 'next/link';
import { Users, CheckCircle, UserX, QrCode, Download, Brain, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EventDashboardPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: { select: { id: true, name: true } } },
  });

  if (!event) notFound();
  if (event.organizer.id !== session.user.id) redirect('/dashboard');

  const stats = await getEventStats(eventId);

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { registration: { eventId } },
    include: {
      registration: { include: { user: { select: { name: true } } } },
      station: true,
    },
    orderBy: { checkedInAt: 'desc' },
    take: 20,
  });

  const feedItems = recentCheckIns.map((c) => ({
    attendeeName: c.registration.user.name,
    checkedInAt: c.checkedInAt.toISOString(),
    stationName: c.station?.name,
  }));

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-3 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-1">
              <div className="tech-label">Event Command Center</div>
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-0.5">
                <div className="live-dot" style={{ width: 6, height: 6 }} />
                <span className="text-green-400 text-[10px] font-mono">LIVE</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white">{event.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{formatDate(event.date)} · {event.startTime} – {event.endTime} · {event.venue}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/scanner/${eventId}`} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              <QrCode className="w-4 h-4" /> Open Scanner
            </Link>
            <a href={`/api/export/${eventId}`} className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </a>
            <Link href={`/ai-insights/${eventId}`} className="flex items-center gap-2 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 px-4 py-2 rounded-lg text-sm transition-colors">
              <Brain className="w-4 h-4" /> AI Insights
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Registered" value={stats?.registeredCount ?? 0} icon="users" color="cyan" />
          <StatCard label="Checked In" value={stats?.checkedInCount ?? 0} icon="check-circle" color="green" />
          <StatCard label="No-Shows" value={stats?.noShowCount ?? 0} icon="user-x" color="yellow" />
          <StatCard label="Remaining" value={stats?.remainingCapacity ?? 0} icon="users" color="cyan" sublabel={`of ${event.capacity} capacity`} />
        </div>

        <div className="mb-6">
          <CapacityBar registered={stats?.registeredCount ?? 0} checkedIn={stats?.checkedInCount ?? 0} capacity={event.capacity} />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <AttendanceChart data={stats?.chartData ?? []} />
          </div>
          <div className="lg:col-span-2">
            <CheckInFeed eventId={eventId} initialItems={feedItems} />
          </div>
        </div>
      </main>
    </div>
  );
}

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { AttendanceChart } from '@/components/dashboard/attendance-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { CapacityBar } from '@/components/dashboard/capacity-bar';
import { getEventStats } from '@/lib/analytics';
import Link from 'next/link';
import { ArrowLeft, Download, Brain, Users, CheckCircle, UserX, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { organizer: { select: { id: true } } } });
  if (!event) notFound();
  if (event.organizer.id !== session.user.id) redirect('/dashboard');
  const stats = await getEventStats(eventId);
  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/dashboard/${eventId}`} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-3 transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Dashboard</Link>
            <div className="tech-label mb-1">Analytics</div>
            <h1 className="text-3xl font-black text-white">{event.name}</h1>
          </div>
          <div className="flex gap-2">
            <a href={`/api/export/${eventId}`} className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"><Download className="w-4 h-4" /> Export CSV</a>
            <Link href={`/ai-insights/${eventId}`} className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg text-sm transition-colors"><Brain className="w-4 h-4" /> AI Insights</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Registered" value={stats?.registeredCount ?? 0} icon="users" color="cyan" />
          <StatCard label="Checked In" value={stats?.checkedInCount ?? 0} icon="check-circle" color="green" />
          <StatCard label="No-Shows" value={stats?.noShowCount ?? 0} icon="user-x" color="yellow" />
          <StatCard label="Check-In Rate" value={`${stats?.checkInRate ?? 0}%`} icon="trending-up" color="cyan" />
        </div>
        <div className="mb-6"><CapacityBar registered={stats?.registeredCount ?? 0} checkedIn={stats?.checkedInCount ?? 0} capacity={event.capacity} /></div>
        <AttendanceChart data={stats?.chartData ?? []} />
        {stats?.peakTime && (
          <div className="mt-4 glass rounded-xl border border-cyan-500/15 p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <div><div className="text-white font-semibold text-sm">Peak Check-In Period</div><div className="text-gray-400 text-xs">{stats.peakTime} — {stats.peakCount} check-ins in this 30-min window</div></div>
          </div>
        )}
      </main>
    </div>
  );
}

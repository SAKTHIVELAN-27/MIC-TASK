import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { AIInsightPanel } from '@/components/ai/ai-insight-panel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AIInsightsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { organizer: { select: { id: true } } } });
  if (!event) notFound();
  if (event.organizer.id !== session.user.id) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <Link href={`/dashboard/${eventId}`} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Event Dashboard
        </Link>
        <AIInsightPanel eventId={eventId} eventName={event.name} />
      </main>
    </div>
  );
}

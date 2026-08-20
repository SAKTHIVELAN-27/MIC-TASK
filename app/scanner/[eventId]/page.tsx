import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { QRScannerClient } from '@/components/scanner/qr-scanner-client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ScannerPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ORGANIZER') redirect('/my-events');

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: { select: { id: true } }, stations: true },
  });

  if (!event) notFound();
  if (event.organizer.id !== session.user.id) redirect('/dashboard');

  const defaultStation = event.stations[0] ?? null;

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <Link href={`/dashboard/${eventId}`} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Event Dashboard
        </Link>
        <QRScannerClient eventId={eventId} eventName={event.name} stationId={defaultStation?.id} stationName={defaultStation?.name ?? 'Main Entrance'} />
      </main>
    </div>
  );
}

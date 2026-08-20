import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Navbar } from '@/components/layout/navbar';
import { CheckInActionCard } from '@/components/checkin/checkin-action-card';
import { generateQRCodeDataURL } from '@/lib/qr';
import { QrCode, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  // 1. Find the QR token
  let qrToken = await prisma.qRToken.findUnique({
    where: { token },
    include: {
      registration: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          event: {
            include: {
              organizer: { select: { id: true, name: true, email: true } },
              stations: true,
            },
          },
          checkIn: { include: { station: true } },
        },
      },
    },
  });

  // Fallback: Check if token is registrationCode or registration id
  if (!qrToken) {
    const reg = await prisma.registration.findFirst({
      where: {
        OR: [{ registrationCode: token }, { id: token }],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: {
          include: {
            organizer: { select: { id: true, name: true, email: true } },
            stations: true,
          },
        },
        checkIn: { include: { station: true } },
        qrToken: true,
      },
    });

    if (reg && reg.qrToken) {
      qrToken = {
        ...reg.qrToken,
        registration: reg,
      };
    }
  }

  // If token is completely invalid
  if (!qrToken) {
    return (
      <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
        <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
        <Navbar />
        <main className="max-w-lg mx-auto px-4 pt-24 pb-8">
          <div className="glass rounded-2xl border border-red-500/30 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Event Pass Not Found</h1>
            <p className="text-gray-400 text-sm">
              The QR token <span className="font-mono text-cyan-400">{token.slice(0, 16)}...</span> was not found in our database or has been removed.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/events"
                className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Browse Events
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { registration } = qrToken;
  const isOrganizer = (session?.user as any)?.role === 'ORGANIZER';
  const isOwner = session?.user?.id === registration.event.organizerId;

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await generateQRCodeDataURL(qrToken.token);
  } catch (err) {
    console.error('Failed to generate QR data URL', err);
  }

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        <CheckInActionCard
          token={qrToken.token}
          registration={registration as any}
          tokenStatus={qrToken.status}
          isOrganizer={isOrganizer}
          isOwner={isOwner}
          qrDataUrl={qrDataUrl}
        />
      </main>
    </div>
  );
}

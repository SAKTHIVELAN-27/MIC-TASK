import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { generateQRCodeDataURL } from '@/lib/qr';
import { QRCodeDisplay } from '@/components/qr/qr-code-display';

export const dynamic = 'force-dynamic';

export default async function QRPage({ params }: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
      qrToken: true,
      checkIn: { include: { station: true } },
    },
  });

  if (!registration) notFound();
  if (registration.userId !== session.user.id) redirect('/my-events');

  let qrDataUrl: string | null = null;
  if (registration.qrToken) {
    qrDataUrl = await generateQRCodeDataURL(registration.qrToken.token);
  }

  return (
    <div className="min-h-screen bg-[#080d14] pb-24 md:pb-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-24 pb-8">
        <QRCodeDisplay registration={registration as any} qrDataUrl={qrDataUrl} />
      </main>
    </div>
  );
}

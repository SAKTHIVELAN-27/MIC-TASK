import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authz';
import { generateQRCodeDataURL } from '@/lib/qr';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
        user: { select: { id: true, name: true, email: true } },
        qrToken: true,
        checkIn: { include: { station: true } },
      },
    });

    if (!registration) {
      return NextResponse.json({ success: false, code: 'NOT_FOUND', message: 'Registration not found' }, { status: 404 });
    }

    // Only the registrant or event organizer can view
    const userId = session!.user!.id;
    const userRole = (session!.user as any).role;
    if (registration.userId !== userId && userRole !== 'ORGANIZER') {
      return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }

    let qrDataUrl: string | null = null;
    if (registration.qrToken) {
      qrDataUrl = await generateQRCodeDataURL(registration.qrToken.token);
    }

    return NextResponse.json({ success: true, registration, qrDataUrl });
  } catch (error) {
    console.error('[GET /api/registrations/[id]]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to fetch registration' }, { status: 500 });
  }
}

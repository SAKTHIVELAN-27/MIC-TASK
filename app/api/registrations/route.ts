import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { registerForEvent } from '@/lib/capacity';
import { generateSecureToken } from '@/lib/qr';
import { z } from 'zod';

const schema = z.object({ eventId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'eventId is required' },
        { status: 400 }
      );
    }

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'User ID missing' }, { status: 401 });
    }

    const token = generateSecureToken();
    const result = await registerForEvent(userId, parsed.data.eventId, token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, code: result.code, message: result.message },
        { status: result.code === 'EVENT_FULL' ? 409 : result.code === 'ALREADY_REGISTERED' ? 409 : 400 }
      );
    }

    return NextResponse.json({ success: true, registrationId: result.registrationId, token: result.token }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/registrations]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Registration failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const { prisma } = await import('@/lib/db');
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'User ID missing' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    const where: any = { userId };
    if (eventId) where.eventId = eventId;

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        event: true,
        qrToken: true,
        checkIn: { include: { station: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('[GET /api/registrations]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to fetch registrations' }, { status: 500 });
  }
}

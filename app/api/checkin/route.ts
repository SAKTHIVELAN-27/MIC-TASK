import { NextRequest, NextResponse } from 'next/server';
import { processCheckIn } from '@/lib/checkin';
import { requireAuth } from '@/lib/authz';
import { emitCheckIn } from '@/lib/socket-server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  stationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', message: 'token is required' }, { status: 400 });
    }

    const { token, stationId } = parsed.data;
    const result = await processCheckIn(token, stationId);

    if (result.success) {
      // Emit real-time update via Socket.IO
      try {
        const qrToken = await prisma.qRToken.findUnique({
          where: { token },
          include: { registration: { include: { user: true, event: true } } },
        });
        if (qrToken) {
          emitCheckIn(qrToken.registration.eventId, {
            attendeeName: result.attendeeName,
            registrationCode: result.registrationCode,
            checkedInAt: result.checkedInAt,
            stationName: result.stationName,
          });
        }
      } catch (e) {
        // Non-critical: real-time update failure should not block response
        console.error('[Socket emit error]', e);
      }

      return NextResponse.json({
        success: true,
        attendeeName: result.attendeeName,
        registrationCode: result.registrationCode,
        checkedInAt: result.checkedInAt,
        stationName: result.stationName,
      });
    } else {
      const statusCode =
        result.code === 'ALREADY_CHECKED_IN' ? 409
        : result.code === 'INVALID_QR' ? 404
        : result.code === 'EXPIRED_QR' ? 410
        : 400;

      return NextResponse.json({
        success: false,
        code: result.code,
        message: result.message,
        attendeeName: result.attendeeName,
        checkedInAt: result.checkedInAt,
        stationName: result.stationName,
      }, { status: statusCode });
    }
  } catch (error) {
    console.error('[POST /api/checkin]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Check-in failed' }, { status: 500 });
  }
}

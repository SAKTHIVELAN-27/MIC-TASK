import { NextRequest, NextResponse } from 'next/server';
import { requireEventOwner } from '@/lib/authz';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { error } = await requireEventOwner(eventId);
  if (error) return error;

  try {
    const [event, registeredCount, checkedInCount, recentCheckIns, stations] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.registration.count({ where: { eventId } }),
      prisma.checkIn.count({ where: { registration: { eventId } } }),
      prisma.checkIn.findMany({
        where: { registration: { eventId } },
        include: {
          registration: { include: { user: { select: { name: true, email: true } } } },
          station: true,
        },
        orderBy: { checkedInAt: 'desc' },
        take: 20,
      }),
      prisma.scannerStation.findMany({ where: { eventId } }),
    ]);

    if (!event) {
      return NextResponse.json({ success: false, code: 'EVENT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      event,
      stats: {
        registered: registeredCount,
        checkedIn: checkedInCount,
        remaining: event.capacity - registeredCount,
        capacity: event.capacity,
        noShows: registeredCount - checkedInCount,
      },
      recentCheckIns,
      stations,
    });
  } catch (error) {
    console.error('[GET /api/dashboard/[eventId]]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrganizer } from '@/lib/authz';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const createEventSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  venue: z.string().min(3).max(200),
  capacity: z.number().int().min(1).max(100000),
});

// GET /api/events — list all published events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine') === 'true';
    const session = await auth();

    const where: any = {};
    if (mine && session?.user) {
      where.organizerId = session.user.id;
    } else {
      where.status = { not: 'CANCELLED' };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { name: true, email: true } },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Add checked-in count
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const checkedInCount = await prisma.checkIn.count({
          where: { registration: { eventId: event.id } },
        });
        return { ...event, checkedInCount };
      })
    );

    return NextResponse.json({ success: true, events: eventsWithStats });
  } catch (error) {
    console.error('[GET /api/events]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events — create event (organizer only)
export async function POST(req: NextRequest) {
  const { error, session } = await requireOrganizer();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, description, date, startTime, endTime, venue, capacity } = parsed.data;

    const organizerId = session?.user?.id;
    if (!organizerId) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'User ID missing' }, { status: 401 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        startTime,
        endTime,
        venue,
        capacity,
        organizerId,
        status: 'PUBLISHED',
      },
    });

    // Create a default scanner station
    await prisma.scannerStation.create({
      data: {
        name: 'Main Entrance',
        eventId: event.id,
        organizerId,
      },
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/events]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to create event' }, { status: 500 });
  }
}

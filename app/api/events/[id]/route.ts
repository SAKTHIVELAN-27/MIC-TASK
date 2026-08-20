import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEventOwner } from '@/lib/authz';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const updateEventSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().min(3).max(200).optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        _count: { select: { registrations: true } },
        stations: true,
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, code: 'EVENT_NOT_FOUND', message: 'Event not found' }, { status: 404 });
    }

    const checkedInCount = await prisma.checkIn.count({
      where: { registration: { eventId: id } },
    });

    // Check if current user is registered
    let userRegistration = null;
    if (session?.user?.id) {
      userRegistration = await prisma.registration.findUnique({
        where: { userId_eventId: { userId: session.user.id, eventId: id } },
        include: { qrToken: true, checkIn: true },
      });
    }

    return NextResponse.json({
      success: true,
      event: { ...event, checkedInCount },
      userRegistration,
    });
  } catch (error) {
    console.error('[GET /api/events/[id]]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireEventOwner(id);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (data.date) data.date = new Date(data.date);

    const event = await prisma.event.update({ where: { id }, data });
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('[PUT /api/events/[id]]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireEventOwner(id);
  if (error) return error;

  try {
    await prisma.event.update({ where: { id }, data: { status: 'CANCELLED' } });
    return NextResponse.json({ success: true, message: 'Event cancelled' });
  } catch (error) {
    console.error('[DELETE /api/events/[id]]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to cancel event' }, { status: 500 });
  }
}

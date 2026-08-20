import { auth } from './auth';
import { prisma } from './db';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireOrganizer() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  if ((session!.user as any).role !== 'ORGANIZER') {
    return { error: NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Organizer access required' }, { status: 403 }), session: null };
  }
  return { error: null, session: session! };
}

export async function requireEventOwner(eventId: string) {
  const { error, session } = await requireOrganizer();
  if (error) return { error, session: null };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { error: NextResponse.json({ success: false, code: 'EVENT_NOT_FOUND', message: 'Event not found' }, { status: 404 }), session: null };
  }
  if (event.organizerId !== session!.user!.id) {
    return { error: NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'You do not own this event' }, { status: 403 }), session: null };
  }
  return { error: null, session: session!, event };
}

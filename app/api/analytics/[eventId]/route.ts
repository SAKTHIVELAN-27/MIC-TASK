import { NextRequest, NextResponse } from 'next/server';
import { getEventStats } from '@/lib/analytics';
import { requireEventOwner } from '@/lib/authz';

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { error } = await requireEventOwner(eventId);
  if (error) return error;

  try {
    const stats = await getEventStats(eventId);
    if (!stats) {
      return NextResponse.json({ success: false, code: 'EVENT_NOT_FOUND', message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('[GET /api/analytics/[eventId]]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Failed to fetch analytics' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireEventOwner } from '@/lib/authz';
import { getEventStats } from '@/lib/analytics';
import { askAI } from '@/lib/ai';
import { z } from 'zod';

const schema = z.object({
  question: z.string().min(3).max(500),
  eventId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', message: 'question and eventId are required' }, { status: 400 });
    }

    const { question, eventId } = parsed.data;

    // Verify organizer owns this event
    const { error } = await requireEventOwner(eventId);
    if (error) return error;

    // Fetch real DB stats — AI never invents data
    const stats = await getEventStats(eventId);
    if (!stats) {
      return NextResponse.json({ success: false, code: 'EVENT_NOT_FOUND', message: 'Event not found' }, { status: 404 });
    }

    // Safe context object — only computed values
    const context = {
      eventName: stats.eventName,
      capacity: stats.capacity,
      registered: stats.registeredCount,
      checkedIn: stats.checkedInCount,
      remaining: stats.remainingCapacity,
      noShows: stats.noShowCount,
      noShowPercentage: stats.noShowPercentage,
      peakCheckInTime: stats.peakTime,
      peakCheckInCount: stats.peakCount,
      checkInRate: stats.checkInRate,
    };

    try {
      const answer = await askAI(question, context);
      return NextResponse.json({ success: true, answer, stats: context });
    } catch (aiError: any) {
      // AI unavailable — return stats as fallback
      console.error('[AI Error]', aiError);
      return NextResponse.json({
        success: true,
        answer: null,
        aiUnavailable: true,
        stats: context,
      });
    }
  } catch (error) {
    console.error('[POST /api/ai/insights]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'AI insights failed' }, { status: 500 });
  }
}

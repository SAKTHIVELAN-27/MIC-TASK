import { NextRequest, NextResponse } from 'next/server';
import { requireEventOwner } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { stringify } from 'csv-stringify/sync';

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { error, event } = await requireEventOwner(eventId);
  if (error) return error;

  try {
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: { select: { name: true, email: true } },
        checkIn: { include: { station: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = registrations.map((reg) => ([
      reg.user.name,
      reg.user.email,
      reg.registrationCode,
      reg.createdAt.toISOString(),
      reg.checkIn ? 'Checked In' : 'Not Checked In',
      reg.checkIn?.checkedInAt?.toISOString() ?? '',
      reg.checkIn?.station?.name ?? '',
    ]));

    const csv = stringify(
      [['Name', 'Email', 'Registration ID', 'Registered At', 'Check-In Status', 'Check-In Time', 'Station'], ...rows],
      { quoted: true }
    );

    const eventName = (event as any)?.name?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'event';
    const filename = `attendance_${eventName}_${Date.now()}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/export/[eventId]]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Export failed' }, { status: 500 });
  }
}

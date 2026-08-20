import { NextRequest, NextResponse } from 'next/server';
import { processCheckIn } from '@/lib/checkin';
import { requireAuth } from '@/lib/authz';
import { prisma } from '@/lib/db';
import { emitCheckIn } from '@/lib/socket-server';
import { z } from 'zod';

const scanSchema = z.object({
  token: z.string().min(1),
  scannedAt: z.string(),
  deviceId: z.string().optional(),
  localScanId: z.string().optional(),
  stationId: z.string().optional(),
});

const syncSchema = z.array(scanSchema);

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid sync payload' }, { status: 400 });
    }

    const results = [];

    for (const scan of parsed.data) {
      const result = await processCheckIn(scan.token, scan.stationId);

      // Log to OfflineSyncLog
      const logData: any = {
        token: scan.token,
        scannedAt: new Date(scan.scannedAt),
        syncedAt: new Date(),
        deviceId: scan.deviceId,
        localScanId: scan.localScanId,
      };

      if (result.success) {
        logData.status = 'SYNCED';
        // Emit real-time
        try {
          const qrToken = await prisma.qRToken.findUnique({
            where: { token: scan.token },
            include: { registration: { select: { eventId: true } } },
          });
          if (qrToken) {
            emitCheckIn(qrToken.registration.eventId, {
              attendeeName: result.attendeeName,
              registrationCode: result.registrationCode,
              checkedInAt: result.checkedInAt,
              stationName: result.stationName,
              offlineSync: true,
            });
          }
        } catch (_) {}
      } else if (result.code === 'ALREADY_CHECKED_IN') {
        logData.status = 'CONFLICT';
        logData.conflictReason = 'ALREADY_CHECKED_IN';
        logData.conflictTime = result.checkedInAt;
        logData.conflictStation = result.stationName;
      } else {
        logData.status = 'CONFLICT';
        logData.conflictReason = result.code;
      }

      await prisma.offlineSyncLog.create({ data: logData });

      results.push({
        localScanId: scan.localScanId,
        token: scan.token,
        success: result.success,
        code: result.success ? 'SYNCED' : (result as any).code,
        message: result.success ? 'Synchronized successfully' : (result as any).message,
        attendeeName: result.success ? result.attendeeName : (result as any).attendeeName,
        conflictTime: result.success ? undefined : (result as any).checkedInAt,
        conflictStation: result.success ? undefined : (result as any).stationName,
      });
    }

    const synced = results.filter((r) => r.success).length;
    const conflicts = results.filter((r) => !r.success).length;

    return NextResponse.json({ success: true, results, synced, conflicts });
  } catch (error) {
    console.error('[POST /api/checkin/offline-sync]', error);
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Sync failed' }, { status: 500 });
  }
}

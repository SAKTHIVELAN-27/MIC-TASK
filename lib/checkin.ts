import { prisma } from './db';

export type CheckInResult =
  | { success: true; attendeeName: string; registrationCode: string; checkedInAt: Date; stationName?: string }
  | { success: false; code: string; message: string; attendeeName?: string; checkedInAt?: Date; stationName?: string };

export async function processCheckIn(token: string, stationId?: string): Promise<CheckInResult> {
  // Use a transaction with serializable isolation to guarantee atomicity
  return prisma.$transaction(
    async (tx) => {
      const cleanToken = token.trim();
      // 1. Find the QR token
      let qrToken = await tx.qRToken.findUnique({
        where: { token: cleanToken },
        include: {
          registration: {
            include: {
              user: true,
              event: true,
              checkIn: {
                include: { station: true },
              },
            },
          },
        },
      });

      // Fallback: Check if attendee showed registration code instead of QR token
      if (!qrToken) {
        const reg = await tx.registration.findFirst({
          where: {
            OR: [
              { registrationCode: cleanToken },
              { id: cleanToken },
            ],
          },
          include: {
            user: true,
            event: true,
            qrToken: true,
            checkIn: {
              include: { station: true },
            },
          },
        });

        if (reg && reg.qrToken) {
          qrToken = {
            ...reg.qrToken,
            registration: reg,
          };
        }
      }

      if (!qrToken) {
        return { success: false as const, code: 'INVALID_QR', message: 'Invalid QR code or pass not found' };
      }

      if (qrToken.status === 'REVOKED') {
        return { success: false as const, code: 'EXPIRED_QR', message: 'This QR code has been revoked' };
      }

      const { registration } = qrToken;

      // 2. Check if already checked in
      if (registration.checkIn) {
        return {
          success: false as const,
          code: 'ALREADY_CHECKED_IN',
          message: 'Attendee already checked in',
          attendeeName: registration.user.name,
          checkedInAt: registration.checkIn.checkedInAt,
          stationName: registration.checkIn.station?.name,
        };
      }

      // 3. Atomically create the check-in record
      // The UNIQUE constraint on registrationId guarantees only one succeeds
      const checkIn = await tx.checkIn.create({
        data: {
          registrationId: registration.id,
          stationId: stationId ?? null,
          checkedInAt: new Date(),
        },
        include: { station: true },
      });

      // 4. Mark token as USED
      await tx.qRToken.update({
        where: { id: qrToken.id },
        data: { status: 'USED', usedAt: new Date() },
      });

      return {
        success: true as const,
        attendeeName: registration.user.name,
        registrationCode: registration.registrationCode,
        checkedInAt: checkIn.checkedInAt,
        stationName: checkIn.station?.name,
      };
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

import { prisma } from './db';

export type RegistrationResult =
  | { success: true; registrationId: string; token: string }
  | { success: false; code: string; message: string };

export async function registerForEvent(
  userId: string,
  eventId: string,
  token: string
): Promise<RegistrationResult> {
  return prisma.$transaction(
    async (tx) => {
      // 1. Fetch event and check capacity atomically
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      });

      if (!event) {
        return { success: false as const, code: 'EVENT_NOT_FOUND', message: 'Event not found' };
      }

      if (event._count.registrations >= event.capacity) {
        return { success: false as const, code: 'EVENT_FULL', message: 'This event is at full capacity' };
      }

      // 2. Check for duplicate registration
      const existing = await tx.registration.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (existing) {
        return { success: false as const, code: 'ALREADY_REGISTERED', message: 'You are already registered for this event' };
      }

      // 3. Create registration + QR token atomically
      const registration = await tx.registration.create({
        data: {
          userId,
          eventId,
          qrToken: {
            create: { token },
          },
        },
      });

      return {
        success: true as const,
        registrationId: registration.id,
        token,
      };
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

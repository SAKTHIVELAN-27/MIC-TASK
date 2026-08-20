import { prisma } from './db';

export async function getEventStats(eventId: string) {
  const [event, registeredCount, checkedInCount, checkIns] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.registration.count({ where: { eventId } }),
    prisma.checkIn.count({ where: { registration: { eventId } } }),
    prisma.checkIn.findMany({
      where: { registration: { eventId } },
      orderBy: { checkedInAt: 'asc' },
      select: { checkedInAt: true },
    }),
  ]);

  if (!event) return null;

  const noShowCount = registeredCount - checkedInCount;
  const noShowPercentage = registeredCount > 0 ? (noShowCount / registeredCount) * 100 : 0;
  const remainingCapacity = event.capacity - registeredCount;

  // Calculate peak check-in time (30-min buckets)
  const buckets: Record<string, number> = {};
  checkIns.forEach(({ checkedInAt }) => {
    const d = new Date(checkedInAt);
    const hour = d.getHours();
    const min = d.getMinutes() < 30 ? '00' : '30';
    const key = `${hour.toString().padStart(2, '0')}:${min}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  const peakEntry = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  const peakTime = peakEntry ? peakEntry[0] : null;
  const peakCount = peakEntry ? peakEntry[1] : 0;

  // Check-ins per hour for chart
  const hourlyBuckets: Record<string, number> = {};
  checkIns.forEach(({ checkedInAt }) => {
    const d = new Date(checkedInAt);
    const key = `${d.getHours().toString().padStart(2, '0')}:00`;
    hourlyBuckets[key] = (hourlyBuckets[key] || 0) + 1;
  });

  const chartData = Object.entries(hourlyBuckets)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, count]) => ({ time, count }));

  return {
    eventName: event.name,
    capacity: event.capacity,
    registeredCount,
    checkedInCount,
    noShowCount,
    noShowPercentage: Math.round(noShowPercentage * 100) / 100,
    remainingCapacity,
    peakTime,
    peakCount,
    chartData,
    checkInRate: registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 100) : 0,
  };
}

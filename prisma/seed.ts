import 'dotenv/config';
import { Role, EventStatus } from '@prisma/client';
import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 32);

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.offlineSyncLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.qRToken.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.scannerStation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create organizers
  const [org1, org2] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Arjun Mehta',
        email: 'organizer@demo.com',
        password: hashedPassword,
        role: Role.ORGANIZER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Kavya Sharma',
        email: 'kavya@demo.com',
        password: hashedPassword,
        role: Role.ORGANIZER,
      },
    }),
  ]);

  // Create attendees
  const attendeeNames = [
    'Arun Kumar', 'Priya Suresh', 'Rahul Mehta', 'Sneha Patel', 'Vikram Singh',
    'Divya Nair', 'Kiran Reddy', 'Ananya Iyer', 'Rohit Verma', 'Meera Krishnan',
    'Arjun Das', 'Pooja Shah', 'Nikhil Joshi', 'Swati Gupta', 'Suresh Babu',
    'Lakshmi Rao', 'Amit Tiwari', 'Deepa Menon', 'Sanjay Kumar', 'Ritu Agarwal',
  ];

  const attendees = await Promise.all(
    attendeeNames.map((name, i) =>
      prisma.user.create({
        data: {
          name,
          email: `attendee${i + 1}@demo.com`,
          password: hashedPassword,
          role: Role.ATTENDEE,
        },
      })
    )
  );

  // Create events
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 3);

  const [event1, event2, event3] = await Promise.all([
    prisma.event.create({
      data: {
        name: 'TechFest 2026',
        description: 'The ultimate technology festival featuring workshops, hackathons, and keynote speakers from top tech companies.',
        date: tomorrow,
        startTime: '09:00',
        endTime: '18:00',
        venue: 'Main Auditorium, Block A',
        capacity: 100,
        status: EventStatus.PUBLISHED,
        organizerId: org1.id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Cultural Night 2026',
        description: 'An evening of music, dance, and art celebrating the rich cultural diversity of our campus.',
        date: nextWeek,
        startTime: '18:00',
        endTime: '22:00',
        venue: 'Open Air Theatre',
        capacity: 200,
        status: EventStatus.PUBLISHED,
        organizerId: org2.id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'AI Summit 2026',
        description: 'A premier conference exploring the frontiers of artificial intelligence, machine learning, and data science.',
        date: lastWeek,
        startTime: '10:00',
        endTime: '17:00',
        venue: 'Conference Hall, Block C',
        capacity: 50,
        status: EventStatus.COMPLETED,
        organizerId: org1.id,
      },
    }),
  ]);

  // Create scanner stations
  const [station1, station2] = await Promise.all([
    prisma.scannerStation.create({
      data: { name: 'Main Entrance', eventId: event1.id, organizerId: org1.id },
    }),
    prisma.scannerStation.create({
      data: { name: 'Side Gate', eventId: event1.id, organizerId: org1.id },
    }),
  ]);

  // Register all attendees for event1 (TechFest)
  const event1Registrations = await Promise.all(
    attendees.slice(0, 18).map((attendee) =>
      prisma.registration.create({
        data: {
          userId: attendee.id,
          eventId: event1.id,
          qrToken: { create: { token: nanoid() } },
        },
        include: { qrToken: true },
      })
    )
  );

  // Register some attendees for event2
  await Promise.all(
    attendees.slice(0, 12).map((attendee) =>
      prisma.registration.create({
        data: {
          userId: attendee.id,
          eventId: event2.id,
          qrToken: { create: { token: nanoid() } },
        },
      })
    )
  );

  // Register all attendees for event3 (AI Summit - completed)
  const event3Registrations = await Promise.all(
    attendees.slice(0, 20).map((attendee) =>
      prisma.registration.create({
        data: {
          userId: attendee.id,
          eventId: event3.id,
          qrToken: { create: { token: nanoid() } },
        },
        include: { qrToken: true },
      })
    )
  );

  // Check-in 12 attendees for event1 at different times
  const checkInTimes = [
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 5),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 18),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 32),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 2),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 15),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 45),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 10),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 28),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 5),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 22),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 10),
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 5),
  ];

  await Promise.all(
    event1Registrations.slice(0, 12).map((reg, i) =>
      prisma.checkIn.create({
        data: {
          registrationId: reg.id,
          stationId: i % 2 === 0 ? station1.id : station2.id,
          checkedInAt: checkInTimes[i],
        },
      })
    )
  );

  // Check-in all 20 for event3 (completed event) with varied times
  const aiSummitDate = lastWeek;
  await Promise.all(
    event3Registrations.map((reg, i) =>
      prisma.checkIn.create({
        data: {
          registrationId: reg.id,
          checkedInAt: new Date(
            aiSummitDate.getFullYear(),
            aiSummitDate.getMonth(),
            aiSummitDate.getDate(),
            10 + Math.floor(i / 4),
            (i * 7) % 60
          ),
        },
      })
    )
  );

  console.log('✅ Seed complete!');
  console.log(`\n📧 Demo Credentials:`);
  console.log(`   Organizer: organizer@demo.com / password123`);
  console.log(`   Attendee:  attendee1@demo.com / password123`);
  console.log(`\n🎉 Created:`);
  console.log(`   2 organizers, 20 attendees`);
  console.log(`   3 events (TechFest, Cultural Night, AI Summit)`);
  console.log(`   50 registrations, 32 check-ins`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

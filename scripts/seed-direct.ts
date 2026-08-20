import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

const { Pool } = pg;
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 32);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('🌱 Seeding Neon PostgreSQL database...');

  // Clean up
  await pool.query('DELETE FROM offline_sync_logs');
  await pool.query('DELETE FROM check_ins');
  await pool.query('DELETE FROM qr_tokens');
  await pool.query('DELETE FROM registrations');
  await pool.query('DELETE FROM scanner_stations');
  await pool.query('DELETE FROM events');
  await pool.query('DELETE FROM users');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. Create Organizers
  const org1Res = await pool.query(
    `INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ORGANIZER', NOW(), NOW()) RETURNING id`,
    ['org_arjun', 'Arjun Mehta', 'organizer@demo.com', hashedPassword]
  );
  const org2Res = await pool.query(
    `INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ORGANIZER', NOW(), NOW()) RETURNING id`,
    ['org_kavya', 'Kavya Sharma', 'kavya@demo.com', hashedPassword]
  );
  const org1Id = org1Res.rows[0].id;
  const org2Id = org2Res.rows[0].id;

  // 2. Create 20 Attendees
  const attendeeNames = [
    'Arun Kumar', 'Priya Suresh', 'Rahul Mehta', 'Sneha Patel', 'Vikram Singh',
    'Divya Nair', 'Kiran Reddy', 'Ananya Iyer', 'Rohit Verma', 'Meera Krishnan',
    'Arjun Das', 'Pooja Shah', 'Nikhil Joshi', 'Swati Gupta', 'Suresh Babu',
    'Lakshmi Rao', 'Amit Tiwari', 'Deepa Menon', 'Sanjay Kumar', 'Ritu Agarwal',
  ];

  const attendeeIds: string[] = [];
  for (let i = 0; i < attendeeNames.length; i++) {
    const id = `att_${i + 1}`;
    const name = attendeeNames[i];
    const email = `attendee${i + 1}@demo.com`;
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'ATTENDEE', NOW(), NOW())`,
      [id, name, email, hashedPassword]
    );
    attendeeIds.push(id);
  }

  // 3. Create Events
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 3);

  const event1Res = await pool.query(
    `INSERT INTO events (id, name, description, date, "startTime", "endTime", venue, capacity, status, "organizerId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLISHED', $9, NOW(), NOW()) RETURNING id`,
    [
      'evt_techfest',
      'TechFest 2026',
      'The ultimate technology festival featuring workshops, hackathons, and keynote speakers from top tech companies.',
      tomorrow,
      '09:00',
      '18:00',
      'Main Auditorium, Block A',
      100,
      org1Id,
    ]
  );
  const event2Res = await pool.query(
    `INSERT INTO events (id, name, description, date, "startTime", "endTime", venue, capacity, status, "organizerId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLISHED', $9, NOW(), NOW()) RETURNING id`,
    [
      'evt_cultural',
      'Cultural Night 2026',
      'An evening of music, dance, and art celebrating the rich cultural diversity of our campus.',
      nextWeek,
      '18:00',
      '22:00',
      'Open Air Theatre',
      200,
      org2Id,
    ]
  );
  const event3Res = await pool.query(
    `INSERT INTO events (id, name, description, date, "startTime", "endTime", venue, capacity, status, "organizerId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'COMPLETED', $9, NOW(), NOW()) RETURNING id`,
    [
      'evt_aisummit',
      'AI Summit 2026',
      'A premier conference exploring the frontiers of artificial intelligence, machine learning, and data science.',
      lastWeek,
      '10:00',
      '17:00',
      'Conference Hall, Block C',
      50,
      org1Id,
    ]
  );

  const event1Id = event1Res.rows[0].id;
  const event2Id = event2Res.rows[0].id;
  const event3Id = event3Res.rows[0].id;

  // 4. Scanner Stations
  const st1Res = await pool.query(
    `INSERT INTO scanner_stations (id, name, "eventId", "organizerId", "createdAt")
     VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
    ['stn_main', 'Main Entrance', event1Id, org1Id]
  );
  const st2Res = await pool.query(
    `INSERT INTO scanner_stations (id, name, "eventId", "organizerId", "createdAt")
     VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
    ['stn_side', 'Side Gate', event1Id, org1Id]
  );
  const station1Id = st1Res.rows[0].id;
  const station2Id = st2Res.rows[0].id;

  // 5. Registrations for Event 1 (18 attendees)
  const event1RegIds: string[] = [];
  for (let i = 0; i < 18; i++) {
    const regId = `reg_e1_${i + 1}`;
    const code = `EVT-TF-${String(i + 1).padStart(4, '0')}`;
    await pool.query(
      `INSERT INTO registrations (id, "userId", "eventId", "registrationCode", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [regId, attendeeIds[i], event1Id, code]
    );
    await pool.query(
      `INSERT INTO qr_tokens (id, token, status, "registrationId", "createdAt")
       VALUES ($1, $2, 'ACTIVE', $3, NOW())`,
      [`token_e1_${i + 1}`, nanoid(), regId]
    );
    event1RegIds.push(regId);
  }

  // 6. Check in 12 attendees for Event 1
  for (let i = 0; i < 12; i++) {
    const regId = event1RegIds[i];
    const stationId = i % 2 === 0 ? station1Id : station2Id;
    const checkInTime = new Date(Date.now() - (12 - i) * 15 * 60 * 1000);
    await pool.query(
      `INSERT INTO check_ins (id, "registrationId", "stationId", "checkedInAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [`chk_e1_${i + 1}`, regId, stationId, checkInTime]
    );
    await pool.query(
      `UPDATE qr_tokens SET status = 'USED', "usedAt" = $1 WHERE "registrationId" = $2`,
      [checkInTime, regId]
    );
  }

  // 7. Registrations for Event 2 (12 attendees)
  for (let i = 0; i < 12; i++) {
    const regId = `reg_e2_${i + 1}`;
    const code = `EVT-CN-${String(i + 1).padStart(4, '0')}`;
    await pool.query(
      `INSERT INTO registrations (id, "userId", "eventId", "registrationCode", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [regId, attendeeIds[i], event2Id, code]
    );
    await pool.query(
      `INSERT INTO qr_tokens (id, token, status, "registrationId", "createdAt")
       VALUES ($1, $2, 'ACTIVE', $3, NOW())`,
      [`token_e2_${i + 1}`, nanoid(), regId]
    );
  }

  // 8. Registrations + Check-ins for Event 3 (20 attendees, all checked in)
  for (let i = 0; i < 20; i++) {
    const regId = `reg_e3_${i + 1}`;
    const code = `EVT-AI-${String(i + 1).padStart(4, '0')}`;
    await pool.query(
      `INSERT INTO registrations (id, "userId", "eventId", "registrationCode", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [regId, attendeeIds[i], event3Id, code]
    );
    const token = nanoid();
    const checkInTime = new Date(lastWeek.getTime() + (10 + Math.floor(i / 4)) * 3600000 + ((i * 7) % 60) * 60000);
    await pool.query(
      `INSERT INTO qr_tokens (id, token, status, "registrationId", "usedAt", "createdAt")
       VALUES ($1, $2, 'USED', $3, $4, NOW())`,
      [`token_e3_${i + 1}`, token, regId, checkInTime]
    );
    await pool.query(
      `INSERT INTO check_ins (id, "registrationId", "checkedInAt", "createdAt")
       VALUES ($1, $2, $3, NOW())`,
      [`chk_e3_${i + 1}`, regId, checkInTime]
    );
  }

  console.log('\n✅ Neon Database Seeding Complete!');
  console.log('\n📧 Demo Credentials:');
  console.log('   Organizer: organizer@demo.com / password123');
  console.log('   Attendee:  attendee1@demo.com / password123');
  console.log('\n🎉 Created in Neon Cloud Database:');
  console.log('   2 Organizers, 20 Attendees');
  console.log('   3 Events (TechFest 2026, Cultural Night 2026, AI Summit 2026)');
  console.log('   50 Registrations, 32 Check-Ins');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

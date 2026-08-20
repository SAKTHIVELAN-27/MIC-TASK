#!/usr/bin/env node
/**
 * EventSync Concurrency Test Suite
 * Tests database-level duplicate check-in protection and capacity enforcement on Neon.
 * Run: node scripts/concurrency-test.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { Pool } = require('pg');
const { customAlphabet } = require('nanoid');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 30,
});

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 32);
const CONCURRENT_REQUESTS = 100;
const TEST_CAPACITY = 10;
const REGISTRATION_ATTEMPTS = 50;

async function testDuplicateCheckIn() {
  console.log('\n' + '='.repeat(60));
  console.log('  TEST 1: DUPLICATE CHECK-IN PROTECTION (CONCURRENT)');
  console.log('='.repeat(60));
  console.log(`Firing ${CONCURRENT_REQUESTS} simultaneous check-in attempts on the SAME QR token...`);

  // Find an active QR token
  const tokenRes = await pool.query(
    `SELECT t.id, t.token, t."registrationId", r."eventId"
     FROM qr_tokens t
     JOIN registrations r ON r.id = t."registrationId"
     WHERE t.status = 'ACTIVE'
     LIMIT 1`
  );

  if (!tokenRes.rows.length) {
    console.log('⚠️ No active QR tokens found. Re-run seed first.');
    return null;
  }

  const { token, registrationId } = tokenRes.rows[0];

  // Execute 100 simultaneous transactions
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, async (_, i) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const checkToken = await client.query(
        `SELECT id, status FROM qr_tokens WHERE token = $1 FOR UPDATE`,
        [token]
      );

      if (!checkToken.rows.length || checkToken.rows[0].status !== 'ACTIVE') {
        await client.query('ROLLBACK');
        return { success: false, reason: 'TOKEN_ALREADY_USED' };
      }

      const existingCheckin = await client.query(
        `SELECT id FROM check_ins WHERE "registrationId" = $1`,
        [registrationId]
      );

      if (existingCheckin.rows.length > 0) {
        await client.query('ROLLBACK');
        return { success: false, reason: 'ALREADY_CHECKED_IN' };
      }

      await client.query(
        `INSERT INTO check_ins (id, "registrationId", "checkedInAt", "createdAt")
         VALUES ($1, $2, NOW(), NOW())`,
        [`chk_test_${i}_${Date.now()}`, registrationId]
      );

      await client.query(
        `UPDATE qr_tokens SET status = 'USED', "usedAt" = NOW() WHERE id = $1`,
        [checkToken.rows[0].id]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (e) {
      await client.query('ROLLBACK');
      return { success: false, reason: e.code === '40001' ? 'SERIALIZATION_FAILURE' : e.message };
    } finally {
      client.release();
    }
  });

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.success).length;
  const rejected = results.filter((r) => !r.success).length;

  const dbCountRes = await pool.query(
    `SELECT COUNT(*) as count FROM check_ins WHERE "registrationId" = $1`,
    [registrationId]
  );
  const dbCount = parseInt(dbCountRes.rows[0].count, 10);

  const passed = successes === 1 && dbCount === 1;

  console.log(`\n  Requests fired:    ${CONCURRENT_REQUESTS}`);
  console.log(`  ✅ Successful:      ${successes}`);
  console.log(`  ❌ Rejected:        ${rejected}`);
  console.log(`  📊 DB Total Stored: ${dbCount}`);
  console.log(`  Result:            ${passed ? '✅ PASSED (Strictly 1 check-in recorded)' : '❌ FAILED'}`);

  return { successes, rejected, dbCount, passed };
}

async function testCapacityEnforcement() {
  console.log('\n' + '='.repeat(60));
  console.log('  TEST 2: CAPACITY ENFORCEMENT UNDER CONCURRENCY');
  console.log('='.repeat(60));
  console.log(`Creating test event with capacity = ${TEST_CAPACITY}...`);
  console.log(`Firing ${REGISTRATION_ATTEMPTS} simultaneous registration attempts...`);

  // Create temporary event
  const org = await pool.query(`SELECT id FROM users WHERE role = 'ORGANIZER' LIMIT 1`);
  const orgId = org.rows[0].id;
  const testEventId = `evt_concurrency_${Date.now()}`;

  await pool.query(
    `INSERT INTO events (id, name, description, date, "startTime", "endTime", venue, capacity, status, "organizerId", "createdAt", "updatedAt")
     VALUES ($1, 'Concurrency Test Event', 'Testing capacity limits', NOW(), '10:00', '18:00', 'Virtual', $2, 'PUBLISHED', $3, NOW(), NOW())`,
    [testEventId, TEST_CAPACITY, orgId]
  );

  // Create temporary test users
  const hash = await bcrypt.hash('pass', 6);
  const userIds = [];
  for (let i = 0; i < REGISTRATION_ATTEMPTS; i++) {
    const uid = `usr_conc_${i}_${Date.now()}`;
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'ATTENDEE', NOW(), NOW())`,
      [uid, `User ${i}`, `test_conc_${i}_${Date.now()}@test.com`, hash]
    );
    userIds.push(uid);
  }

  // Fire all concurrent registration transactions
  const promises = userIds.map(async (userId, idx) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Atomic capacity check
      const countRes = await client.query(
        `SELECT COUNT(*) as count FROM registrations WHERE "eventId" = $1`,
        [testEventId]
      );
      const currentCount = parseInt(countRes.rows[0].count, 10);

      if (currentCount >= TEST_CAPACITY) {
        await client.query('ROLLBACK');
        return { success: false, reason: 'EVENT_FULL' };
      }

      const regId = `reg_conc_${idx}_${Date.now()}`;
      await client.query(
        `INSERT INTO registrations (id, "userId", "eventId", "registrationCode", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [regId, userId, testEventId, `CODE-${idx}`]
      );

      await client.query(
        `INSERT INTO qr_tokens (id, token, status, "registrationId", "createdAt")
         VALUES ($1, $2, 'ACTIVE', $3, NOW())`,
        [`tok_conc_${idx}`, nanoid(), regId]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (e) {
      await client.query('ROLLBACK');
      return { success: false, reason: e.code === '40001' ? 'SERIALIZATION_CONFLICT' : e.message };
    } finally {
      client.release();
    }
  });

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.success).length;
  const rejected = results.filter((r) => !r.success).length;

  const finalCountRes = await pool.query(
    `SELECT COUNT(*) as count FROM registrations WHERE "eventId" = $1`,
    [testEventId]
  );
  const finalCount = parseInt(finalCountRes.rows[0].count, 10);

  const passed = finalCount <= TEST_CAPACITY;

  console.log(`\n  Target Capacity:    ${TEST_CAPACITY}`);
  console.log(`  Requests Fired:     ${REGISTRATION_ATTEMPTS}`);
  console.log(`  ✅ Successful:       ${successes}`);
  console.log(`  ❌ Rejected:         ${rejected}`);
  console.log(`  📊 DB Total Count:  ${finalCount}`);
  console.log(`  Result:             ${passed ? `✅ PASSED (Capacity ${finalCount} ≤ ${TEST_CAPACITY})` : '❌ FAILED'}`);

  // Cleanup test event
  await pool.query(`DELETE FROM qr_tokens WHERE "registrationId" IN (SELECT id FROM registrations WHERE "eventId" = $1)`, [testEventId]);
  await pool.query(`DELETE FROM registrations WHERE "eventId" = $1`, [testEventId]);
  await pool.query(`DELETE FROM events WHERE id = $1`, [testEventId]);
  await pool.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);

  return { successes, rejected, finalCount, passed };
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('     EVENTSYNC NEON CONCURRENCY & DEDUPLICATION TEST');
  console.log('='.repeat(60));

  const r1 = await testDuplicateCheckIn();
  const r2 = await testCapacityEnforcement();

  console.log('\n' + '='.repeat(60));
  console.log('  FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  if (r1) console.log(`  Duplicate Check-In Protection: ${r1.passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (r2) console.log(`  Capacity Concurrency Limit:    ${r2.passed ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = (r1?.passed ?? false) && (r2?.passed ?? false);
  console.log(`\n  OVERALL STATUS: ${allPassed ? '✅ ALL CONCURRENCY TESTS PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60) + '\n');

  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  pool.end();
  process.exit(1);
});

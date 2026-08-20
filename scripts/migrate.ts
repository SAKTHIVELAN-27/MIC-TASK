import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const ddl = `
-- Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ORGANIZER', 'ATTENDEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'CONFLICT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATTENDEE',
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Create Events table
CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PUBLISHED',
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "events_organizerId_idx" ON "events"("organizerId");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events"("status");

-- Create Scanner Stations table
CREATE TABLE IF NOT EXISTS "scanner_stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scanner_stations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scanner_stations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scanner_stations_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "scanner_stations_eventId_idx" ON "scanner_stations"("eventId");

-- Create Registrations table
CREATE TABLE IF NOT EXISTS "registrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "registrations_registrationCode_key" ON "registrations"("registrationCode");
CREATE UNIQUE INDEX IF NOT EXISTS "registrations_userId_eventId_key" ON "registrations"("userId", "eventId");
CREATE INDEX IF NOT EXISTS "registrations_userId_idx" ON "registrations"("userId");
CREATE INDEX IF NOT EXISTS "registrations_eventId_idx" ON "registrations"("eventId");

-- Create QR Tokens table
CREATE TABLE IF NOT EXISTS "qr_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "registrationId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "qr_tokens_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "qr_tokens_token_key" ON "qr_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "qr_tokens_registrationId_key" ON "qr_tokens"("registrationId");
CREATE INDEX IF NOT EXISTS "qr_tokens_token_idx" ON "qr_tokens"("token");

-- Create CheckIns table
CREATE TABLE IF NOT EXISTS "check_ins" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "stationId" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_ins_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "check_ins_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "scanner_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "check_ins_registrationId_key" ON "check_ins"("registrationId");
CREATE INDEX IF NOT EXISTS "check_ins_registrationId_idx" ON "check_ins"("registrationId");
CREATE INDEX IF NOT EXISTS "check_ins_checkedInAt_idx" ON "check_ins"("checkedInAt");

-- Create Offline Sync Logs table
CREATE TABLE IF NOT EXISTS "offline_sync_logs" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "deviceId" TEXT,
    "localScanId" TEXT,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "conflictReason" TEXT,
    "conflictStation" TEXT,
    "conflictTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offline_sync_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "offline_sync_logs_token_idx" ON "offline_sync_logs"("token");
CREATE INDEX IF NOT EXISTS "offline_sync_logs_status_idx" ON "offline_sync_logs"("status");
`;

async function migrate() {
  console.log('⚡ Applying database schema to Neon PostgreSQL...');
  try {
    await pool.query(ddl);
    console.log('✅ All tables, constraints, and indexes created successfully on Neon!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

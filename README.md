# EventSync — Real-Time Event Check-In System

Production-quality event management and QR-based check-in platform built with Next.js 15, TypeScript, PostgreSQL, Socket.IO, and Google Gemini AI.

## Features
- QR-Based Check-In (secure unique tokens per registration)
- Real-Time Dashboard via Socket.IO WebSockets
- AI Analytics powered by Google Gemini 1.5 Flash
- Offline-First Scanner (works without internet, auto-syncs)
- Database-Level Duplicate Protection (Serializable transactions)
- Capacity Enforcement (atomic DB operations)
- Role-Based Auth (Organizer / Attendee), enforced server-side
- CSV Export of attendance data

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| UI | Framer Motion + Lucide React + Recharts |
| Auth | NextAuth v5 (credentials) |
| Database | PostgreSQL + Prisma ORM |
| Real-Time | Socket.IO |
| AI | Google Gemini 1.5 Flash |
| QR Scanning | html5-qrcode |
| QR Generation | qrcode npm |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local)
- Google Gemini API key (free at https://aistudio.google.com)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Edit `.env.local` with your values.

### 3. Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE eventcheckin;"

# Apply schema
npm run db:push

# Generate client
npm run db:generate

# Seed demo data
npm run db:seed
```

### 4. Start Dev Server
```bash
npm run dev
```
Open http://localhost:3000

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| Organizer | organizer@demo.com | password123 |
| Attendee | attendee1@demo.com | password123 |

## Concurrency Test
```bash
npm run db:seed   # ensure seed data exists
node scripts/concurrency-test.js
```
Expected: 1 successful check-in out of 100 simultaneous attempts. 50 successful registrations out of 150 attempts for a capacity-50 event.

## Security Architecture
- Passwords hashed with bcrypt (12 rounds)
- JWT sessions with role in token
- Server-side authorization on every protected route
- Organizer event ownership verified before mutations
- AI API key never sent to client
- Input validation via Zod on all endpoints
- Duplicate protection via PostgreSQL UNIQUE constraints + Serializable transactions
- Capacity enforcement via atomic DB transactions

## Offline Scanning
The scanner stores scans in localStorage when offline. On reconnection, scans sync via POST /api/checkin/offline-sync. Conflicts (e.g., attendee already checked in from another station) are safely reported without creating duplicates.

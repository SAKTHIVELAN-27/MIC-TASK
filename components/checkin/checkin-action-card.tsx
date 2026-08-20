'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, MapPin, Calendar, User, Shield, AlertTriangle, ArrowRight, RefreshCw, QrCode } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Props {
  token: string;
  registration: {
    id: string;
    registrationCode: string;
    user: { id: string; name: string; email: string };
    event: {
      id: string;
      name: string;
      date: string | Date;
      startTime: string;
      endTime: string;
      venue: string;
      stations?: Array<{ id: string; name: string }>;
    };
    checkIn: {
      id: string;
      checkedInAt: string | Date;
      station?: { id: string; name: string } | null;
    } | null;
  };
  tokenStatus: 'ACTIVE' | 'USED' | 'REVOKED';
  isOrganizer: boolean;
  isOwner: boolean;
  qrDataUrl: string | null;
}

export function CheckInActionCard({
  token,
  registration,
  tokenStatus,
  isOrganizer,
  isOwner,
  qrDataUrl,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(!!registration.checkIn);
  const [checkInData, setCheckInData] = useState(registration.checkIn);
  const [selectedStation, setSelectedStation] = useState<string>(
    registration.event.stations?.[0]?.id || ''
  );

  const handleConfirmCheckIn = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          stationId: selectedStation || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCheckedIn(true);
        setCheckInData({
          id: 'new',
          checkedInAt: data.checkedInAt || new Date().toISOString(),
          station: data.stationName ? { id: selectedStation, name: data.stationName } : null,
        });
        toast({
          title: 'Check-In Confirmed!',
          description: `${registration.user.name} is now checked in.`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Check-In Notice',
          description: data.message || 'Check-in could not be completed.',
          variant: data.code === 'ALREADY_CHECKED_IN' ? 'destructive' : 'default',
        });
        if (data.code === 'ALREADY_CHECKED_IN') {
          setCheckedIn(true);
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to process check-in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isRevoked = tokenStatus === 'REVOKED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Status Card */}
      <div
        className={`glass rounded-2xl border p-6 sm:p-8 text-center transition-all ${
          isRevoked
            ? 'border-red-500/30 bg-red-500/5'
            : checkedIn
            ? 'border-green-500/30 bg-green-500/5 success-glow'
            : 'border-cyan-500/30 bg-cyan-500/5'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          {isRevoked ? (
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
          ) : checkedIn ? (
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 animate-pulse" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-cyan-400" />
            </div>
          )}

          <div>
            <div className="tech-label mb-1">
              {isRevoked
                ? 'PASS STATUS: REVOKED'
                : checkedIn
                ? 'ATTENDEE VERIFIED'
                : 'EVENT PASS'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {isRevoked
                ? 'Pass Revoked'
                : checkedIn
                ? 'Checked In'
                : 'Valid Event Pass'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isRevoked
                ? 'This ticket is no longer active.'
                : checkedIn
                ? `Attendee has successfully checked in to the event.`
                : 'Ready for entrance check-in.'}
            </p>
          </div>
        </div>

        {/* Check-In Timestamp Badge if Checked In */}
        {checkedIn && checkInData && (
          <div className="mt-6 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-xs text-green-400 font-mono">
            <Clock className="w-4 h-4" />
            <span>Checked In at {formatTime(checkInData.checkedInAt)}</span>
            {checkInData.station && <span>· {checkInData.station.name}</span>}
          </div>
        )}

        {/* Action Button for Organizers/Staff */}
        {!checkedIn && !isRevoked && (
          <div className="mt-6 max-w-sm mx-auto space-y-3">
            {registration.event.stations && registration.event.stations.length > 1 && (
              <div className="text-left">
                <label className="text-xs text-gray-400 mb-1 block">
                  Select Check-in Station:
                </label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {registration.event.stations.map((s) => (
                    <option key={s.id} value={s.id} className="bg-gray-900 text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleConfirmCheckIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Confirm Check-In Now <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-500">
              {isOrganizer
                ? 'Authorized organizer check-in verification'
                : 'Click above to record attendee arrival'}
            </p>
          </div>
        )}
      </div>

      {/* Attendee & Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendee Info Card */}
        <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Attendee Info
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md">
              {registration.registrationCode}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="tech-label text-[10px]">Full Name</div>
              <div className="text-white font-semibold text-base">
                {registration.user.name}
              </div>
            </div>
            <div>
              <div className="tech-label text-[10px]">Email Address</div>
              <div className="text-gray-300 text-sm font-mono truncate">
                {registration.user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Card */}
        <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Event Details
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="tech-label text-[10px]">Event Name</div>
              <div className="text-white font-semibold text-base truncate">
                {registration.event.name}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="tech-label text-[10px]">Date</div>
                <div className="text-gray-300">{formatDate(registration.event.date)}</div>
              </div>
              <div>
                <div className="tech-label text-[10px]">Time</div>
                <div className="text-gray-300">
                  {registration.event.startTime} - {registration.event.endTime}
                </div>
              </div>
            </div>
            <div>
              <div className="tech-label text-[10px]">Venue</div>
              <div className="text-gray-300 text-xs flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="truncate">{registration.event.venue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Pass Preview (if attendee or organizer) */}
      {qrDataUrl && (
        <div className="glass rounded-2xl border border-white/8 p-6 text-center space-y-3">
          <div className="tech-label">Pass QR Visual</div>
          <div className="p-3 bg-white rounded-xl inline-block shadow-lg">
            <img src={qrDataUrl} alt="Pass QR" width={160} height={160} className="block rounded-md" />
          </div>
          <p className="text-xs text-gray-500 font-mono">Token: {token.slice(0, 10)}...</p>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-gray-400">
        <Link
          href="/events"
          className="hover:text-cyan-400 transition-colors flex items-center gap-1"
        >
          ← Browse Events
        </Link>
        {isOrganizer && (
          <Link
            href={`/scanner/${registration.event.id}`}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            Open Live Camera Scanner →
          </Link>
        )}
      </div>
    </motion.div>
  );
}

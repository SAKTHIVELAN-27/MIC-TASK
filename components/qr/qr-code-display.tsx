'use client';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Calendar, MapPin, Shield } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface Props {
  registration: any;
  qrDataUrl: string | null;
}

export function QRCodeDisplay({ registration, qrDataUrl }: Props) {
  const isCheckedIn = !!registration.checkIn;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="text-center">
        <div className="tech-label mb-2">Your Event Pass</div>
        <h1 className="text-2xl font-black text-white">{registration.event.name}</h1>
      </div>
      <div className={`glass rounded-2xl border p-8 text-center ${ isCheckedIn ? 'border-green-500/30 success-glow' : 'border-cyan-500/20' }`}>
        {isCheckedIn && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
            className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-4 mx-auto w-fit">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-semibold">CHECKED IN</span>
          </motion.div>
        )}
        {qrDataUrl ? (
          <div className="relative inline-block my-2">
            <div className="p-4 bg-white rounded-2xl shadow-xl shadow-cyan-500/10 border border-white/20 inline-block">
              <img src={qrDataUrl} alt="QR Code" width={240} height={240} className="block rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="w-60 h-60 mx-auto bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
            <span className="text-gray-500 text-sm">QR unavailable</span>
          </div>
        )}
        {!isCheckedIn && <p className="text-gray-400 text-xs mt-4">Show this QR code at the entrance to check in</p>}
      </div>
      <div className="glass rounded-2xl border border-white/8 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="tech-label mb-0.5">Registration ID</div>
            <div className="text-white font-mono font-bold">{registration.registrationCode}</div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${ isCheckedIn ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' }`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            {isCheckedIn ? 'CHECKED IN' : 'REGISTERED'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Calendar, label: 'Date', value: formatDate(registration.event.date) },
            { icon: Clock, label: 'Time', value: registration.event.startTime },
            { icon: MapPin, label: 'Venue', value: registration.event.venue },
            { icon: Shield, label: 'Attendee', value: registration.user.name },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3 h-3 text-cyan-400/60" /><div className="tech-label text-[10px]">{label}</div></div>
              <div className="text-white text-sm font-medium truncate">{value}</div>
            </div>
          ))}
        </div>
        {isCheckedIn && registration.checkIn && (
          <div className="border-t border-white/5 pt-4">
            <div className="tech-label mb-1">Check-In Details</div>
            <div className="text-green-400 text-sm">Checked in at {formatTime(registration.checkIn.checkedInAt)}{registration.checkIn.station && ` · ${registration.checkIn.station.name}`}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

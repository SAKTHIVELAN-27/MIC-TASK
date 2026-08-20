'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, QrCode, CheckCircle, Clock, ArrowRight, XCircle } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export function MyEventsList({ registrations }: { registrations: any[] }) {
  if (registrations.length === 0) return null;

  return (
    <div className="grid gap-4">
      {registrations.map((reg, i) => (
        <motion.div key={reg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="glass rounded-xl border border-white/8 hover:border-cyan-500/15 transition-all overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg truncate">{reg.event.name}</h3>
                <div className="flex flex-wrap gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400/60" />
                    {formatDate(reg.event.date)} · {reg.event.startTime}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400/60" />
                    {reg.event.venue}
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border flex-shrink-0 ${
                reg.checkIn
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
              }`}>
                {reg.checkIn ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {reg.checkIn ? 'CHECKED IN' : 'REGISTERED'}
              </div>
            </div>

            {reg.checkIn && (
              <div className="mt-3 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2 text-xs">
                <span className="text-green-400">✓ Checked in at {formatTime(reg.checkIn.checkedInAt)}</span>
                {reg.checkIn.station && <span className="text-gray-500 ml-2">— {reg.checkIn.station.name}</span>}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="font-mono text-xs text-gray-500">{reg.registrationCode}</div>
              <Link href={`/my-events/${reg.id}/qr`}
                className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-lg px-3 py-1.5">
                <QrCode className="w-3.5 h-3.5" /> View QR Pass <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

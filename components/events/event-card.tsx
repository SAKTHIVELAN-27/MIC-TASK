'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface EventCardProps {
  event: {
    id: string;
    name: string;
    description: string;
    date: Date | string;
    startTime: string;
    venue: string;
    capacity: number;
    status: string;
    _count: { registrations: number };
    checkedIn: number;
    organizer: { name: string };
  };
  isRegistered?: boolean;
}

export function EventCard({ event, isRegistered }: EventCardProps) {
  const registered = event._count.registrations;
  const pct = Math.min((registered / event.capacity) * 100, 100);
  const isLive = event.status === 'PUBLISHED';
  const isFull = registered >= event.capacity;

  return (
    <motion.div whileHover={{ y: -4 }} className="glass rounded-2xl border border-white/8 hover:border-cyan-500/20 transition-all overflow-hidden group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {isLive && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="live-dot" style={{ width: 6, height: 6 }} />
                <span className="text-green-400 text-[10px] font-mono uppercase tracking-widest">Live</span>
              </div>
            )}
            <h3 className="text-white font-bold text-lg leading-tight truncate group-hover:text-cyan-300 transition-colors">{event.name}</h3>
          </div>
          {isRegistered && (
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[10px] font-mono">REGISTERED</span>
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400/60" />
            <span>{formatDate(event.date)} · {event.startTime}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <MapPin className="w-3.5 h-3.5 text-cyan-400/60" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Users className="w-3.5 h-3.5 text-cyan-400/60" />
            <span>{registered.toLocaleString()} / {event.capacity.toLocaleString()} registered</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mb-4">
          <div className="capacity-bar">
            <div className={`capacity-bar-fill ${pct > 85 ? 'warning' : ''}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-mono">
            <span className="text-gray-500">{event.checkedIn} checked in</span>
            <span className={pct > 85 ? 'text-yellow-400' : 'text-gray-500'}>{isFull ? 'FULL' : `${event.capacity - registered} left`}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-5">
        <Link href={`/events/${event.id}`}
          className="flex items-center justify-between w-full bg-white/3 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 rounded-lg px-4 py-2.5 text-sm text-gray-300 hover:text-cyan-400 transition-all group/btn">
          <span>{isRegistered ? 'View My QR' : isFull ? 'View Event' : 'Register Now'}</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

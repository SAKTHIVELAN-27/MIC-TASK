'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, User } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface FeedItem {
  attendeeName: string;
  registrationCode?: string;
  checkedInAt: string | Date;
  stationName?: string;
  offlineSync?: boolean;
}

interface CheckInFeedProps {
  eventId: string;
  initialItems?: FeedItem[];
}

export function CheckInFeed({ eventId, initialItems = [] }: CheckInFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const initSocket = async () => {
      const { io } = await import('socket.io-client');
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join-event', eventId);
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('CHECKIN_CREATED', (data: FeedItem) => {
        setItems((prev) => [data, ...prev].slice(0, 50));
      });
    };

    initSocket();
    return () => { socketRef.current?.disconnect(); };
  }, [eventId]);

  return (
    <div className="glass rounded-xl border border-white/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="tech-label">Live Check-In Feed</div>
        <div className={`flex items-center gap-1.5 text-xs font-mono ${ connected ? 'text-green-400' : 'text-gray-500' }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_6px_#00ff9d]' : 'bg-gray-500'}`} />
          {connected ? 'LIVE' : 'CONNECTING...'}
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No check-ins yet. Waiting for attendees...</div>
          ) : (
            items.map((item, i) => (
              <motion.div key={`${item.attendeeName}-${String(item.checkedInAt)}-${i}`}
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2.5 hover:border-green-500/20 transition-colors">
                <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{item.attendeeName}</div>
                  <div className="text-gray-500 text-xs">
                    {item.stationName || 'Main Entrance'}
                    {item.offlineSync && <span className="ml-2 text-yellow-500/70">(offline sync)</span>}
                  </div>
                </div>
                <div className="text-gray-500 text-xs font-mono flex-shrink-0">{formatTime(item.checkedInAt)}</div>
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

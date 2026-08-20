import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    socket.on('join-event', (eventId: string) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket.IO] Client joined event room: event:${eventId}`);
    });

    socket.on('leave-event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });

  console.log('[Socket.IO] Server initialized');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitCheckIn(eventId: string, data: object) {
  if (io) {
    io.to(`event:${eventId}`).emit('CHECKIN_CREATED', data);
  }
}

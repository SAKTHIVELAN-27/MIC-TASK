// CommonJS wrapper for Socket.IO server (used by server.js)
const { Server: SocketIOServer } = require('socket.io');

let io = null;

function initSocketServer(httpServer) {
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

    socket.on('join-event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket.IO] Joined room: event:${eventId}`);
    });

    socket.on('leave-event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });

  console.log('[Socket.IO] Server initialized on path /api/socket');
  return io;
}

function getIO() {
  return io;
}

function emitCheckIn(eventId, data) {
  if (io) {
    io.to(`event:${eventId}`).emit('CHECKIN_CREATED', data);
  }
}

module.exports = { initSocketServer, getIO, emitCheckIn };

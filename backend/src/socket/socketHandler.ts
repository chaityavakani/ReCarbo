import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from './events';
import { logger } from '../utils/logger';

let ioInstance: SocketIOServer | null = null;

export const initSocket = (io: SocketIOServer) => {
  ioInstance = io;

  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    logger.info(`🔌 Socket client connected: ${socket.id}`);

    // Join room (e.g. user specific, company specific, or listing specific)
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (room: string) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room: string) => {
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`❌ Socket client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized! Call initSocket first.');
  }
  return ioInstance;
};

export const emitToRoom = (room: string, event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, payload);
  }
};

export const broadcastEvent = (event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
};

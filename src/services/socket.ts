/**
 * Socket.io Client
 *
 * This module provides WebSocket connectivity for real-time updates.
 * It automatically authenticates using Firebase ID tokens.
 *
 * Exposed via Module Federation so child apps can subscribe to real-time events.
 */

import { io, Socket } from 'socket.io-client';
import { auth } from './firebase';

// WebSocket Configuration
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3010';

// Socket instance (singleton)
let socket: Socket | null = null;
let connectionPromise: Promise<Socket> | null = null;

// Event types for real-time updates
export interface RealtimeEvent<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
}

export interface EpisodeUpdate {
  id: string;
  status: string;
  updatedAt: string;
  updatedBy: string;
  changes?: Record<string, unknown>;
}

/**
 * Initialize and connect to WebSocket server
 */
export const connectSocket = async (): Promise<Socket> => {
  // Return existing connection if available
  if (socket?.connected) {
    return socket;
  }

  // Return pending connection if in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      // Get Firebase token for authentication
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      socket = io(WS_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socket.on('connect', () => {
        console.log('[WebSocket] Connected:', socket?.id);
        resolve(socket!);
      });

      socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error.message);
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      });

      socket.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      reject(error);
    }
  });

  return connectionPromise;
};

/**
 * Disconnect from WebSocket server
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionPromise = null;
    console.log('[WebSocket] Disconnected manually');
  }
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => socket;

/**
 * Subscribe to a room for real-time updates
 * Maps room names to the events the API server expects
 */
export const subscribeToRoom = async (room: string): Promise<void> => {
  const sock = await connectSocket();

  // Map room names to API event names
  if (room.endsWith(':episodes')) {
    sock.emit('subscribe:episodes');
  } else if (room.startsWith('episode:')) {
    const episodeId = room.replace('episode:', '');
    sock.emit('subscribe:episode', episodeId);
  } else {
    sock.emit('subscribe', { room });
  }
  console.log('[WebSocket] Subscribed to room:', room);
};

/**
 * Unsubscribe from a room
 */
export const unsubscribeFromRoom = async (room: string): Promise<void> => {
  const sock = await connectSocket();

  // Map room names to API event names
  if (room.endsWith(':episodes')) {
    sock.emit('unsubscribe:episodes');
  } else if (room.startsWith('episode:')) {
    const episodeId = room.replace('episode:', '');
    sock.emit('unsubscribe:episode', episodeId);
  } else {
    sock.emit('unsubscribe', { room });
  }
  console.log('[WebSocket] Unsubscribed from room:', room);
};

/**
 * Subscribe to episode updates for a specific company
 */
export const subscribeToCompanyEpisodes = async (companyId: string): Promise<void> => {
  await subscribeToRoom(`company:${companyId}:episodes`);
};

/**
 * Subscribe to a specific episode's updates
 */
export const subscribeToEpisode = async (episodeId: string): Promise<void> => {
  await subscribeToRoom(`episode:${episodeId}`);
};

/**
 * Listen for episode update events
 */
export const onEpisodeUpdate = (callback: (data: EpisodeUpdate) => void): (() => void) => {
  if (!socket) {
    console.warn('[WebSocket] Socket not connected, cannot listen for events');
    return () => {};
  }

  socket.on('episode:updated', callback);

  // Return cleanup function
  return () => {
    socket?.off('episode:updated', callback);
  };
};

/**
 * Listen for episode creation events
 */
export const onEpisodeCreated = (callback: (data: EpisodeUpdate) => void): (() => void) => {
  if (!socket) {
    console.warn('[WebSocket] Socket not connected, cannot listen for events');
    return () => {};
  }

  socket.on('episode:created', callback);

  return () => {
    socket?.off('episode:created', callback);
  };
};

/**
 * Listen for episode deletion events
 */
export const onEpisodeDeleted = (callback: (data: { id: string }) => void): (() => void) => {
  if (!socket) {
    console.warn('[WebSocket] Socket not connected, cannot listen for events');
    return () => {};
  }

  socket.on('episode:deleted', callback);

  return () => {
    socket?.off('episode:deleted', callback);
  };
};

const socketService = {
  connect: connectSocket,
  disconnect: disconnectSocket,
  getSocket,
  subscribeToRoom,
  unsubscribeFromRoom,
  subscribeToCompanyEpisodes,
  subscribeToEpisode,
  onEpisodeUpdate,
  onEpisodeCreated,
  onEpisodeDeleted,
};

export default socketService;

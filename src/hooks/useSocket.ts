/**
 * React Hooks for WebSocket
 *
 * These hooks provide easy integration of real-time updates in React components.
 * Exposed via Module Federation so child apps can use them.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  connectSocket,
  disconnectSocket,
  subscribeToRoom,
  unsubscribeFromRoom,
  getSocket,
  EpisodeUpdate,
} from '../services/socket';

/**
 * Hook to manage WebSocket connection
 */
export const useSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        await connectSocket();
        if (mounted) {
          setIsConnected(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setIsConnected(false);
          setError(err instanceof Error ? err : new Error('Connection failed'));
        }
      }
    };

    connect();

    // Set up connection status listeners
    const socket = getSocket();
    if (socket) {
      const handleConnect = () => mounted && setIsConnected(true);
      const handleDisconnect = () => mounted && setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        mounted = false;
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  return { isConnected, error, disconnect: disconnectSocket };
};

/**
 * Hook to subscribe to a room and receive events
 */
export const useRoom = <T = unknown>(
  room: string | null,
  eventName: string
): { data: T | null; isSubscribed: boolean } => {
  const [data, setData] = useState<T | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!room) return;

    let mounted = true;
    let cleanup: (() => void) | null = null;

    const subscribe = async () => {
      try {
        await subscribeToRoom(room);
        if (mounted) setIsSubscribed(true);

        const socket = getSocket();
        if (socket) {
          const handler = (eventData: T) => {
            if (mounted) setData(eventData);
          };

          socket.on(eventName, handler);
          cleanup = () => socket.off(eventName, handler);
        }
      } catch (err) {
        console.error('[useRoom] Subscription failed:', err);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      if (room) {
        unsubscribeFromRoom(room).catch(console.error);
        setIsSubscribed(false);
      }
    };
  }, [room, eventName]);

  return { data, isSubscribed };
};

/**
 * Hook to listen for episode updates
 */
export const useEpisodeUpdates = (
  companyId: string | null
): {
  latestUpdate: EpisodeUpdate | null;
  isSubscribed: boolean;
} => {
  const room = companyId ? `company:${companyId}:episodes` : null;
  const { data, isSubscribed } = useRoom<EpisodeUpdate>(room, 'episode:updated');

  return { latestUpdate: data, isSubscribed };
};

/**
 * Hook to listen for a specific episode's real-time updates
 */
export const useEpisodeListener = (
  episodeId: string | null,
  onUpdate?: (episode: EpisodeUpdate) => void
): {
  isSubscribed: boolean;
  latestUpdate: EpisodeUpdate | null;
} => {
  const [latestUpdate, setLatestUpdate] = useState<EpisodeUpdate | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!episodeId) return;

    let mounted = true;
    let cleanup: (() => void) | null = null;

    const subscribe = async () => {
      try {
        const room = `episode:${episodeId}`;
        await subscribeToRoom(room);
        if (mounted) setIsSubscribed(true);

        const socket = getSocket();
        if (socket) {
          const handler = (data: EpisodeUpdate) => {
            if (mounted) {
              setLatestUpdate(data);
              onUpdateRef.current?.(data);
            }
          };

          socket.on('episode:updated', handler);
          cleanup = () => socket.off('episode:updated', handler);
        }
      } catch (err) {
        console.error('[useEpisodeListener] Subscription failed:', err);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      if (episodeId) {
        unsubscribeFromRoom(`episode:${episodeId}`).catch(console.error);
        setIsSubscribed(false);
      }
    };
  }, [episodeId]);

  return { isSubscribed, latestUpdate };
};

/**
 * Generic hook to emit events and receive responses
 */
export const useSocketEmit = <TRequest, TResponse>(
  eventName: string
): {
  emit: (data: TRequest) => Promise<TResponse>;
  isLoading: boolean;
  error: Error | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const emit = useCallback(
    async (data: TRequest): Promise<TResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const socket = await connectSocket();
        return new Promise((resolve, reject) => {
          socket.emit(eventName, data, (response: TResponse) => {
            setIsLoading(false);
            resolve(response);
          });

          // Timeout after 30 seconds
          setTimeout(() => {
            setIsLoading(false);
            const timeoutError = new Error('Request timed out');
            setError(timeoutError);
            reject(timeoutError);
          }, 30000);
        });
      } catch (err) {
        setIsLoading(false);
        const emitError = err instanceof Error ? err : new Error('Emit failed');
        setError(emitError);
        throw emitError;
      }
    },
    [eventName]
  );

  return { emit, isLoading, error };
};

const socketHooks = {
  useSocketConnection,
  useRoom,
  useEpisodeUpdates,
  useEpisodeListener,
  useSocketEmit,
};

export default socketHooks;

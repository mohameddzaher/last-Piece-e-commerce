/**
 * Socket.io client wrapper. Single connection per browser tab, reconnects
 * with the latest auth token whenever the user logs in/out.
 */
import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5001';

let socket = null;

export const getSocket = () => {
  if (typeof window === 'undefined') return null;
  if (socket) return socket;
  const token = localStorage.getItem('accessToken') || undefined;
  socket = io(SOCKET_URL, {
    auth: token ? { token } : {},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  });
  socket.on('connect', () => console.log('🛰  socket connected', socket.id));
  socket.on('connect_error', (err) => console.warn('socket connect_error', err.message));
  return socket;
};

export const reconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket();
};

/**
 * Subscribe to a socket event for the lifetime of a component.
 * Usage:
 *   useSocketEvent('product:updated', (p) => { ... });
 */
export const useSocketEvent = (event, handler, deps = []) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const fn = (payload) => handlerRef.current?.(payload);
    s.on(event, fn);
    return () => s.off(event, fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
};

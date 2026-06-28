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
 *   useSocketEvent('product:updated', reload, [], { debounceMs: 400 });
 *
 * `debounceMs` coalesces bursts of the same event into a single handler call.
 * Critical at scale: when one admin edits a product the server broadcasts to
 * every connected client, and a handler that triggers a full refetch would
 * otherwise have every open tab stampede the API on each event. Debouncing
 * collapses a flurry of edits into one refetch.
 */
export const useSocketEvent = (event, handler, deps = [], options = {}) => {
  const { debounceMs = 0 } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    let timer = null;
    const fn = (payload) => {
      if (debounceMs > 0) {
        clearTimeout(timer);
        timer = setTimeout(() => handlerRef.current?.(payload), debounceMs);
      } else {
        handlerRef.current?.(payload);
      }
    };
    s.on(event, fn);
    return () => {
      clearTimeout(timer);
      s.off(event, fn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, debounceMs, ...deps]);
};

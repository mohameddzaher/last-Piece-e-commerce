import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { filterProductForRole } from '../utils/roleVisibility.js';

let io = null;

const ROLE_ROOMS = {
  'super-admin': ['role:super-admin', 'role:admin', 'role:staff'],
  admin: ['role:admin', 'role:staff'],
  'saudi-staff': ['role:staff', 'role:saudi-staff'],
  'egypt-staff': ['role:staff', 'role:egypt-staff'],
  customer: ['role:customer'],
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(null, true), // mirrors Express CORS
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Optional JWT auth — unauthenticated clients still connect (for public site updates)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      socket.user = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
    } catch {
      socket.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.join('public');
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      const rooms = ROLE_ROOMS[socket.user.role] || [];
      rooms.forEach((r) => socket.join(r));
    }

    socket.emit('connected', {
      authenticated: !!socket.user,
      role: socket.user?.role || null,
    });
  });

  console.log('🛰  socket.io ready');
  return io;
};

export const getIO = () => io;

const safeEmit = (rooms, event, payload) => {
  if (!io) return;
  const targets = Array.isArray(rooms) ? rooms : [rooms];
  targets.forEach((r) => io.to(r).emit(event, payload));
};

/* ---------- Domain emit helpers ---------- */

export const emitProductChange = (event, product) => {
  if (!io) return;
  // Each role gets the product with their own field mask.
  const adminPayload = filterProductForRole(product, 'super-admin');
  const saudiPayload = filterProductForRole(product, 'saudi-staff');
  const egyptPayload = filterProductForRole(product, 'egypt-staff');
  const publicPayload = filterProductForRole(product, 'customer');

  io.to('role:super-admin').emit(event, adminPayload);
  io.to('role:admin').emit(event, adminPayload);
  io.to('role:saudi-staff').emit(event, saudiPayload);
  io.to('role:egypt-staff').emit(event, egyptPayload);

  // Broadcast publicly only if the product is visible online.
  const onlineLocations = ['egypt-online', 'egypt-both'];
  if (onlineLocations.includes(product?.location) && product?.status === 'active') {
    io.to('public').emit(event, publicPayload);
  }
};

export const emitShipmentChange = (event, shipment) =>
  safeEmit(['role:super-admin', 'role:admin', 'role:saudi-staff'], event, shipment);

export const emitExpenseChange = (event, expense) =>
  safeEmit(['role:super-admin', 'role:admin'], event, expense);

export const emitSaleChange = (event, sale) =>
  safeEmit(['role:super-admin', 'role:admin', 'role:egypt-staff'], event, sale);

export const emitOrderChange = (event, order, ownerUserId) => {
  safeEmit(['role:super-admin', 'role:admin'], event, order);
  if (ownerUserId) safeEmit(`user:${ownerUserId}`, event, order);
};

export const emitReviewChange = (event, review) => {
  safeEmit(['role:super-admin', 'role:admin'], event, review);
  if (review?.status === 'approved') safeEmit('public', event, review);
};

export const emitSiteContentChange = (event, content) => {
  safeEmit(['role:super-admin', 'role:admin', 'public'], event, content);
};

export const emitDashboardRefresh = () =>
  safeEmit(['role:super-admin', 'role:admin'], 'dashboard:refresh', { at: new Date() });

export const emitUserChange = (event, user) =>
  safeEmit(['role:super-admin'], event, user);

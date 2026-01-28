import { isConnected } from '../config/database.js';

export const requireDB = (req, res, next) => {
  if (!isConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please check MongoDB configuration.',
      error: 'Database not connected',
    });
  }
  next();
};

import jwt from 'jsonwebtoken';

/**
 * Like `protect`, but never blocks. If a valid token is present, sets req.user.
 * Used on public endpoints that vary their response by role (e.g. product
 * lists that should hide purchase prices from customers but show them to admins).
 */
export const optionalAuth = (req, _res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Ignore — leave req.user undefined.
  }
  next();
};

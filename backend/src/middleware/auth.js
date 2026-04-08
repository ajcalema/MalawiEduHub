const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/db');

// Require a valid JWT access token
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch fresh user from DB (catches suspended/deleted accounts mid-session)
    const result = await query(
      'SELECT id, full_name, email, role, status FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended.' });
    if (user.status === 'deleted')   return res.status(403).json({ error: 'Account deleted.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

// Optional auth — attaches user if token present, continues if not
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const result = await query('SELECT id, role, status FROM users WHERE id = $1', [decoded.id]);
      if (result.rows[0]?.status === 'active') req.user = result.rows[0];
    }
  } catch { /* ignore — optional */ }
  next();
};

// Check if user has active access (subscription or upload pass)
const requireAccess = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
       LIMIT 1`,
      [req.user.id]
    );
    if (result.rows[0]) {
      req.activeSubscription = result.rows[0];
      return next();
    }
    return res.status(403).json({
      error: 'Active subscription required.',
      code: 'NO_ACCESS',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth, requireAdmin, optionalAuth, requireAccess };

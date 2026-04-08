const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/jwt');

// ─── REGISTER ───────────────────────────────
const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, school } = req.body;

    // Check duplicates
    const exists = await query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email or phone already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const safeRole = ['student', 'teacher'].includes(role) ? role : 'student';

    const result = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, school)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, full_name, email, phone, role, school, created_at`,
      [full_name, email, phone, password_hash, safeRole, school || null]
    );

    const user = result.rows[0];
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token hash
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, hashToken(refreshToken)]
    );

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

// ─── LOGIN ──────────────────────────────────
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or phone
    const raw = String(identifier || '').trim();
    if (!raw) {
      return res.status(400).json({ error: 'Email or phone required.' });
    }

    const digitsOnly = raw.replace(/\D/g, '');
    const looksLikeEmail = raw.includes('@');

    let result;
    if (looksLikeEmail) {
      result = await query(
        `SELECT id, full_name, email, phone, password_hash, role, status
         FROM users
         WHERE email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM($1))`,
        [raw]
      );
    } else if (digitsOnly.length >= 9) {
      result = await query(
        `SELECT id, full_name, email, phone, password_hash, role, status
         FROM users
         WHERE phone IS NOT NULL
           AND regexp_replace(phone, '[^0-9]', '', 'g') = $1`,
        [digitsOnly]
      );
    } else {
      result = await query(
        `SELECT id, full_name, email, phone, password_hash, role, status
         FROM users
         WHERE email = $1 OR phone = $1`,
        [raw]
      );
    }

    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, hashToken(refreshToken)]
    );

    // Fetch active subscription
    const sub = await query(
      `SELECT plan, expires_at FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [user.id]
    );

    res.json({
      user: {
        id: user.id, full_name: user.full_name,
        email: user.email, role: user.role,
        subscription: sub.rows[0] || null,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
};

// ─── REFRESH TOKEN ───────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    // Check token is valid and not revoked
    const stored = await query(
      `SELECT id FROM refresh_tokens
       WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
      [tokenHash]
    );
    if (!stored.rows[0]) return res.status(401).json({ error: 'Invalid or expired refresh token.' });

    // Revoke old token (rotation)
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);

    const userResult = await query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, hashToken(newRefreshToken)]
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Token refresh failed.' });
  }
};

// ─── LOGOUT ─────────────────────────────────
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
        [hashToken(refreshToken)]
      );
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed.' });
  }
};

// ─── GET PROFILE ────────────────────────────
const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, phone, role, school,
              approved_upload_count, upload_pass_earned_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = result.rows[0];

    // Active subscription
    const sub = await query(
      `SELECT plan, is_upload_pass, starts_at, expires_at
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [req.user.id]
    );

    // Upload threshold from settings
    const settingResult = await query(
      `SELECT value FROM system_settings WHERE key = 'upload_pass_min_threshold'`
    );
    const threshold = parseInt(settingResult.rows[0]?.value || '5');

    res.json({
      ...user,
      upload_pass_threshold: threshold,
      upload_progress_pct: Math.min(
        100,
        Math.round((user.approved_upload_count / threshold) * 100)
      ),
      active_subscription: sub.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

module.exports = { register, login, refresh, logout, getProfile };

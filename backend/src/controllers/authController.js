const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/jwt');
const { Resend } = require('resend');

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 9 && cleaned.length <= 15;
};

const isStrongPassword = (pwd) => {
  return pwd.length >= 8;
};

// ─── REGISTER ───────────────────────────────
const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, school } = req.body;

    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    if (full_name.trim().length > 120) {
      return res.status(400).json({ error: 'Full name too long.' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email required.' });
    }

    if (!password || !isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

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
    // More detailed error for debugging
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or phone already registered.' });
    }
    if (err.code === '23502') {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    res.status(500).json({ error: 'Registration failed.', details: err.message });
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

    // Check if locked (handle missing column)
    try {
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remain = Math.ceil((new Date(user.locked_until) - new Date()) / 1000 / 60);
        return res.status(403).json({
          error: `Account locked. Try again in ${remain} minutes.`,
          code: 'ACCOUNT_LOCKED',
          locked_until: user.locked_until
        });
      }
    } catch {
      // Column doesn't exist yet
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Track failed attempts (optional - ignore if columns missing)
      try {
        const attempts = (user.failed_login_attempts || 0) + 1;
        if (attempts >= 5) {
          await query(
            `UPDATE users SET failed_login_attempts = 0, locked_until = NOW() + INTERVAL '15 minutes' WHERE id = $1`,
            [user.id]
          );
          return res.status(403).json({
            error: 'Too many failed attempts. Account locked for 15 minutes.',
            code: 'ACCOUNT_LOCKED'
          });
        }
        await query(
          `UPDATE users SET failed_login_attempts = $1 WHERE id = $2`,
          [attempts, user.id]
        );
        return res.status(401).json({
          error: 'Invalid credentials.',
          attempts_remaining: 5 - attempts
        });
      } catch {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
    }

    // Reset failed attempts on successful login (optional columns)
    try {
      await query(
        `UPDATE users SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
        [user.id]
      );
    } catch {
      // Columns may not exist yet - ignore
    }

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || null;

    const getDeviceName = (ua) => {
      if (!ua) return 'Unknown';
      if (ua.includes('Mobile')) return 'Mobile';
      if (ua.includes('Tablet')) return 'Tablet';
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac')) return 'Mac';
      if (ua.includes('Linux')) return 'Linux';
      return 'Desktop';
    };

    // Save refresh token (optional columns - graceful degradation)
    try {
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_name, ip_address, user_agent)
         VALUES ($1, $2, NOW() + INTERVAL '30 days', $3, $4, $5)`,
        [user.id, hashToken(refreshToken), getDeviceName(userAgent), ip, userAgent]
      );
    } catch {
      // Columns don't exist yet - use basic insert
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
        [user.id, hashToken(refreshToken)]
      );
    }

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
    res.status(500).json({ error: 'Login failed.', details: err.message });
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

// ─── LIST SESSIONS ───────────────────────────
const listSessions = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, device_name, ip_address, user_agent, created_at, expires_at
       FROM refresh_tokens
       WHERE user_id = $1 AND revoked = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
};

// ─── LOGOUT EVERYWHERE ──────────────────
const logoutEverywhere = async (req, res) => {
  try {
    await query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ message: 'Logged out of all devices.' });
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

// ─── FORGOT PASSWORD ──────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Find user by email
    const result = await query(
      'SELECT id, full_name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    // Don't reveal if user exists (security)
    if (!user) {
      return res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(resetToken);

    // Store token in database (expires in 1 hour)
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.id, tokenHash]
    );

    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    // Send email using Resend
    if (resend) {
      try {
        // Use Resend's test domain if no verified domain
        const emailFrom = process.env.EMAIL_FROM || 'MalawiEduHub <onboarding@resend.dev>';
        await resend.emails.send({
          from: emailFrom,
          to: user.email,
          subject: 'Password Reset - MalawiEduHub',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1aab78;">Password Reset Request</h2>
              <p>Hello ${user.full_name},</p>
              <p>You requested a password reset for your MalawiEduHub account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #1aab78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">MalawiEduHub - Malawi's Knowledge Hub</p>
            </div>
          `,
        });
        console.log(`✅ Password reset email sent to ${user.email}`);
      } catch (emailErr) {
        console.error('❌ Failed to send email:', emailErr.message);
        if (emailErr.response) {
          console.error('   Resend error details:', emailErr.response);
        }
        // Continue - we'll still return success to user for security
      }
    } else {
      console.log('\n⚠️  Resend not configured. Email not sent.');
      console.log(`   Reset URL: ${resetUrl}\n`);
    }

    res.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
      // Only include these in development/testing or if email failed
      ...(process.env.NODE_ENV !== 'production' && !resend && {
        reset_token: resetToken,
        reset_url: resetUrl,
      }),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
};

// ─── RESET PASSWORD ───────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Hash the provided token
    const tokenHash = hashToken(token);

    // Find valid token
    const tokenResult = await query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW()`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const userId = tokenResult.rows[0].user_id;

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 12);

    // Update user's password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    // Mark token as used
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token_hash = $1',
      [tokenHash]
    );

    // Revoke all existing refresh tokens for security
    await query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [userId]
    );

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

module.exports = { register, login, refresh, logout, getProfile, forgotPassword, resetPassword, listSessions, logoutEverywhere };

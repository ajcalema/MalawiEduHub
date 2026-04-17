/**
 * Google OAuth Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/jwt');

// Google OAuth login URL
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL}/api/auth/google/callback`;
  const scope = encodeURIComponent('email profile');
  
  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent`;
  
  res.redirect(googleAuthUrl);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Google token error:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
    }
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const googleUser = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('Google user info error:', googleUser);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
    }
    
    // Check if user exists
    let result = await query(
      'SELECT id, email, full_name, role, status FROM users WHERE email = $1',
      [googleUser.email]
    );
    
    let user = result.rows[0];
    
    if (!user) {
      // Create new user
      const newUserResult = await query(
        `INSERT INTO users (email, full_name, phone, password_hash, role, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, full_name, role, status`,
        [
          googleUser.email,
          googleUser.name || googleUser.email.split('@')[0],
          null, // phone
          'google_oauth', // special marker for OAuth users
          'user',
          'active',
          true,
        ]
      );
      user = newUserResult.rows[0];
    } else if (user.status !== 'active') {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=account_suspended`);
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );
    
    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?` +
      `token=${encodeURIComponent(accessToken)}&` +
      `refresh=${encodeURIComponent(refreshToken)}`
    );
    
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`);
  }
});

module.exports = router;

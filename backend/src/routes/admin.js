const express = require('express');
const router  = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/db');

router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [docs, users, revenue, downloads, pending] = await Promise.all([
      query(`SELECT COUNT(*) FROM documents`),
      query(`SELECT COUNT(*) FROM users WHERE status = 'active'`),
      query(`SELECT COALESCE(SUM(amount_mwk),0) AS total FROM payments WHERE status='completed' AND initiated_at > NOW()-INTERVAL '30 days'`),
      query(`SELECT COUNT(*) FROM downloads WHERE downloaded_at > NOW()-INTERVAL '1 day'`),
      query(`SELECT COUNT(*) FROM documents WHERE status IN ('pending','flagged')`),
    ]);
    res.json({
      total_documents: parseInt(docs.rows[0].count),
      active_users:    parseInt(users.rows[0].count),
      revenue_30d_mwk: parseFloat(revenue.rows[0].total),
      downloads_today: parseInt(downloads.rows[0].count),
      pending_review:  parseInt(pending.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Analytics endpoint
router.get('/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [signups, topDocs, topUploaders, requests] = await Promise.all([
      // Signups per day (last 7 days)
      query(`SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM users WHERE created_at > NOW() - INTERVAL '7 days' 
             GROUP BY DATE(created_at) ORDER BY date`),
      // Top downloaded documents
      query(`SELECT d.title, d.download_count, s.name as subject
             FROM documents d 
             JOIN subjects s ON d.subject_id = s.id 
             WHERE d.status = 'approved' 
             ORDER BY d.download_count DESC LIMIT 5`),
      // Top uploaders
      query(`SELECT u.full_name, COUNT(d.id) as doc_count
             FROM users u 
             JOIN documents d ON d.uploader_id = u.id 
             WHERE d.status = 'approved' 
             GROUP BY u.id, u.full_name 
             ORDER BY doc_count DESC LIMIT 5`),
      // Request stats
      query(`SELECT status, COUNT(*) as count FROM document_requests GROUP BY status`),
    ]);
    res.json({
      signups: signups.rows,
      top_docs: topDocs.rows,
      top_uploaders: topUploaders.rows,
      requests: requests.rows,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, phone, role, status, school,
              approved_upload_count, created_at, last_login_at
       FROM users ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.patch('/users/:id/suspend', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'suspended' WHERE id = $1`, [req.params.id]);
    await query(
      `INSERT INTO admin_log (admin_id, action, target_type, target_id) VALUES ($1,'suspend_user','user',$2)`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'User suspended.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend user.' });
  }
});

router.patch('/users/:id/unlock', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
      [req.params.id]
    );
    await query(
      `INSERT INTO admin_log (admin_id, action, target_type, target_id) VALUES ($1,'unlock_user','user',$2)`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'User unlocked.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlock user.' });
  }
});

router.get('/settings', requireAuth, requireAdmin, async (req, res) => {
  const result = await query('SELECT * FROM system_settings ORDER BY key');
  res.json(result.rows);
});

router.patch('/settings/:key', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    await query(
      `UPDATE system_settings SET value=$1, updated_by=$2, updated_at=NOW() WHERE key=$3`,
      [value, req.user.id, req.params.key]
    );
    res.json({ message: 'Setting updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting.' });
  }
});

// Public settings endpoint (for footer year, pricing, etc.) - no auth required
router.get('/settings/public', async (req, res) => {
  try {
    const result = await query(
      `SELECT key, value FROM system_settings WHERE key IN ('footer_year', 'site_name', 'contact_email', 'price_daily_mwk', 'price_weekly_mwk', 'price_monthly_mwk')`
    );
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

module.exports = router;

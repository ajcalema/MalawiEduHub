// ─── src/routes/auth.js ──────────────────────
const express = require('express');
const router  = express.Router();
const { register, login, refresh, logout, getProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { body } = require('express-validator');

const validateRegister = [
  body('full_name').trim().notEmpty().withMessage('Full name required.'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

router.post('/register', validateRegister, register);
router.post('/login',    login);
router.post('/refresh',  refresh);
router.post('/logout',   logout);
router.get('/profile',   requireAuth, getProfile);

module.exports = router;


// ─── src/routes/documents.js ─────────────────
const docRouter = express.Router();
const multer = require('multer');
const {
  uploadDocument, browseDocuments, getDocument, downloadDocument,
  getAdminQueue, approveDocument, rejectDocument, updateDocument, getDuplicateLog,
} = require('../controllers/documentController');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF, DOCX, and PPTX files are allowed.'));
  },
});

// Public / optional-auth routes
docRouter.get('/',         optionalAuth, browseDocuments);
docRouter.get('/:id',      optionalAuth, getDocument);

// Auth required
docRouter.post('/upload',      requireAuth, upload.single('file'), uploadDocument);
docRouter.get('/:id/download', requireAuth, downloadDocument);

// Admin only
docRouter.get('/admin/queue',             requireAuth, requireAdmin, getAdminQueue);
docRouter.get('/admin/duplicate-log',     requireAuth, requireAdmin, getDuplicateLog);
docRouter.patch('/admin/:id/approve',     requireAuth, requireAdmin, approveDocument);
docRouter.patch('/admin/:id/reject',      requireAuth, requireAdmin, rejectDocument);
docRouter.patch('/admin/:id',             requireAuth, requireAdmin, updateDocument);

module.exports = docRouter;


// ─── src/routes/payments.js ──────────────────
const payRouter = express.Router();
const {
  initiateSubscription, initiatePerDownload,
  paymentWebhook, checkPaymentStatus, getRevenueSummary,
} = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

payRouter.post('/subscribe',         requireAuth, initiateSubscription);
payRouter.post('/per-download',      requireAuth, initiatePerDownload);
payRouter.post('/webhook',           paymentWebhook);           // no auth — called by Paychangu
payRouter.get('/status/:id',         requireAuth, checkPaymentStatus);
payRouter.get('/admin/revenue',      requireAuth, requireAdmin, getRevenueSummary);

module.exports = payRouter;


// ─── src/routes/subjects.js ──────────────────
const subjectRouter = express.Router();
const { query } = require('../config/db');

subjectRouter.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, COUNT(d.id) AS document_count
       FROM subjects s
       LEFT JOIN documents d ON d.subject_id = s.id AND d.status = 'approved'
       WHERE s.is_active = TRUE
       GROUP BY s.id
       ORDER BY s.sort_order`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
});

module.exports = subjectRouter;


// ─── src/routes/admin.js ─────────────────────
const adminRouter = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { query: dbQuery } = require('../config/db');

// Dashboard stats
adminRouter.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [docs, users, revenue, downloads, pending] = await Promise.all([
      dbQuery(`SELECT COUNT(*) FROM documents WHERE status = 'approved'`),
      dbQuery(`SELECT COUNT(*) FROM users WHERE status = 'active'`),
      dbQuery(`SELECT COALESCE(SUM(amount_mwk),0) AS total FROM payments WHERE status='completed' AND initiated_at > NOW()-INTERVAL '30 days'`),
      dbQuery(`SELECT COUNT(*) FROM downloads WHERE downloaded_at > NOW()-INTERVAL '1 day'`),
      dbQuery(`SELECT COUNT(*) FROM documents WHERE status IN ('pending','flagged')`),
    ]);
    res.json({
      total_documents:   parseInt(docs.rows[0].count),
      active_users:      parseInt(users.rows[0].count),
      revenue_30d_mwk:   parseFloat(revenue.rows[0].total),
      downloads_today:   parseInt(downloads.rows[0].count),
      pending_review:    parseInt(pending.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// User management
adminRouter.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT id, full_name, email, phone, role, status, school,
              approved_upload_count, created_at, last_login_at
       FROM users ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

adminRouter.patch('/users/:id/suspend', requireAuth, requireAdmin, async (req, res) => {
  try {
    await dbQuery(
      `UPDATE users SET status = 'suspended' WHERE id = $1`, [req.params.id]
    );
    await dbQuery(
      `INSERT INTO admin_log (admin_id, action, target_type, target_id)
       VALUES ($1,'suspend_user','user',$2)`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'User suspended.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend user.' });
  }
});

// System settings
adminRouter.get('/settings', requireAuth, requireAdmin, async (req, res) => {
  const result = await dbQuery('SELECT * FROM system_settings ORDER BY key');
  res.json(result.rows);
});

adminRouter.patch('/settings/:key', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    await dbQuery(
      `UPDATE system_settings SET value = $1, updated_by = $2, updated_at = NOW()
       WHERE key = $3`,
      [value, req.user.id, req.params.key]
    );
    res.json({ message: 'Setting updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting.' });
  }
});

module.exports = adminRouter;

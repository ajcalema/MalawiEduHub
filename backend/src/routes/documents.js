const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();
const multer  = require('multer');
const {
  uploadDocument, uploadDocumentAdmin, browseDocuments, getDocument, downloadDocument,
  getAdminQueue, approveDocument, rejectDocument, updateDocument, getDuplicateLog,
  getUserDownloads, deleteDocument,
} = require('../controllers/documentController');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

const uploadLimiter = rateLimit({ windowMs: 60*60*1000, max: 20,
  message: { error: 'Upload limit reached. Try again in 1 hour.' } });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF, DOCX, and PPTX files are allowed.'));
  },
});

router.get('/', optionalAuth, browseDocuments);
// Admin routes must be registered before /:id so paths like /admin are not captured as an id
router.get('/admin/queue',         requireAuth, requireAdmin, getAdminQueue);
router.get('/admin/duplicate-log', requireAuth, requireAdmin, getDuplicateLog);
router.post('/admin/upload',       requireAuth, requireAdmin, upload.single('file'), uploadDocumentAdmin);
router.patch('/admin/:id/approve', requireAuth, requireAdmin, approveDocument);
router.patch('/admin/:id/reject',  requireAuth, requireAdmin, rejectDocument);
router.patch('/admin/:id',         requireAuth, requireAdmin, updateDocument);
router.delete('/admin/:id',        requireAuth, requireAdmin, deleteDocument);
router.get('/:id',      optionalAuth, getDocument);
router.post('/upload',      uploadLimiter, requireAuth, upload.single('file'), uploadDocument);
router.get('/:id/download', optionalAuth, downloadDocument);
router.get('/downloads/user', requireAuth, getUserDownloads);

module.exports = router;

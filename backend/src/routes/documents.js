const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const {
  uploadDocument, uploadDocumentAdmin, browseDocuments, getDocument, downloadDocument,
  getAdminQueue, approveDocument, rejectDocument, updateDocument, getDuplicateLog,
  getUserDownloads, deleteDocument, createRequest, getMyRequests, getAllRequests, fulfillRequest,
} = require('../controllers/documentController');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadFile } = require('../config/supabase');

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
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF, DOCX, PPTX, and image files (JPG, PNG, GIF, WebP) are allowed.'));
  },
});

router.get('/', optionalAuth, browseDocuments);
// Admin routes must be registered before /:id so paths like /admin are not captured as an id
router.get('/admin/queue',         requireAuth, requireAdmin, getAdminQueue);
router.get('/admin/duplicate-log', requireAuth, requireAdmin, getDuplicateLog);
router.post('/admin/upload',       requireAuth, requireAdmin, upload.single('file'), uploadDocumentAdmin);

// Simple image upload for lesson diagrams (no document record created)
router.post('/admin/upload-image', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Only allow image files
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed.' });
    }

    // Generate file key
    const fileType = file.originalname.split('.').pop().toLowerCase();
    const fileKey = `lesson-images/${req.user.id}/${uuidv4()}.${fileType}`;

    // Upload to Supabase Storage
    const publicUrl = await uploadFile(file.buffer, fileKey, file.mimetype);

    res.status(201).json({
      message: 'Image uploaded successfully.',
      url: publicUrl,
      file_url: publicUrl,
      file_name: file.originalname,
      file_type: fileType,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Image upload failed.', details: err.message });
  }
});
router.patch('/admin/:id/approve', requireAuth, requireAdmin, approveDocument);
router.patch('/admin/:id/reject',  requireAuth, requireAdmin, rejectDocument);
router.patch('/admin/:id',         requireAuth, requireAdmin, updateDocument);
router.delete('/admin/:id',        requireAuth, requireAdmin, deleteDocument);
router.get('/:id',      optionalAuth, getDocument);
router.post('/upload',      uploadLimiter, requireAuth, upload.single('file'), uploadDocument);
const downloadLimiter = rateLimit({ windowMs: 60*60*1000, max: 50,
  message: { error: 'Download limit reached. Try again in 1 hour.' } });

router.get('/:id/download', downloadLimiter, optionalAuth, downloadDocument);
router.get('/downloads/user', requireAuth, getUserDownloads);

router.post('/requests', requireAuth, createRequest);
router.get('/requests/mine', requireAuth, getMyRequests);
router.get('/admin/requests', requireAuth, requireAdmin, getAllRequests);
router.patch('/admin/requests/:id', requireAuth, requireAdmin, fulfillRequest);

module.exports = router;

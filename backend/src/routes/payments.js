const express = require('express');
const router  = express.Router();
const {
  initiateSubscription, initiatePerDownload,
  paymentWebhook, checkPaymentStatus, getRevenueSummary,
  simulatePaymentSuccess, // Test function
} = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/subscribe',     requireAuth, initiateSubscription);
router.post('/per-download',  requireAuth, initiatePerDownload);
router.post('/webhook',       paymentWebhook);
router.get('/status/:id',     requireAuth, checkPaymentStatus);
router.get('/admin/revenue',  requireAuth, requireAdmin, getRevenueSummary);

// TEST ONLY: Simulate payment success (remove in production)
router.post('/test/simulate-success/:paymentId', requireAuth, simulatePaymentSuccess);

module.exports = router;

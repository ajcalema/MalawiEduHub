const axios = require('axios');
const { query } = require('../config/db');
require('dotenv').config();

const PAYCHANGU_URL = process.env.PAYCHANGU_BASE_URL || 'https://api.paychangu.com';

const PLAN_PRICES = {
  daily:   300,
  weekly:  1000,
  monthly: 2500,
};

const PLAN_DURATIONS = {
  daily:   '24 hours',
  weekly:  '7 days',
  monthly: '30 days',
};

// ─── INITIATE SUBSCRIPTION PAYMENT ──────────
const initiateSubscription = async (req, res) => {
  try {
    const { plan, mobile_number, payment_method } = req.body;

    if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Invalid plan.' });

    const amount = PLAN_PRICES[plan];

    // Create pending payment record
    const payResult = await query(
      `INSERT INTO payments
         (user_id, amount_mwk, payment_method, payment_type, status, mobile_number)
       VALUES ($1,$2,$3,'subscription','pending',$4)
       RETURNING id`,
      [req.user.id, amount, payment_method, mobile_number]
    );
    const paymentId = payResult.rows[0].id;

    // Call Paychangu API
    const response = await axios.post(
      `${PAYCHANGU_URL}/payment`,
      {
        amount,
        currency: 'MWK',
        mobile:   mobile_number,
        network:  payment_method === 'airtel_money' ? 'AIRTEL' : 'TNM',
        reference: paymentId,
        description: `MalawiEduHub ${plan} subscription`,
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/payments/webhook`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update payment with gateway reference
    await query(
      `UPDATE payments SET gateway_ref = $1, gateway_response = $2 WHERE id = $3`,
      [response.data?.reference, JSON.stringify(response.data), paymentId]
    );

    res.json({
      message: 'Payment initiated. Approve the prompt on your phone.',
      payment_id: paymentId,
      amount_mwk: amount,
      plan,
    });
  } catch (err) {
    console.error('initiateSubscription error:', err?.response?.data || err);
    res.status(500).json({ error: 'Payment initiation failed.' });
  }
};

// ─── INITIATE PAY-PER-DOWNLOAD ───────────────
const initiatePerDownload = async (req, res) => {
  try {
    const { document_id, mobile_number, payment_method } = req.body;

    const docResult = await query(
      `SELECT id, title, price_mwk FROM documents
       WHERE id = $1 AND status = 'approved'`,
      [document_id]
    );
    const doc = docResult.rows[0];
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    const payResult = await query(
      `INSERT INTO payments
         (user_id, amount_mwk, payment_method, payment_type,
          status, mobile_number, document_id)
       VALUES ($1,$2,$3,'per_download','pending',$4,$5)
       RETURNING id`,
      [req.user.id, doc.price_mwk, payment_method, mobile_number, document_id]
    );
    const paymentId = payResult.rows[0].id;

    const response = await axios.post(
      `${PAYCHANGU_URL}/payment`,
      {
        amount: doc.price_mwk,
        currency: 'MWK',
        mobile:   mobile_number,
        network:  payment_method === 'airtel_money' ? 'AIRTEL' : 'TNM',
        reference: paymentId,
        description: `Download: ${doc.title}`,
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/payments/webhook`,
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}` },
      }
    );

    await query(
      `UPDATE payments SET gateway_ref = $1, gateway_response = $2 WHERE id = $3`,
      [response.data?.reference, JSON.stringify(response.data), paymentId]
    );

    res.json({
      message: 'Payment initiated. Approve the prompt on your phone.',
      payment_id: paymentId,
      document_title: doc.title,
      amount_mwk: doc.price_mwk,
    });
  } catch (err) {
    console.error('initiatePerDownload error:', err?.response?.data || err);
    res.status(500).json({ error: 'Payment initiation failed.' });
  }
};

// ─── PAYMENT WEBHOOK (called by Paychangu) ───
// Paychangu calls this URL when payment status changes
const paymentWebhook = async (req, res) => {
  try {
    const { reference, status, transaction_id } = req.body;

    // Always respond 200 to Paychangu immediately
    res.json({ received: true });

    const payResult = await query(
      `SELECT * FROM payments WHERE id = $1`,
      [reference]
    );
    const payment = payResult.rows[0];
    if (!payment) return;

    if (status === 'success' || status === 'SUCCESSFUL') {
      // Mark payment completed
      await query(
        `UPDATE payments SET status = 'completed', completed_at = NOW(),
         gateway_response = gateway_response || $1
         WHERE id = $2`,
        [JSON.stringify({ transaction_id }), payment.id]
      );

      // If subscription payment — create subscription
      if (payment.payment_type === 'subscription') {
        const plan = Object.keys(PLAN_PRICES).find(
          p => PLAN_PRICES[p] === parseFloat(payment.amount_mwk)
        );

        const subResult = await query(
          `INSERT INTO subscriptions
             (user_id, plan, status, starts_at, expires_at, payment_id)
           VALUES ($1,$2,'active',NOW(),NOW() + INTERVAL '${PLAN_DURATIONS[plan]}',$3)
           RETURNING id`,
          [payment.user_id, plan, payment.id]
        );

        await query(
          `UPDATE payments SET subscription_id = $1 WHERE id = $2`,
          [subResult.rows[0].id, payment.id]
        );
      }
    } else if (status === 'failed' || status === 'FAILED') {
      await query(
        `UPDATE payments SET status = 'failed', failed_at = NOW(),
         failure_reason = $1 WHERE id = $2`,
        [req.body.failure_reason || 'Payment failed', payment.id]
      );
    }
  } catch (err) {
    console.error('webhook error:', err);
  }
};

// ─── POLL PAYMENT STATUS ─────────────────────
// Frontend polls this to know when payment completed
const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, status, payment_type, amount_mwk, completed_at
       FROM payments WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Payment not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check payment.' });
  }
};

// ─── ADMIN: REVENUE SUMMARY ──────────────────
const getRevenueSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const daysMap = { day: 1, week: 7, month: 30, year: 365 };
    const days = daysMap[period] ?? 30;

    const [totals, byType, daily] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS transactions, COALESCE(SUM(amount_mwk),0)::float AS total_mwk
         FROM payments WHERE status = 'completed'
           AND completed_at IS NOT NULL
           AND completed_at > NOW() - ($1::integer * INTERVAL '1 day')`,
        [days]
      ),
      query(
        `SELECT payment_type, COUNT(*)::int AS count, COALESCE(SUM(amount_mwk),0)::float AS total_mwk
         FROM payments WHERE status = 'completed'
           AND completed_at IS NOT NULL
           AND completed_at > NOW() - ($1::integer * INTERVAL '1 day')
         GROUP BY payment_type`,
        [days]
      ),
      query(`SELECT day::text AS day, payment_type, transactions::int, total_mwk::float
             FROM v_daily_revenue ORDER BY day DESC LIMIT 60`),
    ]);

    const t = totals.rows[0] || {};
    res.json({
      period,
      total_mwk:    parseFloat(t.total_mwk) || 0,
      transactions: parseInt(t.transactions, 10) || 0,
      by_type: (byType.rows || []).map((r) => ({
        payment_type: r.payment_type,
        count: parseInt(r.count, 10) || 0,
        total_mwk: parseFloat(r.total_mwk) || 0,
      })),
      daily: (daily.rows || []).map((r) => ({
        day: r.day,
        payment_type: r.payment_type,
        transactions: parseInt(r.transactions, 10) || 0,
        total_mwk: parseFloat(r.total_mwk) || 0,
      })),
    });
  } catch (err) {
    console.error('getRevenueSummary error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue.' });
  }
};

// ─── TEST ONLY: Simulate Payment Success ─────
// This endpoint allows testing payment flow without real mobile money
const simulatePaymentSuccess = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Get payment details
    const payResult = await query(
      `SELECT * FROM payments WHERE id = $1 AND user_id = $2`,
      [paymentId, req.user.id]
    );
    const payment = payResult.rows[0];
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found.' });
    }
    
    if (payment.status === 'completed') {
      return res.json({ message: 'Payment already completed.', payment });
    }
    
    // Mark payment as completed
    await query(
      `UPDATE payments SET status = 'completed', completed_at = NOW(),
       gateway_response = $1 WHERE id = $2`,
      [JSON.stringify({ test_mode: true, simulated: true }), paymentId]
    );
    
    // If subscription payment — create subscription
    if (payment.payment_type === 'subscription') {
      const plan = Object.keys(PLAN_PRICES).find(
        p => PLAN_PRICES[p] === parseFloat(payment.amount_mwk)
      );
      
      const subResult = await query(
        `INSERT INTO subscriptions
           (user_id, plan, status, starts_at, expires_at, payment_id)
         VALUES ($1,$2,'active',NOW(),NOW() + INTERVAL '${PLAN_DURATIONS[plan]}',$3)
         RETURNING id`,
        [payment.user_id, plan, paymentId]
      );
      
      await query(
        `UPDATE payments SET subscription_id = $1 WHERE id = $2`,
        [subResult.rows[0].id, paymentId]
      );
      
      return res.json({
        message: '✅ Payment simulated successfully! Subscription activated.',
        payment_id: paymentId,
        subscription_id: subResult.rows[0].id,
        plan,
        expires_at: new Date(Date.now() + getPlanDurationMs(plan)).toISOString(),
      });
    }
    
    // For per-download payments
    res.json({
      message: '✅ Payment simulated successfully! You can now download the document.',
      payment_id: paymentId,
      document_id: payment.document_id,
    });
    
  } catch (err) {
    console.error('simulatePaymentSuccess error:', err);
    res.status(500).json({ error: 'Failed to simulate payment.' });
  }
};

// Helper function to convert plan duration to milliseconds
function getPlanDurationMs(plan) {
  const durations = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };
  return durations[plan] || durations.daily;
}

module.exports = {
  initiateSubscription,
  initiatePerDownload,
  paymentWebhook,
  checkPaymentStatus,
  getRevenueSummary,
  simulatePaymentSuccess, // Export test function
};

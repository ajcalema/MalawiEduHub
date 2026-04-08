const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const params = [];
    let whereExtra = '';
    const safe = q.replace(/%/g, '').replace(/_/g, '').replace(/\\/g, '');
    if (safe.length >= 1) {
      params.push(`%${safe}%`);
      whereExtra = 'AND (s.name ILIKE $1 OR s.slug ILIKE $1)';
    }

    const result = await query(
      `SELECT s.*, COUNT(d.id) AS document_count
       FROM subjects s
       LEFT JOIN documents d ON d.subject_id = s.id AND d.status = 'approved'
       WHERE s.is_active = TRUE
       ${whereExtra}
       GROUP BY s.id
       ORDER BY s.sort_order, s.name
       LIMIT 50`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
});

module.exports = router;

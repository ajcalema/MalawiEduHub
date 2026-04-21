/**
 * MalawiEduHub — Learning Room API Routes
 * File: backend/src/routes/learning.js
 *
 * Student endpoints (auth required)
 *   GET  /api/learn/classes
 *   GET  /api/learn/classes/:classId/subjects
 *   GET  /api/learn/classes/:classId/subjects/:subjectId/topics
 *   GET  /api/learn/topics/:topicId/resources
 *   POST /api/learn/topics/:topicId/progress
 *   GET  /api/learn/progress
 *
 * Admin endpoints (admin only)
 *   GET    /api/learn/admin/classes
 *   POST   /api/learn/admin/classes/:classId/subjects
 *   DELETE /api/learn/admin/classes/:classId/subjects/:subjectId
 *   GET    /api/learn/admin/topics
 *   POST   /api/learn/admin/topics
 *   PUT    /api/learn/admin/topics/:id
 *   DELETE /api/learn/admin/topics/:id
 *   POST   /api/learn/admin/topics/:id/resources
 *   DELETE /api/learn/admin/topics/:id/resources/:documentId
 */

const express = require('express')
const router = express.Router()
const { query } = require('../config/db')
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth')

// STUDENT — GET all active classes
router.get('/classes', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, slug, description, sort_order
       FROM classes WHERE is_active = TRUE ORDER BY sort_order`
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching classes:', err)
    res.status(500).json({ error: 'Failed to fetch classes.' })
  }
})

// STUDENT — GET subjects for a class
router.get('/classes/:classId/subjects', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM v_class_subjects
       WHERE class_id = $1 AND is_active = TRUE
       ORDER BY sort_order, subject_name`,
      [req.params.classId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching subjects:', err)
    res.status(500).json({ error: 'Failed to fetch subjects.' })
  }
})

// STUDENT — GET topics for class + subject
router.get('/classes/:classId/subjects/:subjectId/topics', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.id, t.title, t.description, t.sort_order,
              t.resource_count,
              sp.completed, sp.completed_at, sp.last_visited
       FROM v_topics_full t
       LEFT JOIN student_progress sp
         ON sp.topic_id = t.id AND sp.user_id = $3
       WHERE t.class_id = $1 AND t.subject_id = $2 AND t.is_active = TRUE
       ORDER BY t.sort_order`,
      [req.params.classId, req.params.subjectId, req.user?.id || null]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching topics:', err)
    res.status(500).json({ error: 'Failed to fetch topics.' })
  }
})

// STUDENT — GET resources for a topic
router.get('/topics/:topicId/resources', optionalAuth, async (req, res) => {
  try {
    const topicResult = await query(
      `SELECT * FROM v_topics_full WHERE id = $1 AND is_active = TRUE`,
      [req.params.topicId]
    )
    if (!topicResult.rows[0]) return res.status(404).json({ error: 'Topic not found.' })

    const resources = await query(
      `SELECT d.id, d.title, d.doc_type, d.level, d.year,
              d.price_mwk, d.is_free, d.download_count,
              d.file_type, s.name AS subject_name,
              tr.sort_order
       FROM topic_resources tr
       JOIN documents d ON tr.document_id = d.id
       JOIN subjects s ON d.subject_id = s.id
       WHERE tr.topic_id = $1 AND d.status = 'approved'
       ORDER BY tr.sort_order, d.doc_type, d.year DESC`,
      [req.params.topicId]
    )

    // Track visit in progress
    if (req.user) {
      await query(
        `INSERT INTO student_progress (user_id, topic_id, last_visited)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, topic_id)
         DO UPDATE SET last_visited = NOW()`,
        [req.user.id, req.params.topicId]
      )
    }

    res.json({ topic: topicResult.rows[0], resources: resources.rows })
  } catch (err) {
    console.error('Error fetching topic resources:', err)
    res.status(500).json({ error: 'Failed to fetch topic resources.' })
  }
})

// STUDENT — Mark topic as complete / incomplete
router.post('/topics/:topicId/progress', requireAuth, async (req, res) => {
  try {
    const { completed } = req.body
    await query(
      `INSERT INTO student_progress (user_id, topic_id, completed, completed_at, last_visited)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, topic_id) DO UPDATE
         SET completed = $3,
             completed_at = $4,
             last_visited = NOW()`,
      [
        req.user.id,
        req.params.topicId,
        completed,
        completed ? new Date() : null,
      ]
    )
    res.json({ success: true, completed })
  } catch (err) {
    console.error('Error saving progress:', err)
    res.status(500).json({ error: 'Failed to save progress.' })
  }
})

// STUDENT — GET own progress summary
router.get('/progress', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT sp.topic_id, sp.completed, sp.completed_at, sp.last_visited,
              t.title AS topic_title,
              c.name AS class_name,
              s.name AS subject_name
       FROM student_progress sp
       JOIN topics t ON sp.topic_id = t.id
       JOIN classes c ON t.class_id = c.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE sp.user_id = $1
       ORDER BY sp.last_visited DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching progress:', err)
    res.status(500).json({ error: 'Failed to fetch progress.' })
  }
})

// ADMIN — GET all classes with subject counts
router.get('/admin/classes', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*,
         (SELECT COUNT(*) FROM class_subjects cs WHERE cs.class_id = c.id) AS subject_count,
         (SELECT COUNT(*) FROM topics t WHERE t.class_id = c.id) AS topic_count
       FROM classes c ORDER BY c.sort_order`
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching admin classes:', err)
    res.status(500).json({ error: 'Failed to fetch classes.' })
  }
})

// ADMIN — ADD a subject to a class
router.post('/admin/classes/:classId/subjects', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { subject_id, sort_order = 0 } = req.body
    await query(
      `INSERT INTO class_subjects (class_id, subject_id, sort_order)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [req.params.classId, subject_id, sort_order]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Error adding subject:', err)
    res.status(500).json({ error: 'Failed to add subject.' })
  }
})

// ADMIN — REMOVE a subject from a class
router.delete('/admin/classes/:classId/subjects/:subjectId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(
      `DELETE FROM class_subjects WHERE class_id=$1 AND subject_id=$2`,
      [req.params.classId, req.params.subjectId]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Error removing subject:', err)
    res.status(500).json({ error: 'Failed to remove subject.' })
  }
})

// ADMIN — GET all topics
router.get('/admin/topics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { class_id, subject_id } = req.query
    const conditions = ['1=1']
    const params = []
    if (class_id) { params.push(class_id); conditions.push(`class_id = $${params.length}`) }
    if (subject_id) { params.push(subject_id); conditions.push(`subject_id = $${params.length}`) }
    const result = await query(
      `SELECT * FROM v_topics_full WHERE ${conditions.join(' AND ')} ORDER BY class_id, subject_id, sort_order`,
      params
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching admin topics:', err)
    res.status(500).json({ error: 'Failed to fetch topics.' })
  }
})

// ADMIN — CREATE a topic
router.post('/admin/topics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { class_id, subject_id, title, description, sort_order = 0 } = req.body
    if (!class_id || !subject_id || !title)
      return res.status(400).json({ error: 'class_id, subject_id and title are required.' })

    // Auto-ensure class_subject link exists
    await query(
      `INSERT INTO class_subjects (class_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [class_id, subject_id]
    )

    const result = await query(
      `INSERT INTO topics (class_id, subject_id, title, description, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [class_id, subject_id, title.trim(), description || null, sort_order, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating topic:', err)
    res.status(500).json({ error: 'Failed to create topic.' })
  }
})

// ADMIN — UPDATE a topic
router.put('/admin/topics/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, sort_order, is_active } = req.body
    const result = await query(
      `UPDATE topics SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         sort_order = COALESCE($3, sort_order),
         is_active = COALESCE($4, is_active),
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, description, sort_order, is_active, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Topic not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error updating topic:', err)
    res.status(500).json({ error: 'Failed to update topic.' })
  }
})

// ADMIN — DELETE a topic
router.delete('/admin/topics/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM topics WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting topic:', err)
    res.status(500).json({ error: 'Failed to delete topic.' })
  }
})

// ADMIN — ATTACH a document to a topic
router.post('/admin/topics/:id/resources', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { document_id, sort_order = 0 } = req.body
    await query(
      `INSERT INTO topic_resources (topic_id, document_id, sort_order, added_by)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [req.params.id, document_id, sort_order, req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Error attaching resource:', err)
    res.status(500).json({ error: 'Failed to attach resource.' })
  }
})

// ADMIN — REMOVE a document from a topic
router.delete('/admin/topics/:id/resources/:documentId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(
      `DELETE FROM topic_resources WHERE topic_id=$1 AND document_id=$2`,
      [req.params.id, req.params.documentId]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Error removing resource:', err)
    res.status(500).json({ error: 'Failed to remove resource.' })
  }
})

module.exports = router
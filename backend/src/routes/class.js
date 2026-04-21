/**
 * Class-Based Learning Navigation Routes
 * Flow: Class -> Subject -> Topic -> Learning Room
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// Get all available classes
router.get('/classes', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, display_name, level_type, sort_order
      FROM classes
      WHERE is_active = TRUE
      ORDER BY sort_order ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get user's current class selection
router.get('/my-class', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT ucs.class_id, c.name, c.display_name, c.level_type
      FROM user_class_selection ucs
      JOIN classes c ON ucs.class_id = c.id
      WHERE ucs.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.json({ selected: false });
    }
    res.json({ selected: true, ...result.rows[0] });
  } catch (err) {
    console.error('Error fetching user class:', err);
    res.status(500).json({ error: 'Failed to fetch class selection' });
  }
});

// Set user's class selection
router.post('/select-class', requireAuth, async (req, res) => {
  try {
    const { class_id } = req.body;
    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    // Verify class exists
    const classCheck = await query(`SELECT id FROM classes WHERE id = $1 AND is_active = TRUE`, [class_id]);
    if (classCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid class' });
    }

    // Upsert class selection
    await query(`
      INSERT INTO user_class_selection (user_id, class_id, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET class_id = $2, updated_at = NOW()
    `, [req.user.id, class_id]);

    res.json({ success: true, class_id });
  } catch (err) {
    console.error('Error selecting class:', err);
    res.status(500).json({ error: 'Failed to select class' });
  }
});

// Get subjects filtered by user's selected class
router.get('/subjects', requireAuth, async (req, res) => {
  try {
    // Get user's class
    const classRes = await query(`
      SELECT class_id FROM user_class_selection WHERE user_id = $1
    `, [req.user.id]);

    if (classRes.rows.length === 0 || !classRes.rows[0].class_id) {
      return res.status(400).json({ error: 'Please select a class first' });
    }

    const classId = classRes.rows[0].class_id;

    // Get class type
    const classInfo = await query(`SELECT level_type FROM classes WHERE id = $1`, [classId]);
    if (classInfo.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid class' });
    }

    const levelType = classInfo.rows[0].level_type;

    // Get subjects that have topics for this class, with topic count
    const result = await query(`
      SELECT DISTINCT s.id, s.name, s.slug, s.icon_emoji, s.sort_order,
        COUNT(t.id) as topic_count
      FROM subjects s
      JOIN topics t ON s.id = t.subject_id
      WHERE t.class_id = $1 AND t.is_active = TRUE AND s.is_active = TRUE
      GROUP BY s.id, s.name, s.slug, s.icon_emoji, s.sort_order
      ORDER BY s.sort_order ASC
    `, [classId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get topics filtered by class + subject
router.get('/topics', requireAuth, async (req, res) => {
  try {
    const { subject_id } = req.query;
    if (!subject_id) {
      return res.status(400).json({ error: 'subject_id is required' });
    }

    // Get user's class
    const classRes = await query(`
      SELECT class_id FROM user_class_selection WHERE user_id = $1
    `, [req.user.id]);

    if (classRes.rows.length === 0 || !classRes.rows[0].class_id) {
      return res.status(400).json({ error: 'Please select a class first' });
    }

    const classId = classRes.rows[0].class_id;

    // Get topics for this class + subject
    const result = await query(`
      SELECT t.id, t.name, t.description, t.sort_order,
        COALESCE(utp.is_completed, FALSE) as is_completed,
        utp.completed_at
      FROM topics t
      LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id AND utp.user_id = $1
      WHERE t.class_id = $2 AND t.subject_id = $3 AND t.is_active = TRUE
      ORDER BY t.sort_order ASC
    `, [req.user.id, classId, subject_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching topics:', err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Mark topic as completed
router.post('/complete-topic', requireAuth, async (req, res) => {
  try {
    const { topic_id } = req.body;
    if (!topic_id) {
      return res.status(400).json({ error: 'topic_id is required' });
    }

    // Verify topic exists
    const topicCheck = await query(`SELECT id FROM topics WHERE id = $1`, [topic_id]);
    if (topicCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid topic' });
    }

    // Upsert progress
    await query(`
      INSERT INTO user_topic_progress (user_id, topic_id, is_completed, completed_at)
      VALUES ($1, $2, TRUE, NOW())
      ON CONFLICT (user_id, topic_id)
      DO UPDATE SET is_completed = TRUE, completed_at = NOW()
    `, [req.user.id, topic_id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error completing topic:', err);
    res.status(500).json({ error: 'Failed to complete topic' });
  }
});

// Get learning room data (topic + related documents)
router.get('/learning-room/:topicId', requireAuth, async (req, res) => {
  try {
    const { topicId } = req.params;

    // Get topic info
    const topicRes = await query(`
      SELECT t.id, t.name, t.description, t.subject_id, t.class_id,
        s.name as subject_name,
        c.name as class_name, c.display_name as class_display
      FROM topics t
      JOIN subjects s ON t.subject_id = s.id
      JOIN classes c ON t.class_id = c.id
      WHERE t.id = $1
    `, [topicId]);

    if (topicRes.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const topic = topicRes.rows[0];

    // Get user's completed topics for this subject to calculate progress
    const completedRes = await query(`
      SELECT COUNT(*) as completed_count
      FROM user_topic_progress utp
      JOIN topics t ON utp.topic_id = t.id
      WHERE utp.user_id = $1 AND utp.is_completed = TRUE
        AND t.subject_id = $2 AND t.class_id = $3
    `, [req.user.id, topic.subject_id, topic.class_id]);

    // Get total topics for this subject/class
    const totalRes = await query(`
      SELECT COUNT(*) as total_count
      FROM topics
      WHERE subject_id = $1 AND class_id = $2 AND is_active = TRUE
    `, [topic.subject_id, topic.class_id]);

    // Get related documents for this subject + class (filtered by level)
    const levelMap = { 1: 'jce', 2: 'jce', 3: 'msce', 4: 'msce' };
    const level = levelMap[topic.class_id] || 'jce';

    const docsRes = await query(`
      SELECT d.id, d.title, d.doc_type, d.year, d.price_mwk, d.is_free,
        d.download_count, d.view_count
      FROM documents d
      WHERE d.subject_id = $1 AND d.level = $2 AND d.status = 'approved'
      ORDER BY d.download_count DESC
      LIMIT 20
    `, [topic.subject_id, level]);

    // Get user's progress for this topic
    const progressRes = await query(`
      SELECT is_completed, completed_at
      FROM user_topic_progress
      WHERE user_id = $1 AND topic_id = $2
    `, [req.user.id, topicId]);

    res.json({
      topic,
      progress: progressRes.rows[0] || null,
      completed_count: parseInt(completedRes.rows[0]?.completed_count || 0),
      total_count: parseInt(totalRes.rows[0]?.total_count || 0),
      documents: docsRes.rows
    });
  } catch (err) {
    console.error('Error fetching learning room:', err);
    res.status(500).json({ error: 'Failed to fetch learning room' });
  }
});

// Get next topic in sequence
router.get('/next-topic/:currentTopicId', requireAuth, async (req, res) => {
  try {
    const { currentTopicId } = req.params;

    // Get current topic
    const currentRes = await query(`
      SELECT subject_id, class_id, sort_order
      FROM topics
      WHERE id = $1
    `, [currentTopicId]);

    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const { subject_id, class_id, sort_order } = currentRes.rows[0];

    // Get next topic
    const nextRes = await query(`
      SELECT id, name, sort_order
      FROM topics
      WHERE class_id = $1 AND subject_id = $2 AND sort_order > $3 AND is_active = TRUE
      ORDER BY sort_order ASC
      LIMIT 1
    `, [class_id, subject_id, sort_order]);

    if (nextRes.rows.length === 0) {
      return res.json({ next: null });
    }

    res.json({ next: nextRes.rows[0] });
  } catch (err) {
    console.error('Error getting next topic:', err);
    res.status(500).json({ error: 'Failed to get next topic' });
  }
});

module.exports = router;
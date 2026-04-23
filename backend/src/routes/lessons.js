/**
 * MalawiEduHub — Lessons & Quizzes API Routes
 * File: backend/src/routes/lessons.js
 *
 * Admin endpoints (admin only)
 *   GET    /api/lessons/admin/topics/:topicId/lessons
 *   POST   /api/lessons/admin/lessons
 *   PUT    /api/lessons/admin/lessons/:id
 *   DELETE /api/lessons/admin/lessons/:id
 *   
 *   GET    /api/lessons/admin/lessons/:lessonId/materials
 *   POST   /api/lessons/admin/lessons/:lessonId/materials
 *   PUT    /api/lessons/admin/lessons/:lessonId/materials/:materialId
 *   DELETE /api/lessons/admin/lessons/:lessonId/materials/:materialId
 *   
 *   GET    /api/lessons/admin/topics/:topicId/quizzes
 *   POST   /api/lessons/admin/quizzes
 *   PUT    /api/lessons/admin/quizzes/:id
 *   DELETE /api/lessons/admin/quizzes/:id
 *   
 *   POST   /api/lessons/admin/quizzes/:quizId/questions
 *   PUT    /api/lessons/admin/quizzes/:quizId/questions/:questionId
 *   DELETE /api/lessons/admin/quizzes/:quizId/questions/:questionId
 *   
 *   POST   /api/lessons/admin/questions/:questionId/answers
 *   PUT    /api/lessons/admin/questions/:questionId/answers/:answerId
 *   DELETE /api/lessons/admin/questions/:questionId/answers/:answerId
 *
 * Student endpoints (auth required)
 *   GET    /api/lessons/topics/:topicId/lessons
 *   GET    /api/lessons/lessons/:lessonId
 *   GET    /api/lessons/topics/:topicId/quizzes
 *   GET    /api/lessons/quizzes/:quizId
 *   POST   /api/lessons/quizzes/:quizId/attempt
 */

const express = require('express')
const router = express.Router()
const { query } = require('../config/db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

// ═══════════════════════════════════════════════════
// ADMIN — LESSONS
// ═══════════════════════════════════════════════════

// GET all lessons for a topic
router.get('/admin/topics/:topicId/lessons', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM v_lessons_full WHERE topic_id = $1 ORDER BY sort_order`,
      [req.params.topicId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching lessons:', err)
    res.status(500).json({ error: 'Failed to fetch lessons.' })
  }
})

// CREATE a lesson
router.post('/admin/lessons', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { topic_id, title, content, content_html, video_url, sort_order = 0, duration_minutes } = req.body
    if (!topic_id || !title) {
      return res.status(400).json({ error: 'topic_id and title are required.' })
    }

    const result = await query(
      `INSERT INTO lessons (topic_id, title, content, content_html, video_url, sort_order, duration_minutes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [topic_id, title.trim(), content || null, content_html || null, video_url || null, sort_order, duration_minutes || null, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating lesson:', err)
    res.status(500).json({ error: 'Failed to create lesson.' })
  }
})

// UPDATE a lesson
router.put('/admin/lessons/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, content, content_html, video_url, sort_order, duration_minutes, is_active } = req.body
    const result = await query(
      `UPDATE lessons SET
         title = COALESCE($1, title),
         content = COALESCE($2, content),
         content_html = COALESCE($3, content_html),
         video_url = COALESCE($4, video_url),
         sort_order = COALESCE($5, sort_order),
         duration_minutes = COALESCE($6, duration_minutes),
         is_active = COALESCE($7, is_active),
         updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title, content, content_html, video_url, sort_order, duration_minutes, is_active, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Lesson not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error updating lesson:', err)
    res.status(500).json({ error: 'Failed to update lesson.' })
  }
})

// DELETE a lesson
router.delete('/admin/lessons/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM lessons WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting lesson:', err)
    res.status(500).json({ error: 'Failed to delete lesson.' })
  }
})

// ═══════════════════════════════════════════════════
// ADMIN — LESSON MATERIALS
// ═══════════════════════════════════════════════════

// GET materials for a lesson
router.get('/admin/lessons/:lessonId/materials', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT lm.*, d.title as document_title, d.file_type
       FROM lesson_materials lm
       LEFT JOIN documents d ON lm.document_id = d.id
       WHERE lm.lesson_id = $1 AND lm.is_active = TRUE
       ORDER BY lm.sort_order`,
      [req.params.lessonId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching materials:', err)
    res.status(500).json({ error: 'Failed to fetch materials.' })
  }
})

// CREATE a material
router.post('/admin/lessons/:lessonId/materials', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, material_type, content, document_id, sort_order = 0 } = req.body
    if (!title || !material_type) {
      return res.status(400).json({ error: 'title and material_type are required.' })
    }

    const result = await query(
      `INSERT INTO lesson_materials (lesson_id, title, material_type, content, document_id, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.lessonId, title.trim(), material_type, content || null, document_id || null, sort_order]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating material:', err)
    res.status(500).json({ error: 'Failed to create material.' })
  }
})

// UPDATE a material
router.put('/admin/lessons/:lessonId/materials/:materialId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, material_type, content, document_id, sort_order, is_active } = req.body
    const result = await query(
      `UPDATE lesson_materials SET
         title = COALESCE($1, title),
         material_type = COALESCE($2, material_type),
         content = COALESCE($3, content),
         document_id = COALESCE($4, document_id),
         sort_order = COALESCE($5, sort_order),
         is_active = COALESCE($6, is_active)
       WHERE id = $7 AND lesson_id = $8 RETURNING *`,
      [title, material_type, content, document_id, sort_order, is_active, req.params.materialId, req.params.lessonId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Material not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error updating material:', err)
    res.status(500).json({ error: 'Failed to update material.' })
  }
})

// DELETE a material
router.delete('/admin/lessons/:lessonId/materials/:materialId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM lesson_materials WHERE id = $1 AND lesson_id = $2`, [req.params.materialId, req.params.lessonId])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting material:', err)
    res.status(500).json({ error: 'Failed to delete material.' })
  }
})

// ═══════════════════════════════════════════════════
// ADMIN — QUIZZES
// ═══════════════════════════════════════════════════

// GET all quizzes for a topic
router.get('/admin/topics/:topicId/quizzes', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM v_quizzes_full WHERE topic_id = $1 ORDER BY created_at DESC`,
      [req.params.topicId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching quizzes:', err)
    res.status(500).json({ error: 'Failed to fetch quizzes.' })
  }
})

// CREATE a quiz
router.post('/admin/quizzes', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { topic_id, lesson_id, title, description, passing_score = 70, time_limit_minutes } = req.body
    if (!topic_id || !title) {
      return res.status(400).json({ error: 'topic_id and title are required.' })
    }

    const result = await query(
      `INSERT INTO quizzes (topic_id, lesson_id, title, description, passing_score, time_limit_minutes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [topic_id, lesson_id || null, title.trim(), description || null, passing_score, time_limit_minutes || null, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating quiz:', err)
    res.status(500).json({ error: 'Failed to create quiz.' })
  }
})

// UPDATE a quiz
router.put('/admin/quizzes/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, passing_score, time_limit_minutes, is_active } = req.body
    const result = await query(
      `UPDATE quizzes SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         passing_score = COALESCE($3, passing_score),
         time_limit_minutes = COALESCE($4, time_limit_minutes),
         is_active = COALESCE($5, is_active),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, passing_score, time_limit_minutes, is_active, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Quiz not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error updating quiz:', err)
    res.status(500).json({ error: 'Failed to update quiz.' })
  }
})

// DELETE a quiz
router.delete('/admin/quizzes/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM quizzes WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting quiz:', err)
    res.status(500).json({ error: 'Failed to delete quiz.' })
  }
})

// ═══════════════════════════════════════════════════
// ADMIN — QUIZ QUESTIONS
// ═══════════════════════════════════════════════════

// GET questions for a quiz (admin view with is_correct)
router.get('/admin/quizzes/:quizId/questions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const questionsResult = await query(
      `SELECT qq.id, qq.question as question_text, qq.question_type, qq.points, qq.sort_order,
              json_agg(
                json_build_object(
                  'id', qa.id,
                  'answer_text', qa.answer_text,
                  'is_correct', qa.is_correct,
                  'sort_order', qa.sort_order
                ) ORDER BY qa.sort_order
              ) FILTER (WHERE qa.id IS NOT NULL) as answers
       FROM quiz_questions qq
       LEFT JOIN quiz_answers qa ON qq.id = qa.question_id
       WHERE qq.quiz_id = $1
       GROUP BY qq.id, qq.question, qq.question_type, qq.points, qq.sort_order
       ORDER BY qq.sort_order`,
      [req.params.quizId]
    )

    res.json(questionsResult.rows)
  } catch (err) {
    console.error('Error fetching admin questions:', err)
    res.status(500).json({ error: 'Failed to fetch questions.' })
  }
})

// CREATE a question
router.post('/admin/quizzes/:quizId/questions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { question, question_type = 'multiple_choice', points = 1, sort_order = 0 } = req.body
    if (!question) {
      return res.status(400).json({ error: 'question text is required.' })
    }

    const result = await query(
      `INSERT INTO quiz_questions (quiz_id, question, question_type, points, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.quizId, question.trim(), question_type, points, sort_order]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating question:', err)
    res.status(500).json({ error: 'Failed to create question.' })
  }
})

// UPDATE a question
router.put('/admin/quizzes/:quizId/questions/:questionId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { question, question_type, points, sort_order } = req.body
    const result = await query(
      `UPDATE quiz_questions SET
         question = COALESCE($1, question),
         question_type = COALESCE($2, question_type),
         points = COALESCE($3, points),
         sort_order = COALESCE($4, sort_order)
       WHERE id = $5 AND quiz_id = $6 RETURNING *`,
      [question, question_type, points, sort_order, req.params.questionId, req.params.quizId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Question not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error updating question:', err)
    res.status(500).json({ error: 'Failed to update question.' })
  }
})

// DELETE a question
router.delete('/admin/quizzes/:quizId/questions/:questionId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM quiz_questions WHERE id = $1 AND quiz_id = $2`, [req.params.questionId, req.params.quizId])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting question:', err)
    res.status(500).json({ error: 'Failed to delete question.' })
  }
})

// ═══════════════════════════════════════════════════
// ADMIN — QUIZ ANSWERS
// ═══════════════════════════════════════════════════

// CREATE an answer
router.post('/admin/questions/:questionId/answers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { answer_text, is_correct = false, sort_order = 0 } = req.body
    if (!answer_text) {
      return res.status(400).json({ error: 'answer_text is required.' })
    }

    const result = await query(
      `INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.questionId, answer_text.trim(), is_correct, sort_order]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating answer:', err)
    res.status(500).json({ error: 'Failed to create answer.' })
  }
})

// UPDATE an answer
router.put('/admin/questions/:questionId/answers/:answerId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { answer_text, is_correct, sort_order } = req.body
    const result = await query(
      `UPDATE quiz_answers SET
         answer_text = COALESCE($1, answer_text),
         is_correct = COALESCE($2, is_correct),
         sort_order = COALESCE($3, sort_order)
       WHERE id = $4 AND question_id = $5 RETURNING *`,
      [answer_text, is_correct, sort_order, req.params.answerId, req.params.questionId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Answer not found.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error updating answer:', err)
    res.status(500).json({ error: 'Failed to update answer.' })
  }
})

// DELETE an answer
router.delete('/admin/questions/:questionId/answers/:answerId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM quiz_answers WHERE id = $1 AND question_id = $2`, [req.params.answerId, req.params.questionId])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting answer:', err)
    res.status(500).json({ error: 'Failed to delete answer.' })
  }
})

// ═══════════════════════════════════════════════════
// STUDENT — LESSONS & QUIZZES
// ═══════════════════════════════════════════════════

// GET all lessons for a topic (student view)
router.get('/topics/:topicId/lessons', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, content, content_html, video_url, sort_order, duration_minutes, material_count
       FROM v_lessons_full
       WHERE topic_id = $1 AND is_active = TRUE
       ORDER BY sort_order`,
      [req.params.topicId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching lessons:', err)
    res.status(500).json({ error: 'Failed to fetch lessons.' })
  }
})

// GET a single lesson with materials (student view)
router.get('/lessons/:lessonId', requireAuth, async (req, res) => {
  try {
    const lessonResult = await query(
      `SELECT id, title, content, content_html, video_url, duration_minutes, material_count
       FROM v_lessons_full
       WHERE id = $1 AND is_active = TRUE`,
      [req.params.lessonId]
    )
    if (!lessonResult.rows[0]) {
      return res.status(404).json({ error: 'Lesson not found.' })
    }

    const materialsResult = await query(
      `SELECT lm.id, lm.title, lm.material_type, lm.content, lm.sort_order,
              d.title as document_title, d.file_type, d.price_mwk, d.is_free
       FROM lesson_materials lm
       LEFT JOIN documents d ON lm.document_id = d.id
       WHERE lm.lesson_id = $1 AND lm.is_active = TRUE
       ORDER BY lm.sort_order`,
      [req.params.lessonId]
    )

    res.json({
      lesson: lessonResult.rows[0],
      materials: materialsResult.rows
    })
  } catch (err) {
    console.error('Error fetching lesson:', err)
    res.status(500).json({ error: 'Failed to fetch lesson.' })
  }
})

// GET all quizzes for a topic (student view)
router.get('/topics/:topicId/quizzes', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, passing_score, time_limit_minutes, question_count
       FROM v_quizzes_full
       WHERE topic_id = $1 AND is_active = TRUE
       ORDER BY created_at DESC`,
      [req.params.topicId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching quizzes:', err)
    res.status(500).json({ error: 'Failed to fetch quizzes.' })
  }
})

// GET a quiz with questions (student view)
router.get('/quizzes/:quizId', requireAuth, async (req, res) => {
  try {
    const quizResult = await query(
      `SELECT id, title, description, passing_score, time_limit_minutes
       FROM v_quizzes_full
       WHERE id = $1 AND is_active = TRUE`,
      [req.params.quizId]
    )
    if (!quizResult.rows[0]) {
      return res.status(404).json({ error: 'Quiz not found.' })
    }

    const questionsResult = await query(
      `SELECT qq.id, qq.question, qq.question_type, qq.points, qq.sort_order,
              json_agg(
                json_build_object(
                  'id', qa.id,
                  'answer_text', qa.answer_text,
                  'sort_order', qa.sort_order
                ) ORDER BY qa.sort_order
              ) as answers
       FROM quiz_questions qq
       LEFT JOIN quiz_answers qa ON qq.id = qa.question_id
       WHERE qq.quiz_id = $1
       GROUP BY qq.id, qq.question, qq.question_type, qq.points, qq.sort_order
       ORDER BY qq.sort_order`,
      [req.params.quizId]
    )

    res.json({
      quiz: quizResult.rows[0],
      questions: questionsResult.rows
    })
  } catch (err) {
    console.error('Error fetching quiz:', err)
    res.status(500).json({ error: 'Failed to fetch quiz.' })
  }
})

// GET quiz questions only (student view)
router.get('/quizzes/:quizId/questions', requireAuth, async (req, res) => {
  try {
    const questionsResult = await query(
      `SELECT qq.id, qq.question, qq.question_type, qq.points, qq.sort_order,
              json_agg(
                json_build_object(
                  'id', qa.id,
                  'answer_text', qa.answer_text,
                  'sort_order', qa.sort_order
                ) ORDER BY qa.sort_order
              ) as answers
       FROM quiz_questions qq
       LEFT JOIN quiz_answers qa ON qq.id = qa.question_id
       WHERE qq.quiz_id = $1
       GROUP BY qq.id, qq.question, qq.question_type, qq.points, qq.sort_order
       ORDER BY qq.sort_order`,
      [req.params.quizId]
    )

    res.json(questionsResult.rows)
  } catch (err) {
    console.error('Error fetching questions:', err)
    res.status(500).json({ error: 'Failed to fetch questions.' })
  }
})

// SUBMIT a quiz attempt
router.post('/quizzes/:quizId/attempt', requireAuth, async (req, res) => {
  try {
    const { answers } = req.body // [{ question_id, answer_text }]
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required.' })
    }

    // Get quiz info
    const quizResult = await query(
      `SELECT id, passing_score FROM quizzes WHERE id = $1 AND is_active = TRUE`,
      [req.params.quizId]
    )
    if (!quizResult.rows[0]) {
      return res.status(404).json({ error: 'Quiz not found.' })
    }

    // Calculate score first
    let totalPoints = 0
    let earnedPoints = 0
    const answerResults = []

    for (const answer of answers) {
      const questionResult = await query(
        `SELECT points FROM quiz_questions WHERE id = $1`,
        [answer.question_id]
      )
      if (questionResult.rows[0]) {
        totalPoints += questionResult.rows[0].points
        
        // Check if answer is correct
        const correctAnswerResult = await query(
          `SELECT COUNT(*) as correct_count FROM quiz_answers 
           WHERE question_id = $1 AND answer_text = $2 AND is_correct = TRUE`,
          [answer.question_id, answer.answer_text]
        )
        
        const isCorrect = correctAnswerResult.rows[0].correct_count > 0
        if (isCorrect) {
          earnedPoints += questionResult.rows[0].points
        }

        // Store answer result for later insertion
        answerResults.push({
          question_id: answer.question_id,
          answer_text: answer.answer_text,
          is_correct: isCorrect
        })
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    // Create attempt FIRST
    const attemptResult = await query(
      `INSERT INTO quiz_attempts (quiz_id, user_id, score, total_points, earned_points, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [req.params.quizId, req.user.id, score, totalPoints, earnedPoints]
    )

    const attemptId = attemptResult.rows[0].id

    // Now save all attempt answers with the correct attempt_id
    for (const answerResult of answerResults) {
      await query(
        `INSERT INTO quiz_attempt_answers (attempt_id, question_id, answer_text, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [attemptId, answerResult.question_id, answerResult.answer_text, answerResult.is_correct]
      )
    }

    res.json({
      success: true,
      attempt_id: attemptId,
      score,
      total_points: totalPoints,
      earned_points: earnedPoints,
      passing_score: quizResult.rows[0].passing_score,
      passed: score >= quizResult.rows[0].passing_score
    })
  } catch (err) {
    console.error('Error submitting quiz:', err)
    res.status(500).json({ error: 'Failed to submit quiz.' })
  }
})

module.exports = router

const { query } = require('../config/db');

const SUBJECT_PROGRESS_SQL = `
  SELECT
    s.id AS subject_id,
    s.name AS subject_name,
    s.slug AS subject_slug,
    s.icon_emoji AS subject_icon,
    COUNT(DISTINCT l.id)::INT AS total_lessons,
    COUNT(DISTINCT lc.lesson_id)::INT AS lessons_completed,
    CASE
      WHEN COUNT(DISTINCT l.id) = 0 THEN 0
      ELSE ROUND((COUNT(DISTINCT lc.lesson_id)::NUMERIC / COUNT(DISTINCT l.id)::NUMERIC) * 100, 1)
    END AS progress_percentage
  FROM subjects s
  JOIN topics t
    ON t.subject_id = s.id
   AND t.is_active = TRUE
  JOIN classes c
    ON c.id = t.class_id
   AND c.is_active = TRUE
  JOIN lessons l
    ON l.topic_id = t.id
   AND l.is_active = TRUE
  LEFT JOIN lesson_completions lc
    ON lc.lesson_id = l.id
   AND lc.user_id = $1
  WHERE s.is_active = TRUE
  GROUP BY s.id, s.name, s.slug, s.icon_emoji, s.sort_order
  ORDER BY s.sort_order, s.name
`;

const getSubjectProgressRows = async (dbOrUserId, maybeUserId) => {
  const hasCustomDb = typeof dbOrUserId?.query === 'function';
  const db = hasCustomDb ? dbOrUserId : { query };
  const userId = hasCustomDb ? maybeUserId : dbOrUserId;
  const result = await db.query(SUBJECT_PROGRESS_SQL, [userId]);
  return result.rows;
};

const syncUserProgress = async (dbOrUserId, maybeUserId) => {
  const hasCustomDb = typeof dbOrUserId?.query === 'function';
  const db = hasCustomDb ? dbOrUserId : { query };
  const userId = hasCustomDb ? maybeUserId : dbOrUserId;
  const rows = await getSubjectProgressRows(db, userId);

  if (!rows.length) {
    await db.query(`DELETE FROM user_progress WHERE user_id = $1`, [userId]);
    return [];
  }

  await db.query(
    `DELETE FROM user_progress
     WHERE user_id = $1
       AND subject_id <> ALL($2::int[])`,
    [userId, rows.map((row) => row.subject_id)]
  );

  for (const row of rows) {
    await db.query(
      `INSERT INTO user_progress
         (user_id, subject_id, lessons_completed, total_lessons, progress_percentage, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, subject_id)
       DO UPDATE SET
         lessons_completed = EXCLUDED.lessons_completed,
         total_lessons = EXCLUDED.total_lessons,
         progress_percentage = EXCLUDED.progress_percentage,
         updated_at = NOW()`,
      [
        userId,
        row.subject_id,
        row.lessons_completed,
        row.total_lessons,
        row.progress_percentage,
      ]
    );
  }

  return rows;
};

const markLessonCompleted = async (dbOrPayload, maybePayload) => {
  const hasCustomDb = typeof dbOrPayload?.query === 'function';
  const db = hasCustomDb ? dbOrPayload : { query };
  const payload = hasCustomDb ? maybePayload : dbOrPayload;
  const { userId, lessonId } = payload;

  const lessonResult = await db.query(
    `SELECT
        l.id,
        l.title,
        t.id AS topic_id,
        t.subject_id,
        t.title AS topic_title,
        s.name AS subject_name
     FROM lessons l
     JOIN topics t ON t.id = l.topic_id
     JOIN subjects s ON s.id = t.subject_id
     WHERE l.id = $1 AND l.is_active = TRUE`,
    [lessonId]
  );

  const lesson = lessonResult.rows[0];
  if (!lesson) {
    return { notFound: true };
  }

  const completionResult = await db.query(
    `INSERT INTO lesson_completions (user_id, lesson_id, completed_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, lesson_id) DO NOTHING
     RETURNING id, completed_at`,
    [userId, lessonId]
  );

  await syncUserProgress(db, userId);

  return {
    lesson,
    inserted: !!completionResult.rows[0],
    completedAt: completionResult.rows[0]?.completed_at || null,
  };
};

const getOverview = async (userId) => {
  await syncUserProgress(userId);

  const [lessons, quizzes, downloads] = await Promise.all([
    query(
      `SELECT COUNT(*)::INT AS total_lessons_completed
       FROM lesson_completions
       WHERE user_id = $1`,
      [userId]
    ),
    query(
      `SELECT
          COUNT(*)::INT AS total_quizzes_taken,
          COALESCE(ROUND(AVG(score), 1), 0) AS average_quiz_score
       FROM quiz_attempts
       WHERE user_id = $1`,
      [userId]
    ),
    query(
      `SELECT COUNT(*)::INT AS total_documents_downloaded
       FROM downloads
       WHERE user_id = $1`,
      [userId]
    ),
  ]);

  return {
    total_lessons_completed: lessons.rows[0]?.total_lessons_completed || 0,
    total_quizzes_taken: quizzes.rows[0]?.total_quizzes_taken || 0,
    average_quiz_score: Number(quizzes.rows[0]?.average_quiz_score || 0),
    total_documents_downloaded: downloads.rows[0]?.total_documents_downloaded || 0,
  };
};

const getSubjectsProgress = async (userId) => {
  const rows = await syncUserProgress(userId);
  return rows.map((row) => ({
    subject_id: row.subject_id,
    subject_name: row.subject_name,
    subject_slug: row.subject_slug,
    subject_icon: row.subject_icon,
    lessons_completed: row.lessons_completed,
    total_lessons: row.total_lessons,
    progress_percentage: Number(row.progress_percentage || 0),
  }));
};

const getRecentActivity = async (userId, limit = 10) => {
  const result = await query(
    `SELECT
        ua.id,
        ua.type,
        ua.reference_id,
        ua.description,
        ua.created_at,
        CASE
          WHEN ua.type = 'lesson' THEN l.title
          WHEN ua.type = 'quiz' THEN q.title
          WHEN ua.type = 'document' THEN d.title
          ELSE ua.description
        END AS title
     FROM user_activity ua
     LEFT JOIN lessons l
       ON ua.type = 'lesson'
      AND l.id::TEXT = ua.reference_id
     LEFT JOIN quizzes q
       ON ua.type = 'quiz'
      AND q.id::TEXT = ua.reference_id
     LEFT JOIN documents d
       ON ua.type = 'document'
      AND d.id::TEXT = ua.reference_id
     WHERE ua.user_id = $1
     ORDER BY ua.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
};

const getQuizPerformance = async (userId, limit = 10) => {
  const result = await query(
    `WITH attempts AS (
       SELECT
         qa.id,
         qa.quiz_id,
         qa.score,
         qa.total_points,
         qa.earned_points,
         qa.completed_at,
         q.title AS quiz_title,
         q.passing_score,
         t.title AS topic_title,
         s.name AS subject_name,
         LAG(qa.score) OVER (PARTITION BY qa.quiz_id ORDER BY qa.completed_at) AS previous_score
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
       JOIN topics t ON t.id = q.topic_id
       JOIN subjects s ON s.id = t.subject_id
       WHERE qa.user_id = $1
     )
     SELECT
       id,
       quiz_id,
       quiz_title,
       topic_title,
       subject_name,
       score,
       total_points,
       earned_points,
       passing_score,
       completed_at,
       CASE WHEN score >= passing_score THEN 'pass' ELSE 'fail' END AS status,
       CASE
         WHEN previous_score IS NULL THEN NULL
         WHEN score > previous_score THEN 'improving'
         WHEN score < previous_score THEN 'declining'
         ELSE 'steady'
       END AS trend
     FROM attempts
     ORDER BY completed_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
};

module.exports = {
  getOverview,
  getQuizPerformance,
  getRecentActivity,
  getSubjectsProgress,
  getSubjectProgressRows,
  markLessonCompleted,
  syncUserProgress,
};

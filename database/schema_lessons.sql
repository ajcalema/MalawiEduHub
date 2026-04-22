-- =============================================================
-- MalawiEduHub — Lessons, Materials & Quizzes Schema
-- Safe to run multiple times
-- =============================================================

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id          SERIAL PRIMARY KEY,
  topic_id    INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  content     TEXT,
  content_html TEXT,
  video_url   VARCHAR(500),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_topic ON lessons (topic_id);

-- Create lesson_materials table
CREATE TABLE IF NOT EXISTS lesson_materials (
  id          SERIAL PRIMARY KEY,
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  material_type VARCHAR(50) NOT NULL, -- 'document', 'video', 'audio', 'image', 'link', 'text'
  content     TEXT, -- for text materials or URLs
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- if linking to uploaded document
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson ON lesson_materials (lesson_id);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id          SERIAL PRIMARY KEY,
  topic_id    INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  lesson_id   INTEGER REFERENCES lessons(id) ON DELETE CASCADE, -- optional, can be topic-level or lesson-level
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70, -- percentage
  time_limit_minutes INTEGER, -- NULL for no time limit
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes (topic_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes (lesson_id);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id          SERIAL PRIMARY KEY,
  quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'short_answer'
  points      INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions (quiz_id);

-- Create quiz_answers table (possible answers for each question)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id          SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_question ON quiz_answers (question_id);

-- Create quiz_attempts table (student quiz submissions)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id          SERIAL PRIMARY KEY,
  quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL, -- percentage
  total_points INTEGER NOT NULL,
  earned_points INTEGER NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts (user_id);

-- Create quiz_attempt_answers table (student's answers for each question)
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id          SERIAL PRIMARY KEY,
  attempt_id  INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT, -- student's answer
  is_correct  BOOLEAN,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON quiz_attempt_answers (attempt_id);

-- Views
CREATE OR REPLACE VIEW v_lessons_full AS
SELECT l.*,
  t.title AS topic_title,
  t.class_id,
  t.subject_id,
  u.full_name AS created_by_name,
  (SELECT COUNT(*) FROM lesson_materials lm WHERE lm.lesson_id = l.id AND lm.is_active = TRUE) AS material_count
FROM lessons l
JOIN topics t ON l.topic_id = t.id
LEFT JOIN users u ON l.created_by = u.id;

CREATE OR REPLACE VIEW v_quizzes_full AS
SELECT q.*,
  t.title AS topic_title,
  t.class_id,
  t.subject_id,
  l.title AS lesson_title,
  u.full_name AS created_by_name,
  (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count
FROM quizzes q
JOIN topics t ON q.topic_id = t.id
LEFT JOIN lessons l ON q.lesson_id = l.id
LEFT JOIN users u ON q.created_by = u.id;

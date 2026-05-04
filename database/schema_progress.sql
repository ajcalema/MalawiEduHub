-- =============================================================
-- MalawiEduHub - Student Progress Dashboard Schema
-- Safe to run multiple times
-- =============================================================

CREATE TABLE IF NOT EXISTS lesson_completions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_user
  ON lesson_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson
  ON lesson_completions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_completed
  ON lesson_completions (user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS user_activity (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('lesson', 'quiz', 'document')),
  reference_id  TEXT NOT NULL,
  description   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user
  ON user_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created
  ON user_activity (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type
  ON user_activity (type);

CREATE TABLE IF NOT EXISTS user_progress (
  id                  SERIAL PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id          INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  lessons_completed   INTEGER NOT NULL DEFAULT 0,
  total_lessons       INTEGER NOT NULL DEFAULT 0,
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user
  ON user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_subject
  ON user_progress (subject_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_subject
  ON user_progress (user_id, subject_id);

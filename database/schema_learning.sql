-- =============================================================
-- MalawiEduHub — Learning Room Schema ADDITIONS
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)
-- =============================================================

CREATE TABLE IF NOT EXISTS classes (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO classes (name, slug, sort_order) VALUES
  ('Form 1', 'form-1', 1),
  ('Form 2', 'form-2', 2),
  ('Form 3', 'form-3', 3),
  ('Form 4', 'form-4', 4)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS class_subjects (
  id         SERIAL PRIMARY KEY,
  class_id   INTEGER NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS topics (
  id          SERIAL PRIMARY KEY,
  class_id    INTEGER NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_class_subject ON topics (class_id, subject_id);

CREATE TABLE IF NOT EXISTS topic_resources (
  id          SERIAL PRIMARY KEY,
  topic_id    INTEGER NOT NULL REFERENCES topics(id)    ON DELETE CASCADE,
  document_id UUID    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  added_by    UUID REFERENCES users(id),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_resources_topic    ON topic_resources (topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_resources_document ON topic_resources (document_id);

CREATE TABLE IF NOT EXISTS student_progress (
  id           SERIAL PRIMARY KEY,
  user_id      UUID    NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  topic_id     INTEGER NOT NULL REFERENCES topics(id)  ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  last_visited TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user  ON student_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_progress_topic ON student_progress (topic_id);

-- Views
CREATE OR REPLACE VIEW v_topics_full AS
SELECT t.*,
  c.name  AS class_name,  c.slug  AS class_slug,
  s.name  AS subject_name, s.slug AS subject_slug,
  s.icon_emoji AS subject_icon,
  u.full_name  AS created_by_name,
  (SELECT COUNT(*) FROM topic_resources tr WHERE tr.topic_id = t.id) AS resource_count
FROM topics t
JOIN classes  c ON t.class_id   = c.id
JOIN subjects s ON t.subject_id = s.id
LEFT JOIN users u ON t.created_by = u.id;

CREATE OR REPLACE VIEW v_class_subjects AS
SELECT cs.class_id, cs.subject_id, cs.sort_order, cs.is_active,
  c.name AS class_name, c.slug AS class_slug,
  s.name AS subject_name, s.slug AS subject_slug, s.icon_emoji,
  (SELECT COUNT(*) FROM topics t
   WHERE t.class_id = cs.class_id AND t.subject_id = cs.subject_id
     AND t.is_active = TRUE) AS topic_count
FROM class_subjects cs
JOIN classes  c ON cs.class_id   = c.id
JOIN subjects s ON cs.subject_id = s.id;

-- Seed example Biology topics for Form 2
DO $$
DECLARE v_cid INTEGER; v_sid INTEGER;
BEGIN
  SELECT id INTO v_cid FROM classes  WHERE slug = 'form-2';
  SELECT id INTO v_sid FROM subjects WHERE slug = 'biology';
  IF v_cid IS NOT NULL AND v_sid IS NOT NULL THEN
    INSERT INTO class_subjects (class_id, subject_id, sort_order)
    VALUES (v_cid, v_sid, 1) ON CONFLICT DO NOTHING;
    INSERT INTO topics (class_id, subject_id, title, sort_order) VALUES
      (v_cid, v_sid, 'Cell Structure and Function', 1),
      (v_cid, v_sid, 'Nutrition in Plants',         2),
      (v_cid, v_sid, 'Nutrition in Animals',        3),
      (v_cid, v_sid, 'Transport in Plants',         4),
      (v_cid, v_sid, 'Transport in Animals',        5),
      (v_cid, v_sid, 'Respiration',                 6)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
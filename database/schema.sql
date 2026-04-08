-- =============================================================
--  MalawiEduHub — Full PostgreSQL Database Schema
--  Version: 1.0
--  Description: Educational resource platform for Malawi
--  Includes: Users, Documents, Subscriptions, Payments,
--            Duplicate Detection, Admin, Downloads
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- accent-insensitive search

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('guest', 'student', 'teacher', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');

CREATE TYPE doc_level AS ENUM (
  'primary',        -- Std 1–8
  'jce',            -- Form 1–2
  'msce',           -- Form 3–4
  'tvet',           -- Technical/Vocational
  'university',
  'other'
);

CREATE TYPE doc_type AS ENUM (
  'past_paper',
  'notes',
  'textbook',
  'marking_scheme',
  'revision_guide',
  'assignment',
  'syllabus',
  'school_calendar',
  'other'
);

CREATE TYPE doc_status AS ENUM (
  'pending',        -- uploaded, awaiting admin review
  'approved',       -- live in library
  'rejected',       -- rejected by admin
  'flagged',        -- flagged for review (similarity 75–89%)
  'unpublished'     -- hidden by admin after approval
);

CREATE TYPE sub_plan AS ENUM ('daily', 'weekly', 'monthly', 'upload_pass');
CREATE TYPE sub_status AS ENUM ('active', 'expired', 'cancelled');

CREATE TYPE payment_method AS ENUM ('airtel_money', 'tnm_mpamba', 'manual');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_type AS ENUM ('subscription', 'per_download');

CREATE TYPE dup_layer AS ENUM ('hash', 'metadata', 'content', 'image');

-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name         VARCHAR(120) NOT NULL,
  email             VARCHAR(255) UNIQUE,
  phone             VARCHAR(20) UNIQUE,             -- Malawian number e.g. +265999123456
  password_hash     TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'student',
  status            user_status NOT NULL DEFAULT 'active',
  school            VARCHAR(200),                   -- school or institution name
  profile_photo_url TEXT,

  -- upload reward tracking
  approved_upload_count   INTEGER NOT NULL DEFAULT 0,  -- only counts approved docs
  upload_pass_earned_at   TIMESTAMPTZ,                  -- when last free pass was awarded
  upload_pass_threshold   INTEGER NOT NULL DEFAULT 5,   -- configurable per admin (5–10)

  -- auth
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at     TIMESTAMPTZ,
  password_reset_token      TEXT,
  password_reset_expires_at TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email   ON users (email);
CREATE INDEX idx_users_phone   ON users (phone);
CREATE INDEX idx_users_role    ON users (role);
CREATE INDEX idx_users_status  ON users (status);

-- =============================================================
-- SUBJECTS (lookup table — admin managed)
-- =============================================================

CREATE TABLE subjects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,   -- e.g. "Biology", "Mathematics"
  slug        VARCHAR(100) NOT NULL UNIQUE,   -- e.g. "biology", "mathematics"
  icon_emoji  VARCHAR(10),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO subjects (name, slug, icon_emoji, sort_order) VALUES
  ('Mathematics',    'mathematics',   '📐', 1),
  ('Biology',        'biology',       '🔬', 2),
  ('Chemistry',      'chemistry',     '⚗️',  3),
  ('Physics',        'physics',       '⚡', 4),
  ('English',        'english',       '📖', 5),
  ('Chichewa',       'chichewa',      '🗣️',  6),
  ('History',        'history',       '📜', 7),
  ('Geography',      'geography',     '🌍', 8),
  ('Agriculture',    'agriculture',   '🌿', 9),
  ('Computer Studies','computer-studies','💻',10),
  ('Business Studies','business-studies','📊',11),
  ('Religious Education','religious-education','✝️',12);

-- =============================================================
-- DOCUMENTS
-- =============================================================

CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(300) NOT NULL,
  description       TEXT,
  subject_id        INTEGER NOT NULL REFERENCES subjects(id),
  level             doc_level NOT NULL,
  doc_type          doc_type NOT NULL,
  year              SMALLINT,                     -- e.g. 2023

  -- uploader
  uploader_id       UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- file storage
  file_url          TEXT NOT NULL,                -- S3 / Cloudinary signed path
  file_name_original VARCHAR(255) NOT NULL,       -- original filename as uploaded
  file_size_bytes   BIGINT NOT NULL,
  file_type         VARCHAR(20) NOT NULL,         -- 'pdf', 'docx', 'pptx'

  -- duplicate detection fields
  file_hash         CHAR(64) NOT NULL UNIQUE,     -- SHA-256 hex of raw file bytes
  extracted_text    TEXT,                         -- text extracted from PDF/DOCX
  content_vector    JSONB,                        -- TF-IDF / MinHash vector (JSON array)
  image_phash       VARCHAR(64),                  -- perceptual hash of first page image

  -- status & moderation
  status            doc_status NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES users(id),    -- admin who approved/rejected
  reviewed_at       TIMESTAMPTZ,

  -- pricing
  price_mwk         NUMERIC(10,2) NOT NULL DEFAULT 200.00,  -- pay-per-download price
  is_free           BOOLEAN NOT NULL DEFAULT FALSE,          -- admin can mark free

  -- metrics
  view_count        INTEGER NOT NULL DEFAULT 0,
  download_count    INTEGER NOT NULL DEFAULT 0,

  -- counts toward upload pass?
  counts_toward_pass BOOLEAN NOT NULL DEFAULT FALSE,  -- set TRUE when approved

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for browse, search, and duplicate detection
CREATE INDEX idx_docs_subject      ON documents (subject_id);
CREATE INDEX idx_docs_level        ON documents (level);
CREATE INDEX idx_docs_type         ON documents (doc_type);
CREATE INDEX idx_docs_year         ON documents (year);
CREATE INDEX idx_docs_status       ON documents (status);
CREATE INDEX idx_docs_uploader     ON documents (uploader_id);
CREATE INDEX idx_docs_hash         ON documents (file_hash);
CREATE INDEX idx_docs_phash        ON documents (image_phash);
CREATE INDEX idx_docs_title_trgm   ON documents USING gin (title gin_trgm_ops);
CREATE INDEX idx_docs_text_trgm    ON documents USING gin (extracted_text gin_trgm_ops);
CREATE INDEX idx_docs_approved_at  ON documents (reviewed_at) WHERE status = 'approved';

-- Full-text search index
ALTER TABLE documents ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
  ) STORED;
CREATE INDEX idx_docs_fts ON documents USING gin (search_vector);

-- =============================================================
-- DUPLICATE DETECTION LOG
-- Every blocked or flagged upload attempt is logged here
-- =============================================================

CREATE TABLE duplicate_log (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempted_file_name   VARCHAR(255) NOT NULL,
  attempted_file_hash   CHAR(64),
  uploader_id           UUID NOT NULL REFERENCES users(id),
  matched_document_id   UUID REFERENCES documents(id),   -- which doc it matched
  detection_layer       dup_layer NOT NULL,
  similarity_score      NUMERIC(5,2),                    -- 0.00–100.00 (%)
  is_auto_rejected      BOOLEAN NOT NULL DEFAULT TRUE,   -- FALSE = flagged not rejected
  admin_reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  admin_override        BOOLEAN NOT NULL DEFAULT FALSE,  -- admin approved despite match
  admin_note            TEXT,
  reviewed_by           UUID REFERENCES users(id),
  reviewed_at           TIMESTAMPTZ,
  blocked_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_duplog_uploader   ON duplicate_log (uploader_id);
CREATE INDEX idx_duplog_matched    ON duplicate_log (matched_document_id);
CREATE INDEX idx_duplog_layer      ON duplicate_log (detection_layer);
CREATE INDEX idx_duplog_reviewed   ON duplicate_log (admin_reviewed);

-- =============================================================
-- SUBSCRIPTIONS
-- =============================================================

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan            sub_plan NOT NULL,
  status          sub_status NOT NULL DEFAULT 'active',
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  payment_id      UUID,                            -- FK set after insert (circular)
  is_upload_pass  BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = earned by uploading
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subs_user       ON subscriptions (user_id);
CREATE INDEX idx_subs_status     ON subscriptions (status);
CREATE INDEX idx_subs_expires    ON subscriptions (expires_at);

-- Helper: check if a user has an active subscription right now
CREATE OR REPLACE VIEW active_subscriptions AS
  SELECT * FROM subscriptions
  WHERE status = 'active'
    AND expires_at > NOW();

-- =============================================================
-- PAYMENTS
-- =============================================================

CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  amount_mwk        NUMERIC(12,2) NOT NULL,
  payment_method    payment_method NOT NULL,
  payment_type      payment_type NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pending',

  -- mobile money reference
  mobile_number     VARCHAR(20),                   -- number that paid
  gateway_ref       VARCHAR(200),                  -- Paychangu / Flutterwave reference
  gateway_response  JSONB,                         -- full raw gateway response

  -- what was purchased
  subscription_id   UUID REFERENCES subscriptions(id),
  document_id       UUID REFERENCES documents(id), -- for per-download purchases

  -- timestamps
  initiated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  failed_at         TIMESTAMPTZ,
  failure_reason    TEXT
);

-- Back-fill FK from subscriptions to payments
ALTER TABLE subscriptions
  ADD CONSTRAINT fk_sub_payment
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

CREATE INDEX idx_payments_user     ON payments (user_id);
CREATE INDEX idx_payments_status   ON payments (status);
CREATE INDEX idx_payments_type     ON payments (payment_type);
CREATE INDEX idx_payments_created  ON payments (initiated_at);
CREATE INDEX idx_payments_gateway  ON payments (gateway_ref);

-- =============================================================
-- DOWNLOADS
-- Every successful download is recorded here
-- =============================================================

CREATE TABLE downloads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  document_id     UUID NOT NULL REFERENCES documents(id),
  payment_id      UUID REFERENCES payments(id),    -- NULL if covered by subscription
  subscription_id UUID REFERENCES subscriptions(id),
  downloaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,                            -- for abuse detection
  signed_url_used TEXT                             -- the expiring URL that was used
);

CREATE INDEX idx_downloads_user   ON downloads (user_id);
CREATE INDEX idx_downloads_doc    ON downloads (document_id);
CREATE INDEX idx_downloads_date   ON downloads (downloaded_at);

-- =============================================================
-- DOCUMENT VIEWS (preview tracking — guests and users)
-- =============================================================

CREATE TABLE document_views (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES documents(id),
  user_id       UUID REFERENCES users(id),         -- NULL for guests
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    INET
);

CREATE INDEX idx_views_doc  ON document_views (document_id);
CREATE INDEX idx_views_date ON document_views (viewed_at);

-- =============================================================
-- ADMIN ACTIVITY LOG
-- Every admin action is logged for accountability
-- =============================================================

CREATE TABLE admin_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,   -- e.g. 'approve_document', 'reject_document', 'suspend_user'
  target_type   VARCHAR(50),             -- 'document', 'user', 'subscription', 'duplicate_log'
  target_id     UUID,
  note          TEXT,
  performed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adminlog_admin  ON admin_log (admin_id);
CREATE INDEX idx_adminlog_action ON admin_log (action);
CREATE INDEX idx_adminlog_date   ON admin_log (performed_at);

-- =============================================================
-- SYSTEM SETTINGS (key-value config — admin editable)
-- =============================================================

CREATE TABLE system_settings (
  key           VARCHAR(100) PRIMARY KEY,
  value         TEXT NOT NULL,
  description   TEXT,
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
  ('upload_pass_min_threshold',   '5',    'Minimum uploads needed to earn free 1-day pass'),
  ('upload_pass_max_threshold',   '10',   'Maximum uploads configurable for free pass'),
  ('upload_pass_duration_hours',  '24',   'How many hours the upload-earned pass lasts'),
  ('dup_auto_reject_threshold',   '90',   'Cosine similarity % above which upload is auto-rejected'),
  ('dup_flag_threshold',          '75',   'Cosine similarity % above which upload is flagged for review'),
  ('max_file_size_mb',            '20',   'Maximum upload file size in megabytes'),
  ('price_daily_mwk',             '300',  'Daily subscription price in MWK'),
  ('price_weekly_mwk',            '1000', 'Weekly subscription price in MWK'),
  ('price_monthly_mwk',           '2500', 'Monthly subscription price in MWK'),
  ('price_per_download_default',  '200',  'Default pay-per-download price in MWK'),
  ('allowed_file_types',          'pdf,docx,pptx', 'Comma-separated allowed upload types'),
  ('platform_name',               'MalawiEduHub',  'Platform display name'),
  ('maintenance_mode',            'false', 'Set to true to put site in maintenance mode');

-- =============================================================
-- REFRESH TOKENS (for JWT auth)
-- =============================================================

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,    -- SHA-256 of actual token
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tokens_user    ON refresh_tokens (user_id);
CREATE INDEX idx_tokens_hash    ON refresh_tokens (token_hash);
CREATE INDEX idx_tokens_expires ON refresh_tokens (expires_at);

-- =============================================================
-- TRIGGERS: auto-update updated_at timestamps
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_docs_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- TRIGGER: when a document is approved, increment uploader's
--          approved_upload_count and award upload pass if threshold met
-- =============================================================

CREATE OR REPLACE FUNCTION handle_document_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_threshold   INTEGER;
  v_pass_hours  INTEGER;
  v_user_count  INTEGER;
BEGIN
  -- Only fire when status changes TO 'approved'
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN

    -- Mark document as counting toward pass
    NEW.counts_toward_pass := TRUE;

    -- Get threshold from settings
    SELECT value::INTEGER INTO v_threshold
      FROM system_settings WHERE key = 'upload_pass_min_threshold';

    SELECT value::INTEGER INTO v_pass_hours
      FROM system_settings WHERE key = 'upload_pass_duration_hours';

    -- Increment uploader count
    UPDATE users
      SET approved_upload_count = approved_upload_count + 1
      WHERE id = NEW.uploader_id
      RETURNING approved_upload_count INTO v_user_count;

    -- Award upload pass if threshold reached (and not already active)
    IF v_user_count >= v_threshold THEN
      IF NOT EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = NEW.uploader_id
          AND is_upload_pass = TRUE
          AND status = 'active'
          AND expires_at > NOW()
      ) THEN
        INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at, is_upload_pass)
        VALUES (
          NEW.uploader_id,
          'upload_pass',
          'active',
          NOW(),
          NOW() + (v_pass_hours || ' hours')::INTERVAL,
          TRUE
        );

        -- Reset counter for next pass cycle
        UPDATE users
          SET approved_upload_count = 0,
              upload_pass_earned_at = NOW()
          WHERE id = NEW.uploader_id;
      END IF;
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_approved
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION handle_document_approved();

-- =============================================================
-- TRIGGER: update document download_count on each download
-- =============================================================

CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documents
    SET download_count = download_count + 1
    WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_downloads
  AFTER INSERT ON downloads
  FOR EACH ROW EXECUTE FUNCTION increment_download_count();

-- =============================================================
-- TRIGGER: update document view_count on each view
-- =============================================================

CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documents
    SET view_count = view_count + 1
    WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_views
  AFTER INSERT ON document_views
  FOR EACH ROW EXECUTE FUNCTION increment_view_count();

-- =============================================================
-- USEFUL VIEWS FOR THE BACKEND & ADMIN PANEL
-- =============================================================

-- Full document details with subject name and uploader info
CREATE VIEW v_documents_full AS
  SELECT
    d.*,
    s.name         AS subject_name,
    s.slug         AS subject_slug,
    s.icon_emoji   AS subject_icon,
    u.full_name    AS uploader_name,
    u.email        AS uploader_email,
    u.school       AS uploader_school
  FROM documents d
  JOIN subjects s ON d.subject_id = s.id
  JOIN users u    ON d.uploader_id = u.id;

-- Admin review queue — pending and flagged documents
CREATE VIEW v_admin_review_queue AS
  SELECT
    d.id, d.title, d.level, d.doc_type, d.year,
    d.file_name_original, d.file_size_bytes, d.status,
    d.created_at AS uploaded_at,
    s.name AS subject_name,
    u.full_name AS uploader_name,
    u.email AS uploader_email
  FROM documents d
  JOIN subjects s ON d.subject_id = s.id
  JOIN users u    ON d.uploader_id = u.id
  WHERE d.status IN ('pending', 'flagged')
  ORDER BY d.created_at ASC;

-- Revenue summary by day
CREATE VIEW v_daily_revenue AS
  SELECT
    DATE(completed_at)  AS day,
    payment_type,
    COUNT(*)            AS transactions,
    SUM(amount_mwk)     AS total_mwk
  FROM payments
  WHERE status = 'completed'
  GROUP BY DATE(completed_at), payment_type
  ORDER BY day DESC;

-- Top downloaded documents
CREATE VIEW v_top_documents AS
  SELECT
    d.id, d.title, d.level, d.doc_type,
    s.name AS subject_name,
    d.download_count,
    d.view_count,
    d.price_mwk
  FROM documents d
  JOIN subjects s ON d.subject_id = s.id
  WHERE d.status = 'approved'
  ORDER BY d.download_count DESC;

-- Duplicate log with full details
CREATE VIEW v_duplicate_log_full AS
  SELECT
    dl.*,
    u.full_name       AS uploader_name,
    u.email           AS uploader_email,
    md.title          AS matched_doc_title,
    md.level          AS matched_doc_level
  FROM duplicate_log dl
  JOIN users u        ON dl.uploader_id = u.id
  LEFT JOIN documents md ON dl.matched_document_id = md.id
  ORDER BY dl.blocked_at DESC;

-- =============================================================
-- SEED: default admin user
-- Login: admin@malawieduhub.mw  OR  +265999000001
-- Password: Admin@1234  (bcrypt via bcryptjs, cost 12 — CHANGE IN PRODUCTION)
-- =============================================================

INSERT INTO users (
  full_name, email, phone, password_hash, role,
  email_verified, phone_verified
) VALUES (
  'MalawiEduHub Admin',
  'admin@malawieduhub.mw',
  '+265999000001',
  '$2a$12$K2PbuTCwu5qTERMb9AZdy.LsLPFGatfN/jwaOM11WGj7HfTNvgBUG',
  'admin',
  TRUE,
  TRUE
);

-- =============================================================
-- END OF SCHEMA
-- Tables:   users, subjects, documents, duplicate_log,
--           subscriptions, payments, downloads,
--           document_views, admin_log, system_settings,
--           refresh_tokens
-- Views:    active_subscriptions, v_documents_full,
--           v_admin_review_queue, v_daily_revenue,
--           v_top_documents, v_duplicate_log_full
-- Triggers: updated_at (users, documents),
--           handle_document_approved (auto upload pass),
--           increment_download_count,
--           increment_view_count
-- =============================================================

/**
 * Initialize missing database tables and columns
 * Runs on server startup
 */

const { query } = require('./db');

const initTables = async () => {
  try {
    console.log('🔧 Checking database tables...');

    // Users columns
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`);
      console.log('✅ users.failed_login_attempts column ready');
    } catch {}

    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`);
      console.log('✅ users.locked_until column ready');
    } catch {}

    // Refresh tokens columns
    try {
      await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_name VARCHAR(100)`);
      console.log('✅ refresh_tokens.device_name column ready');
    } catch {}

    try {
      await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address INET`);
      console.log('✅ refresh_tokens.ip_address column ready');
    } catch {}

    try {
      await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT`);
      console.log('✅ refresh_tokens.user_agent column ready');
    } catch {}

    // Document requests table
    const requestsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_requests'
      );
    `);

    if (!requestsTableCheck.rows[0].exists) {
      console.log('📦 Creating document_requests table...');
      
      await query(`
        CREATE TABLE document_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id),
          subject_id INTEGER REFERENCES subjects(id),
          title VARCHAR(300) NOT NULL,
          description TEXT,
          level VARCHAR(20),
          year SMALLINT,
          status VARCHAR(20) DEFAULT 'pending',
          fulfilled_doc_id UUID REFERENCES documents(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_requests_user ON document_requests (user_id)`);
      await query(`CREATE INDEX idx_requests_status ON document_requests (status)`);

      console.log('✅ document_requests table created successfully');
    } else {
      console.log('✅ document_requests table already exists');
    }

    // Password reset tokens
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📦 Creating password_reset_tokens table...');
      
      await query(`
        CREATE TABLE password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_reset_tokens_user ON password_reset_tokens (user_id)`);
      await query(`CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens (token_hash)`);
      await query(`CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens (expires_at)`);

      console.log('✅ password_reset_tokens table created successfully');
    } else {
      console.log('✅ password_reset_tokens table already exists');
    }

    // Classes table with slug
    const classesTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'classes'
      );
    `);

    if (!classesTableCheck.rows[0].exists) {
      console.log('📦 Creating classes table...');
      
      await query(`
        CREATE TABLE classes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          slug VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        INSERT INTO classes (name, slug, sort_order) VALUES
        ('Form 1', 'form-1', 1),
        ('Form 2', 'form-2', 2),
        ('Form 3', 'form-3', 3),
        ('Form 4', 'form-4', 4)
      `);

      console.log('✅ classes table created successfully');
    } else {
      console.log('✅ classes table already exists');
      try { await query(`ALTER TABLE classes ADD COLUMN IF NOT EXISTS slug VARCHAR(50)`); } catch {}
    }

    // Class subjects table
    const classSubjectsCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'class_subjects'
      );
    `);

    if (!classSubjectsCheck.rows[0].exists) {
      console.log('📦 Creating class_subjects table...');
      
      await query(`
        CREATE TABLE class_subjects (
          id SERIAL PRIMARY KEY,
          class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          UNIQUE (class_id, subject_id)
        );
      `);

      await query(`
        INSERT INTO class_subjects (class_id, subject_id, sort_order)
        SELECT c.id, s.id, s.sort_order
        FROM classes c, subjects s
        WHERE s.is_active = TRUE
        ON CONFLICT DO NOTHING
      `);

      console.log('✅ class_subjects table created successfully');
    } else {
      console.log('✅ class_subjects table already exists');
    }

    // Topics table
    const topicsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'topics'
      );
    `);

    if (!topicsTableCheck.rows[0].exists) {
      console.log('📦 Creating topics table...');
      
      await query(`
        CREATE TABLE topics (
          id SERIAL PRIMARY KEY,
          class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_topics_class_subject ON topics (class_id, subject_id)`);

      // Seed minimal topics
      await query(`
        INSERT INTO topics (class_id, subject_id, title, description, sort_order) VALUES
        (2, 2, 'Cell Structure and Function', 'Understanding the cell', 1),
        (2, 2, 'Nutrition in Plants', 'How plants make food', 2),
        (2, 2, 'Nutrition in Animals', 'Digestive system', 3),
        (2, 2, 'Transport in Plants', 'Xylem and phloem', 4),
        (2, 2, 'Transport in Animals', 'Circulatory system', 5),
        (2, 2, 'Respiration', 'Gas exchange', 6)
      `);

      console.log('✅ topics table created successfully');
    } else {
      console.log('✅ topics table already exists');
      try { await query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS title VARCHAR(200)`); } catch {}
      try { await query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`); } catch {}
    }

    // Topic resources table
    const topicResourcesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'topic_resources'
      );
    `);

    if (!topicResourcesCheck.rows[0].exists) {
      console.log('📦 Creating topic_resources table...');
      
      await query(`
        CREATE TABLE topic_resources (
          id SERIAL PRIMARY KEY,
          topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          added_by UUID REFERENCES users(id),
          added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (topic_id, document_id)
        );
      `);

      await query(`CREATE INDEX idx_topic_resources_topic ON topic_resources (topic_id)`);
      await query(`CREATE INDEX idx_topic_resources_doc ON topic_resources (document_id)`);

      console.log('✅ topic_resources table created successfully');
    } else {
      console.log('✅ topic_resources table already exists');
    }

    // Student progress table
    const progressCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_progress'
      );
    `);

    if (!progressCheck.rows[0].exists) {
      console.log('📦 Creating student_progress table...');
      
      await query(`
        CREATE TABLE student_progress (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          completed_at TIMESTAMPTZ,
          last_visited TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (user_id, topic_id)
        );
      `);

      await query(`CREATE INDEX idx_progress_user ON student_progress (user_id)`);
      await query(`CREATE INDEX idx_progress_topic ON student_progress (topic_id)`);

      console.log('✅ student_progress table created successfully');
    } else {
      console.log('✅ student_progress table already exists');
    }

    console.log('✅ Database tables check complete\n');
  } catch (err) {
    console.error('❌ Failed to initialize tables:', err.message);
  }
};

module.exports = { initTables };

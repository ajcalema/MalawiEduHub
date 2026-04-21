/**
 * Initialize missing database tables and columns
 * Runs on server startup
 */

const { query } = require('./db');

const initTables = async () => {
  try {
    console.log('🔧 Checking database tables...');

    // --- FIXED: Create users columns ---
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`);
      console.log('✅ users.failed_login_attempts column ready');
    } catch {}

    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`);
      console.log('✅ users.locked_until column ready');
    } catch {}

    // --- FIXED: Create refresh_tokens columns ---
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

    // --- FIXED: Create document_requests table ---
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

    // --- FIXED: Check password_reset_tokens ---
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
          id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash  TEXT NOT NULL UNIQUE,
          expires_at  TIMESTAMPTZ NOT NULL,
          used        BOOLEAN NOT NULL DEFAULT FALSE,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_reset_tokens_user ON password_reset_tokens (user_id)`);
      await query(`CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens (token_hash)`);
      await query(`CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens (expires_at)`);

      console.log('✅ password_reset_tokens table created successfully');
    } else {
      console.log('✅ password_reset_tokens table already exists');
    }

    console.log('✅ Database tables check complete\n');
  } catch (err) {
    console.error('❌ Failed to initialize tables:', err.message);
  }
};

module.exports = { initTables };

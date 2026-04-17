/**
 * Initialize missing database tables
 * Runs on server startup
 */

const { query } = require('./db');

const initTables = async () => {
  try {
    console.log('🔧 Checking database tables...');

    // Check if password_reset_tokens table exists
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

      await query(`
        CREATE INDEX idx_reset_tokens_user ON password_reset_tokens (user_id);
      `);
      
      await query(`
        CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens (token_hash);
      `);
      
      await query(`
        CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens (expires_at);
      `);

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

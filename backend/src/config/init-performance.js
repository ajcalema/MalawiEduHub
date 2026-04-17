/**
 * Performance optimizations - Add database indexes
 */

const { query } = require('./db');

const initPerformanceIndexes = async () => {
  try {
    console.log('🔧 Checking performance indexes...');

    // Check if indexes exist and create them if not
    const indexes = [
      {
        name: 'idx_documents_status_reviewed',
        sql: `CREATE INDEX IF NOT EXISTS idx_documents_status_reviewed 
              ON documents(status, reviewed_at DESC) 
              WHERE status = 'approved'`
      },
      {
        name: 'idx_documents_download_count',
        sql: `CREATE INDEX IF NOT EXISTS idx_documents_download_count 
              ON documents(download_count DESC)`
      },
      {
        name: 'idx_documents_subject_level',
        sql: `CREATE INDEX IF NOT EXISTS idx_documents_subject_level 
              ON documents(subject_id, level, doc_type, year)`
      },
      {
        name: 'idx_documents_search',
        sql: `CREATE INDEX IF NOT EXISTS idx_documents_search 
              ON documents USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')))`
      }
    ];

    for (const { name, sql } of indexes) {
      try {
        await query(sql);
        console.log(`✅ Index ${name} created or already exists`);
      } catch (err) {
        console.error(`❌ Failed to create index ${name}:`, err.message);
      }
    }

    console.log('✅ Performance indexes check complete\n');
  } catch (err) {
    console.error('❌ Failed to initialize performance indexes:', err.message);
  }
};

module.exports = { initPerformanceIndexes };

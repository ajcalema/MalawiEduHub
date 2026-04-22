/**
 * MalawiEduHub — Learning Room Database Migration Script
 * 
 * This script applies the Learning Room schema to your database.
 * Safe to run multiple times (uses IF NOT EXISTS and CREATE OR REPLACE).
 * 
 * Usage:
 *   node scripts/migrate-learning-room.js
 * 
 * Requirements:
 *   - DATABASE_URL environment variable must be set
 *   - pg package installed (already in backend dependencies)
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Database connection from environment variable
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.error('Please set it in your .env file or environment variables')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render/Heroku PostgreSQL
  }
})

async function runMigration() {
  console.log('🚀 Starting Learning Room database migration...\n')
  
  const client = await pool.connect()
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema_learning.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📄 Reading schema from:', schemaPath)
    console.log('📝 Executing SQL migration...\n')
    
    // Execute the entire schema file
    await client.query(schemaSQL)
    
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Verifying tables and views were created...\n')
    
    // Verify tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('classes', 'class_subjects', 'topics', 'topic_resources', 'student_progress')
      ORDER BY table_name
    `)
    
    console.log('Tables created:')
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })
    
    // Verify views exist
    const views = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('v_topics_full', 'v_class_subjects')
      ORDER BY table_name
    `)
    
    console.log('\nViews created:')
    views.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })
    
    // Count classes
    const classCount = await client.query('SELECT COUNT(*) FROM classes')
    console.log(`\n📚 Classes in database: ${classCount.rows[0].count}`)
    
    // Count topics
    const topicCount = await client.query('SELECT COUNT(*) FROM topics')
    console.log(`📝 Topics in database: ${topicCount.rows[0].count}`)
    
    console.log('\n✨ Learning Room migration completed successfully!')
    console.log('🎉 You can now use the Learning Room feature.\n')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('Error details:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the migration
runMigration()

/**
 * MalawiEduHub — Initialize Learning Room Schema
 * Runs on backend startup to ensure Learning Room tables/views exist
 * Safe to run multiple times (idempotent)
 */

const fs = require('fs')
const path = require('path')
const { query } = require('./db')

async function initLearningRoom() {
  try {
    console.log('\n📚 Initializing Learning Room schema...')
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema_learning.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.log('⚠️  Learning Room schema file not found, skipping...')
      return
    }
    
    let schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    // Remove the INSERT statements for classes since they might already exist with different structure
    // We'll update existing classes instead
    schemaSQL = schemaSQL.replace(
      /-- Insert classes[\s\S]*?ON CONFLICT \(slug\) DO UPDATE SET[\s\S]*?level_type = EXCLUDED\.level_type;/,
      `-- Update existing classes with Learning Room fields
       UPDATE classes SET slug = LOWER(REPLACE(name, ' ', '-')), display_name = name, level_type = CASE 
         WHEN name IN ('Form 1', 'Form 2') THEN 'jce'
         WHEN name IN ('Form 3', 'Form 4') THEN 'msce'
         ELSE 'other'
       END
       WHERE slug IS NULL OR display_name IS NULL OR level_type IS NULL;`
    )
    
    // Execute the schema
    await query(schemaSQL)
    
    console.log('✅ Learning Room schema initialized successfully')
  } catch (err) {
    // Don't fail startup if Learning Room init fails
    console.log('⚠️  Learning Room init warning:', err.message)
    console.log('   The Learning Room feature may not work until the database schema is updated.')
  }
}

module.exports = { initLearningRoom }

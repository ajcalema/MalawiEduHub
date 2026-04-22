/**
 * Initialize missing database tables and columns
 * Also runs schema_learning.sql for learning room features
 */

const { query, pool } = require('./db')
const fs = require('fs')
const path = require('path')

const initTables = async () => {
  try {
    console.log('🔧 Checking database tables...')

    // Run schema_learning.sql to create learning tables and seed data
    const schemaCandidates = [
      path.join(__dirname, '../../database/schema_learning.sql'),
      path.join(__dirname, '../../../database/schema_learning.sql'),
    ]
    const schemaPath = schemaCandidates.find(p => fs.existsSync(p))
    
    if (schemaPath) {
      console.log('📄 Running schema_learning.sql...')
      const sql = fs.readFileSync(schemaPath, 'utf8')
      
      try {
        await pool.query(sql)
        console.log('✅ Schema SQL executed successfully')
      } catch (err) {
        console.error('❌ Schema SQL execution failed:', err.message)
        console.error('Error detail:', err.detail)
        console.error('Error position:', err.position)
        throw err
      }
      
      // Update existing classes with missing fields (after schema is applied)
      await pool.query(`
        UPDATE classes SET 
          slug = LOWER(REPLACE(name, ' ', '-')),
          display_name = COALESCE(display_name, name),
          level_type = COALESCE(level_type, CASE 
            WHEN name IN ('Form 1', 'Form 2') THEN 'jce'
            WHEN name IN ('Form 3', 'Form 4') THEN 'msce'
            ELSE 'other'
          END)
        WHERE slug IS NULL OR display_name IS NULL OR level_type IS NULL;
      `)
      
      console.log('✅ Learning schema applied successfully')
    } else {
      console.log('⚠️ schema_learning.sql not found, using fallback')
      
      // Fallback: Create tables with code
      await createLearningTables()
    }

    console.log('✅ Database tables check complete\n')
  } catch (err) {
    console.error('❌ Failed to initialize tables:', err.message)
  }
}

async function createLearningTables() {
  try {
    // Classes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        slug VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    
    // Insert classes
    await pool.query(`
      INSERT INTO classes (name, slug, sort_order) VALUES
        ('Form 1', 'form-1', 1),
        ('Form 2', 'form-2', 2),
        ('Form 3', 'form-3', 3),
        ('Form 4', 'form-4', 4)
      ON CONFLICT (slug) DO NOTHING
    `)
    console.log('✅ Classes created and seeded')

    // Class subjects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_subjects (
        id SERIAL PRIMARY KEY,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        UNIQUE (class_id, subject_id)
      )
    `)

    // Link subjects to classes
    await pool.query(`
      INSERT INTO class_subjects (class_id, subject_id, sort_order)
      SELECT c.id, s.id, s.sort_order
      FROM classes c, subjects s
      WHERE s.is_active = TRUE
      ON CONFLICT DO NOTHING
    `)
    console.log('✅ Class subjects linked')

    // Topics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS topics (
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
      )
    `)

    // Seed Biology topics for Form 2
    await pool.query(`
      INSERT INTO topics (class_id, subject_id, title, sort_order)
      SELECT c.id, s.id, title, sort_order
      FROM classes c, (
        VALUES 
          (2, 'Biology', 1, 'Cell Structure and Function'),
          (2, 'Biology', 2, 'Nutrition in Plants'),
          (2, 'Biology', 3, 'Nutrition in Animals'),
          (2, 'Biology', 4, 'Transport in Plants'),
          (2, 'Biology', 5, 'Transport in Animals'),
          (2, 'Biology', 6, 'Respiration')
      ) AS t(cls_slug, subj_slug, sort_order, title)
      JOIN classes c ON c.slug = t.cls_slug
      JOIN subjects s ON s.slug = t.subj_slug
      ON CONFLICT DO NOTHING
    `).catch(() => {
      // If above fails, try simpler insert
      return pool.query(`
        INSERT INTO topics (class_id, subject_id, title, description, sort_order) VALUES
        (2, 2, 'Cell Structure and Function', 'Understanding the cell', 1),
        (2, 2, 'Nutrition in Plants', 'How plants make food', 2),
        (2, 2, 'Nutrition in Animals', 'Digestive system', 3),
        (2, 2, 'Transport in Plants', 'Xylem and phloem', 4),
        (2, 2, 'Transport in Animals', 'Circulatory system', 5),
        (2, 2, 'Respiration', 'Gas exchange', 6)
        ON CONFLICT DO NOTHING
      `)
    })
    console.log('✅ Topics created')

    // Topic resources table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS topic_resources (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        added_by UUID REFERENCES users(id),
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (topic_id, document_id)
      )
    `)

    // Student progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_progress (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        last_visited TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, topic_id)
      )
    `)

    // Create views
    await pool.query(`
      CREATE OR REPLACE VIEW v_topics_full AS
      SELECT t.*,
        c.name AS class_name, c.slug AS class_slug,
        s.name AS subject_name, s.slug AS subject_slug, s.icon_emoji AS subject_icon,
        u.full_name AS created_by_name,
        (SELECT COUNT(*) FROM topic_resources tr WHERE tr.topic_id = t.id) AS resource_count
      FROM topics t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.created_by = u.id
    `)

    await pool.query(`
      CREATE OR REPLACE VIEW v_class_subjects AS
      SELECT cs.class_id, cs.subject_id, cs.sort_order, cs.is_active,
        c.name AS class_name, c.slug AS class_slug,
        s.name AS subject_name, s.slug AS subject_slug, s.icon_emoji,
        (SELECT COUNT(*) FROM topics t
         WHERE t.class_id = cs.class_id AND t.subject_id = cs.subject_id
           AND t.is_active = TRUE) AS topic_count
      FROM class_subjects cs
      JOIN classes c ON cs.class_id = c.id
      JOIN subjects s ON cs.subject_id = s.id
    `)
    console.log('✅ Views created')

  } catch (err) {
    console.error('❌ Error creating tables:', err.message)
  }
}

module.exports = { initTables }

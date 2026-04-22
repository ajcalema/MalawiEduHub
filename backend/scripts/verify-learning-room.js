const { Pool } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function verify() {
  try {
    console.log('🔍 Checking Learning Room tables...\n')
    
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('classes', 'class_subjects', 'topics', 'topic_resources', 'student_progress')
      ORDER BY table_name
    `)
    
    console.log('✅ Tables found:')
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`))
    
    const views = await pool.query(`
      SELECT table_name FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('v_topics_full', 'v_class_subjects')
      ORDER BY table_name
    `)
    
    console.log('\n✅ Views found:')
    views.rows.forEach(row => console.log(`   - ${row.table_name}`))
    
    const classCount = await pool.query('SELECT COUNT(*) FROM classes')
    console.log(`\n📚 Classes: ${classCount.rows[0].count}`)
    
    const topicCount = await pool.query('SELECT COUNT(*) FROM topics')
    console.log(`📝 Topics: ${topicCount.rows[0].count}`)
    
    console.log('\n✨ Learning Room is ready!\n')
    
    await pool.end()
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

verify()

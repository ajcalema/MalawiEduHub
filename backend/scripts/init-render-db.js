#!/usr/bin/env node
/**
 * Render Database Initialization Script
 * Run this locally to set up your Render PostgreSQL database
 * 
 * Usage: node scripts/init-render-db.js <RENDER_DATABASE_URL>
 * 
 * Get your DATABASE_URL from Render Dashboard:
 * 1. Go to render.com → your Database → "Connections" tab
 * 2. Copy "External Database URL"
 * 3. Run: node scripts/init-render-db.js postgres://user:pass@host:port/dbname
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATABASE_URL = process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ Error: Please provide your Render DATABASE_URL');
  console.error('');
  console.error('Usage: node scripts/init-render-db.js <DATABASE_URL>');
  console.error('');
  console.error('Get your DATABASE_URL from:');
  console.error('  1. Go to render.com → your Database');
  console.error('  2. Click "Connections" tab');
  console.error('  3. Copy "External Database URL"');
  console.error('');
  process.exit(1);
}

async function initDatabase() {
  console.log('🔌 Connecting to Render database...\n');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Render
    }
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database successfully!\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Loading schema file...');
    console.log(`   File: ${schemaPath}`);
    console.log(`   Size: ${(schema.length / 1024).toFixed(2)} KB\n`);

    // Execute schema
    console.log('🏗️  Creating database tables...\n');
    await pool.query(schema);
    console.log('✅ Schema created successfully!\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminResult = await pool.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role, status, email_verified, phone_verified)
      VALUES (
        'System Admin',
        'admin@malawieduhub.com',
        '+265999000000',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G',
        'admin',
        'active',
        true,
        true
      )
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role;
    `);
    
    if (adminResult.rows.length > 0) {
      console.log('✅ Admin user created!');
      console.log(`   Email: admin@malawieduhub.com`);
      console.log(`   Password: admin123`);
      console.log(`   Role: admin\n`);
    } else {
      console.log('ℹ️  Admin user already exists\n');
    }

    // Insert default settings
    console.log('⚙️  Inserting default settings...');
    await pool.query(`
      INSERT INTO system_settings (key, value, description) VALUES
        ('upload_pass_min_threshold', '5', 'Minimum uploads for free pass'),
        ('upload_pass_duration_hours', '24', 'Duration of upload pass'),
        ('dup_auto_reject_threshold', '90', 'Auto-reject similarity %'),
        ('dup_flag_threshold', '75', 'Flag for review similarity %'),
        ('price_daily_mwk', '500', 'Daily plan price'),
        ('price_weekly_mwk', '2000', 'Weekly plan price'),
        ('price_monthly_mwk', '5000', 'Monthly plan price'),
        ('price_per_download_default', '200', 'Default download price'),
        ('max_file_size_mb', '20', 'Max upload size in MB'),
        ('maintenance_mode', 'false', 'Maintenance mode flag')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('✅ Default settings inserted!\n');

    // Insert sample subjects
    console.log('📚 Inserting sample subjects...');
    await pool.query(`
      INSERT INTO subjects (name, code, icon_emoji, sort_order) VALUES
        ('Mathematics', 'MATH', '📐', 1),
        ('English', 'ENG', '📖', 2),
        ('Biology', 'BIO', '🧬', 3),
        ('Chemistry', 'CHEM', '⚗️', 4),
        ('Physics', 'PHY', '⚛️', 5),
        ('History', 'HIST', '📜', 6),
        ('Geography', 'GEO', '🌍', 7),
        ('Computer Studies', 'COMP', '💻', 8)
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✅ Sample subjects inserted!\n');

    console.log('🎉 Database initialization complete!');
    console.log('');
    console.log('You can now:');
    console.log('  • Register new accounts');
    console.log('  • Login as admin: admin@malawieduhub.com / admin123');
    console.log('  • Upload and browse documents');
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('\n💡 Tip: Make sure you copied the full External Database URL correctly');
    }
    if (err.message.includes('does not exist')) {
      console.error('\n💡 Tip: The database might still be provisioning. Wait 2-3 minutes and try again');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();

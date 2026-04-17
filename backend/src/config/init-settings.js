/**
 * Initialize default system settings
 */

const { query } = require('./db');

const initSettings = async () => {
  try {
    console.log('🔧 Checking system settings...');

    // Check if system_settings table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📦 Creating system_settings table...');
      
      await query(`
        CREATE TABLE system_settings (
          id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          key         TEXT NOT NULL UNIQUE,
          value       TEXT NOT NULL,
          description TEXT,
          updated_by  UUID REFERENCES users(id),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      console.log('✅ system_settings table created');
    }

    // Default settings
    const defaultSettings = [
      {
        key: 'footer_year',
        value: new Date().getFullYear().toString(),
        description: 'Copyright year shown in footer'
      },
      {
        key: 'site_name',
        value: 'MalawiEduHub',
        description: 'Website name'
      },
      {
        key: 'contact_email',
        value: 'support@malawieduhub.com',
        description: 'Contact email address'
      }
    ];

    // Insert default settings if they don't exist
    for (const setting of defaultSettings) {
      const exists = await query(
        'SELECT 1 FROM system_settings WHERE key = $1',
        [setting.key]
      );
      
      if (exists.rows.length === 0) {
        await query(
          `INSERT INTO system_settings (key, value, description) VALUES ($1, $2, $3)`,
          [setting.key, setting.value, setting.description]
        );
        console.log(`✅ Added setting: ${setting.key}`);
      }
    }

    console.log('✅ System settings check complete\n');
  } catch (err) {
    console.error('❌ Failed to initialize settings:', err.message);
  }
};

module.exports = { initSettings };

/**
 * Cleanup script to remove duplicate price settings
 * Removes: price_daily, price_weekly, price_monthly
 * Keeps: price_daily_mwk, price_weekly_mwk, price_monthly_mwk
 */

const { query } = require('../src/config/db');

const cleanupPriceSettings = async () => {
  try {
    console.log('🧹 Cleaning up duplicate price settings...\n');

    // Check what price settings exist
    const result = await query(
      `SELECT key, value, description FROM system_settings WHERE key LIKE 'price_%' ORDER BY key`
    );

    console.log('Current price settings:');
    result.rows.forEach(row => {
      console.log(`  - ${row.key}: ${row.value}`);
    });

    // Delete the duplicate settings (without _mwk suffix)
    const duplicates = ['price_daily', 'price_weekly', 'price_monthly'];
    
    for (const key of duplicates) {
      const exists = await query(
        'SELECT 1 FROM system_settings WHERE key = $1',
        [key]
      );
      
      if (exists.rows.length > 0) {
        await query('DELETE FROM system_settings WHERE key = $1', [key]);
        console.log(`\n✅ Deleted duplicate: ${key}`);
      }
    }

    // Show remaining settings
    const remaining = await query(
      `SELECT key, value FROM system_settings WHERE key LIKE 'price_%' ORDER BY key`
    );
    
    console.log('\n✅ Cleanup complete! Remaining price settings:');
    remaining.rows.forEach(row => {
      console.log(`  - ${row.key}: ${row.value}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
};

cleanupPriceSettings();

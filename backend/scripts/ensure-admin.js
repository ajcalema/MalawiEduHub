/**
 * Sets a known password on the seeded admin user (local dev).
 * Run from backend folder: npm run ensure-admin
 *
 * Requires: PostgreSQL running, .env with DB_* vars, admin row with email admin@malawieduhub.mw
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@malawieduhub.mw';
const PLAIN_PASSWORD = 'Admin@1234';

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const hash = await bcrypt.hash(PLAIN_PASSWORD, 12);

  const r = await pool.query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE LOWER(TRIM(email)) = LOWER(TRIM($2))
     RETURNING email, role`,
    [hash, ADMIN_EMAIL]
  );

  if (r.rowCount === 0) {
    console.error('\n✖ No user with email:', ADMIN_EMAIL);
    console.error('  Import database/schema.sql (including the admin INSERT) or create that user first.\n');
    process.exitCode = 1;
    await pool.end();
    return;
  }

  console.log('\n✓ Admin password updated.');
  console.log('  Email:   ', r.rows[0].email);
  console.log('  Role:    ', r.rows[0].role);
  console.log('  Password:', PLAIN_PASSWORD);
  console.log('\n  Sign in at /auth/login with the email above (any letter case is fine).\n');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

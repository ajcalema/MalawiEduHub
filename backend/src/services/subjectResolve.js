/**
 * Resolve a free-text subject name to subjects.id (find existing or insert new).
 */

function slugify(name) {
  const s = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'subject';
}

/**
 * @param {import('pg').PoolClient} client
 * @param {string} rawName
 * @returns {Promise<{ subjectId?: number, error?: string }>}
 */
async function resolveOrCreateSubjectId(client, rawName) {
  const name = String(rawName || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2) {
    return { error: 'Subject name must be at least 2 characters.' };
  }
  if (name.length > 100) {
    return { error: 'Subject name is too long (max 100 characters).' };
  }

  const slug = slugify(name);

  const byName = await client.query(
    `SELECT id FROM subjects
     WHERE LOWER(TRIM(name)) = LOWER($1)
     LIMIT 1`,
    [name]
  );
  if (byName.rows[0]) return { subjectId: byName.rows[0].id };

  const bySlug = await client.query(
    `SELECT id FROM subjects WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  if (bySlug.rows[0]) return { subjectId: bySlug.rows[0].id };

  try {
    const ins = await client.query(
      `INSERT INTO subjects (name, slug, icon_emoji, sort_order)
       VALUES ($1, $2, '📚', 1000)
       RETURNING id`,
      [name, slug]
    );
    return { subjectId: ins.rows[0].id };
  } catch (err) {
    if (err.code === '23505') {
      const again = await client.query(
        `SELECT id FROM subjects
         WHERE LOWER(TRIM(name)) = LOWER($1) OR slug = $2
         LIMIT 1`,
        [name, slug]
      );
      if (again.rows[0]) return { subjectId: again.rows[0].id };
    }
    throw err;
  }
}

module.exports = { resolveOrCreateSubjectId, slugify };

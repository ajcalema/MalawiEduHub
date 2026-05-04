const { query } = require('../config/db');

const recordUserActivity = async (dbOrPayload, maybePayload) => {
  const hasCustomDb = typeof dbOrPayload?.query === 'function';
  const db = hasCustomDb ? dbOrPayload : { query };
  const payload = hasCustomDb ? maybePayload : dbOrPayload;

  const {
    userId,
    type,
    referenceId,
    description,
  } = payload;

  if (!userId || !type || !referenceId || !description) {
    throw new Error('userId, type, referenceId, and description are required to record activity.');
  }

  await db.query(
    `INSERT INTO user_activity (user_id, type, reference_id, description)
     VALUES ($1, $2, $3, $4)`,
    [userId, type, String(referenceId), description]
  );
};

module.exports = {
  recordUserActivity,
};

const {
  getOverview,
  getSubjectsProgress,
  getRecentActivity,
  getQuizPerformance,
} = require('../services/progressService');

const overview = async (req, res) => {
  try {
    const data = await getOverview(req.user.id);
    res.json(data);
  } catch (err) {
    console.error('progress overview error:', err);
    res.status(500).json({ error: 'Failed to fetch progress overview.' });
  }
};

const subjects = async (req, res) => {
  try {
    const data = await getSubjectsProgress(req.user.id);
    res.json(data);
  } catch (err) {
    console.error('progress subjects error:', err);
    res.status(500).json({ error: 'Failed to fetch subject progress.' });
  }
};

const activity = async (req, res) => {
  try {
    const data = await getRecentActivity(req.user.id, 10);
    res.json(data);
  } catch (err) {
    console.error('progress activity error:', err);
    res.status(500).json({ error: 'Failed to fetch recent activity.' });
  }
};

const quizzes = async (req, res) => {
  try {
    const data = await getQuizPerformance(req.user.id, 10);
    res.json(data);
  } catch (err) {
    console.error('progress quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz performance.' });
  }
};

module.exports = {
  overview,
  subjects,
  activity,
  quizzes,
};

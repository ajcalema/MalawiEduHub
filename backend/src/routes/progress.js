const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  overview,
  subjects,
  activity,
  quizzes,
} = require('../controllers/progressController');

router.get('/overview', requireAuth, overview);
router.get('/subjects', requireAuth, subjects);
router.get('/activity', requireAuth, activity);
router.get('/quizzes', requireAuth, quizzes);

module.exports = router;

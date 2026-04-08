const express = require('express');
const router  = express.Router();
const { register, login, refresh, logout, getProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { body } = require('express-validator');

const validateRegister = [
  body('full_name').trim().notEmpty().withMessage('Full name required.'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

router.post('/register', validateRegister, register);
router.post('/login',    login);
router.post('/refresh',  refresh);
router.post('/logout',   logout);
router.get('/profile',   requireAuth, getProfile);

module.exports = router;

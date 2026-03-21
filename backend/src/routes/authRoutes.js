const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// WeChat Mini-App auth
router.post('/wechat', authController.wechatLogin.bind(authController));

// PWA auth (email/password)
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));

// Common auth endpoints
router.get('/profile', auth, authController.getProfile.bind(authController));
router.put('/profile', auth, authController.updateProfile.bind(authController));
router.get('/teams', authController.getTeams.bind(authController));

module.exports = router;

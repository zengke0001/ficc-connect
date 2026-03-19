const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/wechat', authController.wechatLogin.bind(authController));
router.get('/profile', auth, authController.getProfile.bind(authController));
router.put('/profile', auth, authController.updateProfile.bind(authController));
router.get('/teams', authController.getTeams.bind(authController));

module.exports = router;

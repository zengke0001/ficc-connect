const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

// Optional auth middleware (attaches user if token present)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const { query } = require('../config/database');
    const jwt = require('jsonwebtoken');
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query('SELECT id, openid, nickname, avatar_url, team_id FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length > 0) req.user = result.rows[0];
    } catch (e) { /* ignore */ }
  }
  next();
};

router.get('/', optionalAuth, activityController.list.bind(activityController));
router.post('/', auth, activityController.create.bind(activityController));
router.get('/today', auth, activityController.getTodayStatus.bind(activityController));
router.get('/:id', optionalAuth, activityController.getOne.bind(activityController));
router.post('/:id/join', auth, activityController.join.bind(activityController));
router.post('/:id/leave', auth, activityController.leave.bind(activityController));
router.get('/:id/leaderboard', activityController.getLeaderboard.bind(activityController));
router.post('/:id/checkin', auth, activityController.checkin.bind(activityController));
router.get('/:id/checkins', activityController.getCheckins.bind(activityController));
router.post('/:id/archive', auth, activityController.archive.bind(activityController));

module.exports = router;

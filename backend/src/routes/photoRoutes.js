const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const { query } = require('../config/database');
    const jwt = require('jsonwebtoken');
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query('SELECT id, nickname, avatar_url FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length > 0) req.user = result.rows[0];
    } catch (e) { /* ignore */ }
  }
  next();
};

router.post('/upload', auth, upload.single('photo'), photoController.upload.bind(photoController));
router.post('/upload-general', auth, upload.single('photo'), photoController.uploadGeneral.bind(photoController));
router.get('/activity/:activityId', optionalAuth, photoController.getActivityPhotos.bind(photoController));
router.get('/gallery/:activityId', optionalAuth, photoController.getGallery.bind(photoController));
router.post('/:id/like', auth, photoController.like.bind(photoController));
router.delete('/:id/like', auth, photoController.unlike.bind(photoController));

module.exports = router;

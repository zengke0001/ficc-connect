const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const activityRoutes = require('./activityRoutes');
const photoRoutes = require('./photoRoutes');

router.use('/auth', authRoutes);
router.use('/activities', activityRoutes);
router.use('/photos', photoRoutes);

module.exports = router;

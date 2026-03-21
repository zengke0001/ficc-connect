const photoService = require('../services/photoService');

class PhotoController {
  async upload(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const { activityId, checkinId } = req.body;
      const photo = await photoService.uploadPhoto(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { activityId, checkinId, userId: req.user.id }
      );

      res.status(201).json({ success: true, data: { photo } });
    } catch (error) {
      next(error);
    }
  }

  async uploadGeneral(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const photo = await photoService.uploadGeneralImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user.id
      );

      res.status(201).json({ success: true, data: { photo } });
    } catch (error) {
      next(error);
    }
  }

  async getActivityPhotos(req, res, next) {
    try {
      const photos = await photoService.getActivityPhotos(req.params.activityId, {
        ...req.query,
        userId: req.user?.id
      });
      res.json({ success: true, data: { photos } });
    } catch (error) {
      next(error);
    }
  }

  async like(req, res, next) {
    try {
      const result = await photoService.likePhoto(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async unlike(req, res, next) {
    try {
      const result = await photoService.unlikePhoto(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getGallery(req, res, next) {
    try {
      const data = await photoService.getActivityGallery(req.params.activityId, req.user?.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PhotoController();

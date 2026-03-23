const activityService = require('../services/activityService');
const checkinService = require('../services/checkinService');

class ActivityController {
  async list(req, res, next) {
    try {
      const { status, my_activities, page, limit, year, include_all } = req.query;
      const userId = req.user?.id;
      const data = await activityService.listActivities({
        status,
        my_activities: my_activities === 'true',
        userId,
        year,
        include_all: include_all === 'true',
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const data = await activityService.getActivity(req.params.id, req.user?.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const activity = await activityService.createActivity(req.user.id, req.body);
      res.status(201).json({ success: true, data: { activity } });
    } catch (error) {
      next(error);
    }
  }

  async join(req, res, next) {
    try {
      const participant = await activityService.joinActivity(req.params.id, req.user.id);
      res.json({ success: true, data: { participant } });
    } catch (error) {
      next(error);
    }
  }

  async leave(req, res, next) {
    try {
      const result = await activityService.leaveActivity(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const { type, limit } = req.query;
      const rankings = await activityService.getLeaderboard(
        req.params.id, type || 'overall', parseInt(limit) || 20
      );
      res.json({ success: true, data: { rankings } });
    } catch (error) {
      next(error);
    }
  }

  async checkin(req, res, next) {
    try {
      const result = await checkinService.checkin(req.params.id, req.user.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getCheckins(req, res, next) {
    try {
      const checkins = await checkinService.getActivityCheckins(req.params.id, req.query);
      res.json({ success: true, data: { checkins } });
    } catch (error) {
      next(error);
    }
  }

  async getTodayStatus(req, res, next) {
    try {
      const activities = await checkinService.getTodayCheckinStatus(req.user.id);
      res.json({ success: true, data: { activities } });
    } catch (error) {
      next(error);
    }
  }

  async archive(req, res, next) {
    try {
      const activity = await activityService.archiveActivity(req.params.id, req.user.id);
      res.json({ success: true, data: { activity } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityController();

const authService = require('../services/authService');

class AuthController {
  async wechatLogin(req, res, next) {
    try {
      const { code, nickname, avatar_url } = req.body;
      if (!code) return res.status(400).json({ error: 'WeChat code is required' });

      const result = await authService.wechatLogin(code, nickname, avatar_url);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const data = await authService.getProfile(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  async getTeams(req, res, next) {
    try {
      const teams = await authService.getTeams();
      res.json({ success: true, data: { teams } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

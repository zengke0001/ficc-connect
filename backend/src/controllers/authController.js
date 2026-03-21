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

  // PWA: Email/Password login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.login(email, password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // PWA: Email/Password registration
  async register(req, res, next) {
    try {
      const { email, password, nickname, avatar_url } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const result = await authService.register({ email, password, nickname, avatar_url });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class AuthService {
  async wechatLogin(code, nickname, avatarUrl) {
    try {
      let openid;

      // Development mode: use consistent test openid
      if (process.env.NODE_ENV === 'development') {
        logger.info('Development mode: using consistent test openid');
        // Use a fixed test openid so the same "user" logs in each time
        openid = 'dev_test_openid_001';
      } else {
        // Production: exchange code with WeChat API
        const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
          params: {
            appid: process.env.WECHAT_APPID,
            secret: process.env.WECHAT_SECRET,
            js_code: code,
            grant_type: 'authorization_code'
          }
        });

        const { openid: wxOpenid, session_key, unionid } = response.data;

        if (!wxOpenid) {
          throw new Error('Failed to get openid from WeChat');
        }
        openid = wxOpenid;
      }

      // Check if user exists by openid
      let userResult = await query('SELECT * FROM users WHERE openid = $1', [openid]);
      let user = userResult.rows[0];
      let isNewUser = false;

      if (!user) {
        // Create new user
        isNewUser = true;
        userResult = await query(
          'INSERT INTO users (openid, nickname, avatar_url) VALUES ($1, $2, $3) RETURNING *',
          [openid, nickname || 'User', avatarUrl || '']
        );
        user = userResult.rows[0];
        logger.info('New user created', { userId: user.id, openid });
      } else {
        // Existing user - only update avatar if provided, keep existing nickname
        logger.info('Existing user found', { userId: user.id, openid });
        if (avatarUrl && avatarUrl !== user.avatar_url) {
          await this.updateProfile(user.id, { avatar_url: avatarUrl });
          userResult = await query('SELECT * FROM users WHERE id = $1', [user.id]);
          user = userResult.rows[0];
        }
      }

      // Update last active
      await query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, openid: user.openid },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return {
        token,
        user: this.sanitizeUser(user),
        isNewUser
      };
    } catch (error) {
      logger.error('WeChat login error', { error: error.message });
      throw error;
    }
  }

  async updateProfile(userId, profileData) {
    const { nickname, avatar_url, team_id } = profileData;
    
    const updates = {};
    if (nickname) updates.nickname = nickname;
    if (avatar_url) updates.avatar_url = avatar_url;
    if (team_id) updates.team_id = team_id;

    if (Object.keys(updates).length === 0) {
      throw new Error('No fields to update');
    }

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [userId, ...Object.values(updates)];

    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return this.sanitizeUser(result.rows[0]);
  }

  async getProfile(userId) {
    const result = await query(`
      SELECT u.*, t.name as team_name, t.color as team_color
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Get user stats
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT ap.activity_id) as activities_joined,
        COALESCE(SUM(ap.total_checkins), 0) as total_checkins,
        COALESCE(MAX(ap.max_streak), 0) as max_streak,
        COUNT(DISTINCT ua.achievement_id) as achievements_earned
      FROM users u
      LEFT JOIN activity_participants ap ON u.id = ap.user_id
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    // Get achievements
    const achievementsResult = await query(`
      SELECT a.*, ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.earned_at DESC
    `, [userId]);

    return {
      user: this.sanitizeUser(user),
      stats: statsResult.rows[0] || {},
      achievements: achievementsResult.rows
    };
  }

  async getTeams() {
    const result = await query('SELECT * FROM teams ORDER BY name');
    return result.rows;
  }

  sanitizeUser(user) {
    const { openid, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();

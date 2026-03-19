const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');

class ActivityService {
  async listActivities({ status, my_activities, userId, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClauses = [];

    if (status) {
      params.push(status);
      whereClauses.push(`a.status = $${params.length}`);
    } else {
      whereClauses.push(`a.status != 'archived'`);
    }

    if (my_activities && userId) {
      params.push(userId);
      whereClauses.push(`ap.user_id = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const joinStr = my_activities ? 
      `LEFT JOIN activity_participants ap ON a.id = ap.activity_id` : '';

    params.push(limit, offset);

    const result = await query(`
      SELECT DISTINCT
        a.*,
        u.nickname as creator_name,
        u.avatar_url as creator_avatar,
        COUNT(DISTINCT ap2.user_id) as participant_count
      FROM activities a
      JOIN users u ON a.creator_id = u.id
      ${joinStr}
      LEFT JOIN activity_participants ap2 ON a.id = ap2.activity_id
      ${whereStr}
      GROUP BY a.id, u.nickname, u.avatar_url
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countResult = await query(`
      SELECT COUNT(DISTINCT a.id) as total
      FROM activities a
      ${joinStr}
      ${whereStr}
    `, params.slice(0, -2));

    return {
      activities: result.rows,
      total: parseInt(countResult.rows[0]?.total || 0),
      page,
      limit
    };
  }

  async getActivity(activityId, userId = null) {
    const result = await query(`
      SELECT 
        a.*,
        u.nickname as creator_name,
        u.avatar_url as creator_avatar,
        COUNT(DISTINCT ap.user_id) as participant_count
      FROM activities a
      JOIN users u ON a.creator_id = u.id
      LEFT JOIN activity_participants ap ON a.id = ap.activity_id
      WHERE a.id = $1
      GROUP BY a.id, u.nickname, u.avatar_url
    `, [activityId]);

    if (result.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = result.rows[0];

    // Check if user has joined
    let isJoined = false;
    let userParticipant = null;
    if (userId) {
      const participantResult = await query(
        'SELECT * FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      );
      isJoined = participantResult.rows.length > 0;
      userParticipant = participantResult.rows[0];
    }

    // Get top 5 leaderboard
    const leaderboard = await this.getLeaderboard(activityId, 'overall', 5);

    // Get recent photos (6 photos)
    const photosResult = await query(`
      SELECT p.*, u.nickname, u.avatar_url
      FROM photos p
      JOIN users u ON p.user_id = u.id
      WHERE p.activity_id = $1
      ORDER BY p.created_at DESC
      LIMIT 6
    `, [activityId]);

    return {
      activity,
      isJoined,
      userParticipant,
      leaderboard,
      recentPhotos: photosResult.rows
    };
  }

  async createActivity(userId, activityData) {
    const {
      title, description, cover_image_url,
      start_date, end_date,
      checkin_start_time, checkin_end_time,
      points_per_checkin, points_per_photo
    } = activityData;

    const result = await query(`
      INSERT INTO activities (creator_id, title, description, cover_image_url, start_date, end_date, checkin_start_time, checkin_end_time, points_per_checkin, points_per_photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [userId, title, description, cover_image_url, start_date, end_date,
        checkin_start_time || '06:00', checkin_end_time || '23:59',
        points_per_checkin || 10, points_per_photo || 5
    ]);

    const activity = result.rows[0];

    // Auto-join creator as participant
    await this.joinActivity(activity.id, userId);

    // Award creation points
    await this.awardPoints(userId, 20, 'create_activity');

    return activity;
  }

  async joinActivity(activityId, userId) {
    // Check activity exists and is active
    const activityResult = await query(
      'SELECT * FROM activities WHERE id = $1 AND status = $2',
      [activityId, 'active']
    );
    if (activityResult.rows.length === 0) {
      throw new Error('Activity not found or not active');
    }

    // Check not already joined
    const existing = await query(
      'SELECT id FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
      [activityId, userId]
    );
    if (existing.rows.length > 0) {
      throw new Error('Already joined this activity');
    }

    const result = await query(`
      INSERT INTO activity_participants (activity_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `, [activityId, userId]);

    // Award join points
    await this.awardPoints(userId, 5, 'join_activity');

    return result.rows[0];
  }

  async leaveActivity(activityId, userId) {
    const result = await query(`
      DELETE FROM activity_participants 
      WHERE activity_id = $1 AND user_id = $2
      RETURNING *
    `, [activityId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Not a participant of this activity');
    }

    return { success: true };
  }

  async getLeaderboard(activityId, type = 'overall', limit = 20) {
    let query_str;
    const params = [activityId, limit];

    if (type === 'daily') {
      query_str = `
        SELECT 
          u.id, u.nickname, u.avatar_url, t.name as team_name, t.color as team_color,
          COUNT(c.id) as checkin_count,
          COALESCE(SUM(c.points_earned), 0) as points,
          ROW_NUMBER() OVER (ORDER BY COUNT(c.id) DESC, COALESCE(SUM(c.points_earned), 0) DESC) as rank
        FROM activity_participants ap
        JOIN users u ON ap.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        LEFT JOIN checkins c ON c.user_id = u.id AND c.activity_id = $1 AND c.checkin_date = CURRENT_DATE
        WHERE ap.activity_id = $1
        GROUP BY u.id, u.nickname, u.avatar_url, t.name, t.color
        ORDER BY points DESC, checkin_count DESC
        LIMIT $2
      `;
    } else if (type === 'weekly') {
      query_str = `
        SELECT 
          u.id, u.nickname, u.avatar_url, t.name as team_name, t.color as team_color,
          COUNT(c.id) as checkin_count,
          COALESCE(SUM(c.points_earned), 0) as points,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.points_earned), 0) DESC) as rank
        FROM activity_participants ap
        JOIN users u ON ap.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        LEFT JOIN checkins c ON c.user_id = u.id AND c.activity_id = $1 
          AND c.checkin_date >= date_trunc('week', CURRENT_DATE)
        WHERE ap.activity_id = $1
        GROUP BY u.id, u.nickname, u.avatar_url, t.name, t.color
        ORDER BY points DESC
        LIMIT $2
      `;
    } else {
      // Overall
      query_str = `
        SELECT 
          u.id, u.nickname, u.avatar_url, t.name as team_name, t.color as team_color,
          ap.total_checkins as checkin_count,
          ap.total_points as points,
          ap.current_streak,
          ap.max_streak,
          ROW_NUMBER() OVER (ORDER BY ap.total_points DESC) as rank
        FROM activity_participants ap
        JOIN users u ON ap.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE ap.activity_id = $1
        ORDER BY ap.total_points DESC
        LIMIT $2
      `;
    }

    const result = await query(query_str, params);
    return result.rows;
  }

  async archiveCompletedActivities() {
    const result = await query(`
      UPDATE activities 
      SET status = 'completed'
      WHERE status = 'active' AND end_date < CURRENT_DATE
      RETURNING id, title
    `);

    if (result.rows.length > 0) {
      logger.info(`Archived ${result.rows.length} completed activities`, { activities: result.rows });
    }

    return result.rows;
  }

  async awardPoints(userId, points, reason) {
    await query(
      'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
      [points, userId]
    );
    logger.debug('Points awarded', { userId, points, reason });
  }
}

module.exports = new ActivityService();

const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');

class ActivityService {
  async listActivities({ status, my_activities, userId, year, include_all, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClauses = [];

    if (status) {
      params.push(status);
      whereClauses.push(`a.status = ?`);
    } else if (!include_all) {
      whereClauses.push(`a.status != 'archived'`);
    }

    if (my_activities && userId) {
      params.push(userId);
      whereClauses.push(`ap.user_id = ?`);
    }

    if (year) {
      params.push(parseInt(year));
      whereClauses.push(`strftime('%Y', a.start_date) = ?`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const joinStr = my_activities ? 
      `LEFT JOIN activity_participants ap ON a.id = ap.activity_id` : '';

    // Build base query params (without limit/offset for count)
    const queryParams = [...params];
    
    // Add limit and offset for main query
    const limitParam = parseInt(limit) || 10;
    const offsetParam = parseInt(offset) || 0;
    queryParams.push(limitParam, offsetParam);

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
      LIMIT ? OFFSET ?
    `, queryParams);

    // Count query - only uses the WHERE params (no limit/offset)
    const countResult = await query(`
      SELECT COUNT(DISTINCT a.id) as total
      FROM activities a
      ${joinStr}
      ${whereStr}
    `, params);

    const rows = result.rows || [];
    return {
      activities: rows,
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
      WHERE a.id = ?
      GROUP BY a.id, u.nickname, u.avatar_url
    `, [activityId]);

    if (result.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = result.rows[0];

    // Check if user has joined (or is the creator)
    let isJoined = false;
    let userParticipant = null;
    if (userId) {
      // Check if user is the creator
      if (activity.creator_id === userId) {
        isJoined = true;
      } else {
        // Check if user is in participants table
        const participantResult = await query(
          'SELECT * FROM activity_participants WHERE activity_id = ? AND user_id = ?',
          [activityId, userId]
        );
        isJoined = participantResult.rows.length > 0;
        userParticipant = participantResult.rows[0];
      }
    }

    // Get top 5 leaderboard
    const leaderboard = await this.getLeaderboard(activityId, 'overall', 5);

    // Get participants list
    const participantsResult = await query(`
      SELECT 
        ap.user_id, ap.total_checkins, ap.total_points, ap.current_streak,
        u.nickname, u.avatar_url, u.team_id,
        t.name as team_name, t.color as team_color
      FROM activity_participants ap
      JOIN users u ON ap.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE ap.activity_id = ?
      ORDER BY ap.total_points DESC
    `, [activityId]);

    // Get recent photos (6 photos)
    const photosResult = await query(`
      SELECT p.*, u.nickname, u.avatar_url
      FROM photos p
      JOIN users u ON p.user_id = u.id
      WHERE p.activity_id = ?
      ORDER BY p.created_at DESC
      LIMIT 6
    `, [activityId]);

    return {
      activity,
      isJoined,
      userParticipant,
      participants: participantsResult.rows,
      leaderboard,
      recentPhotos: photosResult.rows
    };
  }

  async createActivity(userId, activityData) {
    const { v4: uuidv4 } = require('uuid');
    const {
      title, description, cover_image_url,
      start_date, end_date,
      checkin_start_time, checkin_end_time,
      points_per_checkin, points_per_photo,
      allow_multiple_checkins
    } = activityData;

    const activityId = uuidv4();
    const result = await query(`
      INSERT INTO activities (id, creator_id, title, description, cover_image_url, start_date, end_date, checkin_start_time, checkin_end_time, points_per_checkin, points_per_photo, allow_multiple_checkins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [activityId, userId, title, description, cover_image_url, start_date, end_date,
        checkin_start_time || '06:00', checkin_end_time || '23:59',
        points_per_checkin || 10, points_per_photo || 5,
        allow_multiple_checkins ? 1 : 0
    ]);

    const activity = { id: activityId, creator_id: userId, title, description, cover_image_url, start_date, end_date, checkin_start_time: checkin_start_time || '06:00', checkin_end_time: checkin_end_time || '23:59', points_per_checkin: points_per_checkin || 10, points_per_photo: points_per_photo || 5, allow_multiple_checkins: allow_multiple_checkins ? 1 : 0, status: 'active', created_at: new Date().toISOString() };

    // Auto-join creator as participant
    await this.joinActivity(activity.id, userId);

    // Award creation points
    await this.awardPoints(userId, 20, 'create_activity');

    return activity;
  }

  async updateActivity(activityId, userId, updates) {
    // Check if user is the creator
    const activityResult = await query(
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );

    if (activityResult.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = activityResult.rows[0];

    if (activity.creator_id !== userId) {
      throw new Error('Only the activity creator can edit this activity');
    }

    // Build update query dynamically
    const allowedFields = ['title', 'description', 'cover_image_url', 'allow_multiple_checkins'];
    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // Convert boolean to integer for SQLite
        const dbValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
        setClauses.push(`${key} = ?`);
        values.push(dbValue);
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(activityId);

    const result = await query(`
      UPDATE activities
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `, values);

    logger.info('Activity updated by creator', { activityId, userId, fields: Object.keys(updates) });
    return await query('SELECT * FROM activities WHERE id = ?', [activityId]).then(r => r.rows[0]);
  }

  async joinActivity(activityId, userId) {
    // Check activity exists and is active
    const activityResult = await query(
      'SELECT * FROM activities WHERE id = ? AND status = ?',
      [activityId, 'active']
    );
    if (activityResult.rows.length === 0) {
      throw new Error('Activity not found or not active');
    }

    // Check not already joined
    const existing = await query(
      'SELECT id FROM activity_participants WHERE activity_id = ? AND user_id = ?',
      [activityId, userId]
    );
    if (existing.rows.length > 0) {
      // Already joined - return success silently
      return { id: existing.rows[0].id, activity_id: activityId, user_id: userId, joined_at: existing.rows[0].joined_at, already_joined: true };
    }

    const { v4: uuidv4 } = require('uuid');
    const participantId = uuidv4();
    const result = await query(`
      INSERT INTO activity_participants (id, activity_id, user_id)
      VALUES (?, ?, ?)
    `, [participantId, activityId, userId]);

    // Award join points
    await this.awardPoints(userId, 5, 'join_activity');

    return { id: participantId, activity_id: activityId, user_id: userId, joined_at: new Date().toISOString(), total_checkins: 0, total_points: 0, current_streak: 0, max_streak: 0 };
  }

  async leaveActivity(activityId, userId) {
    const result = await query(`
      DELETE FROM activity_participants 
      WHERE activity_id = ? AND user_id = ?
    `, [activityId, userId]);

    if (result.rowCount === 0) {
      throw new Error('Not a participant of this activity');
    }

    return { success: true };
  }

  async getLeaderboard(activityId, type = 'overall', limit = 20) {
    let query_str;
    const limitInt = parseInt(limit) || 0;

    if (type === 'daily') {
      query_str = `
        SELECT 
          u.id as user_id, u.nickname, u.avatar_url, t.name as team_name, t.color as team_color,
          COUNT(c.id) as total_checkins,
          COALESCE(SUM(c.points_earned), 0) as total_points,
          ROW_NUMBER() OVER (ORDER BY COUNT(c.id) DESC, COALESCE(SUM(c.points_earned), 0) DESC) as rank
        FROM checkins c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE c.activity_id = ? AND c.checkin_date = date('now')
        GROUP BY u.id, u.nickname, u.avatar_url, t.name, t.color
        ORDER BY total_points DESC, total_checkins DESC
        ${limitInt > 0 ? 'LIMIT ?' : ''}
      `;
      const params = limitInt > 0 ? [activityId, limitInt] : [activityId];
      const result = await query(query_str, params);
      return result.rows;
    } else if (type === 'weekly') {
      query_str = `
        SELECT 
          u.id as user_id, u.nickname, u.avatar_url, t.name as team_name, t.color as team_color,
          COUNT(c.id) as total_checkins,
          COALESCE(SUM(c.points_earned), 0) as total_points,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.points_earned), 0) DESC) as rank
        FROM checkins c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE c.activity_id = ? AND c.checkin_date >= date('now', 'weekday 0')
        GROUP BY u.id, u.nickname, u.avatar_url, t.name, t.color
        ORDER BY total_points DESC
        ${limitInt > 0 ? 'LIMIT ?' : ''}
      `;
      const params = limitInt > 0 ? [activityId, limitInt] : [activityId];
      const result = await query(query_str, params);
      return result.rows;
    } else {
      query_str = `
        SELECT 
          u.id as user_id, u.nickname, u.avatar_url, t.name as team_name, t.color as team_color,
          COUNT(c.id) as total_checkins,
          COALESCE(SUM(c.points_earned), 0) as total_points,
          MAX(c.points_earned) as max_single_checkin,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.points_earned), 0) DESC) as rank
        FROM checkins c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE c.activity_id = ?
        GROUP BY u.id, u.nickname, u.avatar_url, t.name, t.color
        ORDER BY total_points DESC
        ${limitInt > 0 ? 'LIMIT ?' : ''}
      `;
      const params = limitInt > 0 ? [activityId, limitInt] : [activityId];
      const result = await query(query_str, params);
      return result.rows;
    }
  }

  async archiveCompletedActivities() {
    const result = await query(`
      UPDATE activities
      SET status = 'completed'
      WHERE status = 'active' AND end_date < date('now')
    `);

    if (result.rowCount > 0) {
      const archivedActivities = await query('SELECT id, title FROM activities WHERE status = ?', ['completed']);
      logger.info(`Archived ${result.rowCount} completed activities`, { activities: archivedActivities.rows });
    }

    return await query("SELECT * FROM activities WHERE status = 'completed'").then(r => r.rows);
  }

  async archiveActivity(activityId, userId) {
    // Check if user is the creator
    const activityResult = await query(
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );

    if (activityResult.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = activityResult.rows[0];

    if (activity.creator_id !== userId) {
      throw new Error('Only the activity creator can archive this activity');
    }

    if (activity.status === 'completed') {
      throw new Error('Activity is already archived');
    }

    const result = await query(`
      UPDATE activities
      SET status = 'completed'
      WHERE id = ?
    `, [activityId]);

    logger.info('Activity archived by creator', { activityId, userId });
    return await query('SELECT * FROM activities WHERE id = ?', [activityId]).then(r => r.rows[0]);
  }

  async restoreActivity(activityId, userId) {
    // Check if user is the creator
    const activityResult = await query(
      'SELECT * FROM activities WHERE id = ?',
      [activityId]
    );

    if (activityResult.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = activityResult.rows[0];

    if (activity.creator_id !== userId) {
      throw new Error('Only the activity creator can restore this activity');
    }

    if (activity.status !== 'completed') {
      throw new Error('Activity is not archived');
    }

    const result = await query(`
      UPDATE activities
      SET status = 'active'
      WHERE id = ?
    `, [activityId]);

    logger.info('Activity restored by creator', { activityId, userId });
    return await query('SELECT * FROM activities WHERE id = ?', [activityId]).then(r => r.rows[0]);
  }

  async awardPoints(userId, points, reason) {
    await query(
      'UPDATE users SET total_points = total_points + ? WHERE id = ?',
      [points, userId]
    );
    logger.debug('Points awarded', { userId, points, reason });
  }
}

module.exports = new ActivityService();

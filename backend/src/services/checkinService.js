const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');

class CheckinService {
  async checkin(activityId, userId, { comment, location_lat, location_lng } = {}) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Verify activity is active and user is participant
      const activityResult = await client.query(
        'SELECT * FROM activities WHERE id = $1 AND status = $2',
        [activityId, 'active']
      );
      if (activityResult.rows.length === 0) {
        throw new Error('Activity not found or not active');
      }
      const activity = activityResult.rows[0];

      const participantResult = await client.query(
        'SELECT * FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      );
      if (participantResult.rows.length === 0) {
        throw new Error('You have not joined this activity');
      }

      const today = new Date().toISOString().slice(0, 10);

      // Prevent duplicate check-in on same day
      const existing = await client.query(
        'SELECT id FROM checkins WHERE activity_id = $1 AND user_id = $2 AND checkin_date = $3',
        [activityId, userId, today]
      );
      if (existing.rows.length > 0) {
        throw new Error('Already checked in today for this activity');
      }

      let pointsEarned = activity.points_per_checkin;

      // Create check-in record
      const checkinResult = await client.query(`
        INSERT INTO checkins (activity_id, user_id, checkin_date, comment, points_earned, location_lat, location_lng)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [activityId, userId, today, comment, pointsEarned, location_lat, location_lng]);

      const checkin = checkinResult.rows[0];

      // Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const yesterdayCheckin = await client.query(
        'SELECT id FROM checkins WHERE activity_id = $1 AND user_id = $2 AND checkin_date = $3',
        [activityId, userId, yesterdayStr]
      );

      const participant = participantResult.rows[0];
      let newStreak = yesterdayCheckin.rows.length > 0 ? participant.current_streak + 1 : 1;
      const newMaxStreak = Math.max(newStreak, participant.max_streak);

      // Apply streak bonuses
      let streakBonus = 0;
      if (newStreak === 3) streakBonus = 10;
      else if (newStreak === 7) streakBonus = 25;
      else if (newStreak === 30) streakBonus = 100;
      
      pointsEarned += streakBonus;

      // Update participant stats
      await client.query(`
        UPDATE activity_participants 
        SET total_checkins = total_checkins + 1,
            total_points = total_points + $1,
            current_streak = $2,
            max_streak = $3
        WHERE activity_id = $4 AND user_id = $5
      `, [pointsEarned, newStreak, newMaxStreak, activityId, userId]);

      // Update user total points and checkin count
      await client.query(`
        UPDATE users 
        SET total_points = total_points + $1, checkin_count = checkin_count + 1
        WHERE id = $2
      `, [pointsEarned, userId]);

      // Update check-in record with final points
      if (streakBonus > 0) {
        await client.query(
          'UPDATE checkins SET points_earned = $1 WHERE id = $2',
          [pointsEarned, checkin.id]
        );
        checkin.points_earned = pointsEarned;
      }

      await client.query('COMMIT');
      
      // Check for new achievements (non-transactional)
      const newAchievements = await this.checkAchievements(userId, activityId, newStreak);

      logger.info('Check-in successful', { userId, activityId, streak: newStreak, points: pointsEarned });
      
      return {
        checkin,
        streak: newStreak,
        maxStreak: newMaxStreak,
        pointsEarned,
        streakBonus,
        newAchievements
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTodayCheckinStatus(userId) {
    const today = new Date().toISOString().slice(0, 10);
    
    const result = await query(`
      SELECT 
        ap.activity_id,
        a.title,
        a.cover_image_url,
        CASE WHEN c.id IS NOT NULL THEN true ELSE false END as has_checkin,
        c.id as checkin_id,
        c.photo_url,
        ap.current_streak
      FROM activity_participants ap
      JOIN activities a ON ap.activity_id = a.id
      LEFT JOIN checkins c ON c.activity_id = ap.activity_id 
        AND c.user_id = ap.user_id AND c.checkin_date = $1
      WHERE ap.user_id = $2 AND a.status = 'active'
      ORDER BY has_checkin ASC, a.created_at DESC
    `, [today, userId]);

    return result.rows;
  }

  async getActivityCheckins(activityId, { date, user_id, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const params = [activityId];
    let whereClauses = ['c.activity_id = $1'];

    if (date) {
      params.push(date);
      whereClauses.push(`c.checkin_date = $${params.length}`);
    }
    if (user_id) {
      params.push(user_id);
      whereClauses.push(`c.user_id = $${params.length}`);
    }

    params.push(limit, offset);

    const result = await query(`
      SELECT 
        c.*,
        u.nickname, u.avatar_url,
        t.name as team_name, t.color as team_color,
        p.url as photo_url, p.id as photo_id, p.likes_count
      FROM checkins c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN photos p ON p.checkin_id = c.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY c.checkin_time DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return result.rows;
  }

  async checkAchievements(userId, activityId, currentStreak) {
    const newAchievements = [];

    try {
      // Get user stats
      const statsResult = await query(`
        SELECT 
          u.checkin_count,
          COUNT(DISTINCT ap.activity_id) as activities_joined,
          (SELECT COUNT(*) FROM photos WHERE user_id = u.id) as photo_count,
          (SELECT COALESCE(SUM(l.count), 0) FROM (
            SELECT COUNT(*) FROM likes WHERE photo_id IN (
              SELECT id FROM photos WHERE user_id = u.id
            )
          ) l) as likes_received
        FROM users u
        LEFT JOIN activity_participants ap ON u.id = ap.user_id
        WHERE u.id = $1
        GROUP BY u.id
      `, [userId]);

      const stats = statsResult.rows[0];
      if (!stats) return newAchievements;

      // Check each achievement condition
      const checks = [
        { type: 'checkin_count', value: 1, achieved: stats.checkin_count >= 1 },
        { type: 'streak', value: 7, achieved: currentStreak >= 7 },
        { type: 'activities_joined', value: 5, achieved: stats.activities_joined >= 5 },
      ];

      for (const check of checks) {
        const achievementResult = await query(
          'SELECT * FROM achievements WHERE condition_type = $1 AND condition_value = $2',
          [check.type, check.value]
        );

        if (achievementResult.rows.length > 0 && check.achieved) {
          const achievement = achievementResult.rows[0];
          
          // Check if not already earned
          const existing = await query(
            'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
            [userId, achievement.id]
          );

          if (existing.rows.length === 0) {
            await query(
              'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
              [userId, achievement.id]
            );

            if (achievement.points_reward > 0) {
              await query(
                'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
                [achievement.points_reward, userId]
              );
            }

            newAchievements.push(achievement);
            logger.info('Achievement earned', { userId, achievement: achievement.name });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking achievements', { error: error.message, userId });
    }

    return newAchievements;
  }
}

module.exports = new CheckinService();

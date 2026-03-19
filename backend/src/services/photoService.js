const sharp = require('sharp');
const path = require('path');
const { query } = require('../config/database');
const storage = require('../config/storage');
const logger = require('../utils/logger');

class PhotoService {
  async uploadPhoto(fileBuffer, originalname, mimetype, { activityId, checkinId, userId }) {
    try {
      // Process image with Sharp
      const image = sharp(fileBuffer);
      const metadata = await image.metadata();

      let processedBuffer = fileBuffer;
      let width = metadata.width;
      let height = metadata.height;

      // Resize if too large
      if (width > 1920 || height > 1920) {
        const resized = await image
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        processedBuffer = resized;
        const newMeta = await sharp(resized).metadata();
        width = newMeta.width;
        height = newMeta.height;
      }

      // Generate thumbnail
      const thumbnailBuffer = await sharp(fileBuffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();

      // Generate storage key
      const key = storage.generateKey(originalname, userId);
      const thumbnailKey = `thumbnails/${key}`;

      // Upload both to cloud storage
      const [photoUrl, thumbnailUrl] = await Promise.all([
        storage.uploadFile(processedBuffer, key, 'image/jpeg', {
          userId: userId.toString(),
          activityId: activityId ? activityId.toString() : ''
        }),
        storage.uploadFile(thumbnailBuffer, thumbnailKey, 'image/jpeg', {
          userId: userId.toString(),
          isThumb: 'true'
        })
      ]);

      // Save to database
      const result = await query(`
        INSERT INTO photos (checkin_id, activity_id, user_id, storage_key, url, thumbnail_url, width, height)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [checkinId, activityId, userId, key, photoUrl, thumbnailUrl, width, height]);

      const photo = result.rows[0];

      // Update checkin with photo_url
      if (checkinId) {
        await query(
          'UPDATE checkins SET photo_url = $1 WHERE id = $2',
          [photoUrl, checkinId]
        );

        // Award photo bonus points
        const activityResult = await query(
          'SELECT points_per_photo FROM activities WHERE id = $1',
          [activityId]
        );
        
        if (activityResult.rows.length > 0) {
          const photoBonus = activityResult.rows[0].points_per_photo;
          await query(
            'UPDATE activity_participants SET total_points = total_points + $1 WHERE activity_id = $2 AND user_id = $3',
            [photoBonus, activityId, userId]
          );
          await query(
            'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
            [photoBonus, userId]
          );
        }
      }

      logger.info('Photo uploaded successfully', { photoId: photo.id, userId, activityId });
      return photo;
    } catch (error) {
      logger.error('Photo upload error', { error: error.message });
      throw error;
    }
  }

  async getActivityPhotos(activityId, { page = 1, limit = 20, userId } = {}) {
    const offset = (page - 1) * limit;
    const params = [activityId];
    let userFilter = '';
    let likeJoin = 'LEFT JOIN likes l ON p.id = l.photo_id AND 1=0';

    if (userId) {
      params.push(userId);
      userFilter = `AND p.user_id = $${params.length}`;
      likeJoin = `LEFT JOIN likes l ON p.id = l.photo_id AND l.user_id = $2`;
    }

    params.push(limit, offset);

    const result = await query(`
      SELECT 
        p.*,
        u.nickname, u.avatar_url,
        t.name as team_name,
        c.checkin_date, c.comment,
        CASE WHEN l.id IS NOT NULL THEN true ELSE false END as is_liked
      FROM photos p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN checkins c ON p.checkin_id = c.id
      ${likeJoin}
      WHERE p.activity_id = $1 ${userFilter}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return result.rows;
  }

  async likePhoto(photoId, userId) {
    try {
      await query(
        'INSERT INTO likes (photo_id, user_id) VALUES ($1, $2)',
        [photoId, userId]
      );

      const result = await query(
        'UPDATE photos SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
        [photoId]
      );

      // Award 1 point to photo owner for each like
      await query(`
        UPDATE users u
        SET total_points = total_points + 1
        FROM photos p
        WHERE p.id = $1 AND p.user_id = u.id
      `, [photoId]);

      return { likes_count: result.rows[0]?.likes_count || 0 };
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Already liked this photo');
      }
      throw error;
    }
  }

  async unlikePhoto(photoId, userId) {
    const result = await query(
      'DELETE FROM likes WHERE photo_id = $1 AND user_id = $2 RETURNING id',
      [photoId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Like not found');
    }

    const countResult = await query(
      'UPDATE photos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1 RETURNING likes_count',
      [photoId]
    );

    return { likes_count: countResult.rows[0]?.likes_count || 0 };
  }

  async getActivityGallery(activityId) {
    // Get all photos for completed activity
    const photosResult = await query(`
      SELECT 
        p.*,
        u.nickname, u.avatar_url,
        t.name as team_name, t.color as team_color
      FROM photos p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE p.activity_id = $1
      ORDER BY p.likes_count DESC, p.created_at DESC
    `, [activityId]);

    // Get leaderboard (winners)
    const winnersResult = await query(`
      SELECT 
        u.id, u.nickname, u.avatar_url,
        t.name as team_name, t.color as team_color,
        ap.total_checkins, ap.total_points, ap.max_streak,
        ROW_NUMBER() OVER (ORDER BY ap.total_points DESC) as rank
      FROM activity_participants ap
      JOIN users u ON ap.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE ap.activity_id = $1
      ORDER BY ap.total_points DESC
      LIMIT 3
    `, [activityId]);

    // Activity stats
    const statsResult = await query(`
      SELECT
        COUNT(DISTINCT ap.user_id) as total_participants,
        COUNT(c.id) as total_checkins,
        COUNT(p.id) as total_photos,
        COALESCE(SUM(l.count), 0) as total_likes
      FROM activity_participants ap
      LEFT JOIN checkins c ON c.activity_id = $1
      LEFT JOIN photos p ON p.activity_id = $1
      LEFT JOIN (SELECT photo_id, COUNT(*) FROM likes GROUP BY photo_id) l ON l.photo_id = p.id
      WHERE ap.activity_id = $1
    `, [activityId]);

    return {
      photos: photosResult.rows,
      winners: winnersResult.rows,
      stats: statsResult.rows[0] || {}
    };
  }
}

module.exports = new PhotoService();

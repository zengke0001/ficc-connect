const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const storage = require('../config/storage');
const logger = require('../utils/logger');

class PhotoService {
  async uploadGeneralImage(fileBuffer, originalname, mimetype, userId) {
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
          userId: userId.toString()
        }),
        storage.uploadFile(thumbnailBuffer, thumbnailKey, 'image/jpeg', {
          userId: userId.toString(),
          isThumb: 'true'
        })
      ]);

      logger.info('General image uploaded successfully', { key, userId });

      return {
        url: photoUrl,
        thumbnail_url: thumbnailUrl,
        width,
        height
      };
    } catch (error) {
      logger.error('General image upload error', { error: error.message });
      throw error;
    }
  }

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
      const photoId = uuidv4();
      await query(`
        INSERT INTO photos (id, checkin_id, activity_id, user_id, storage_key, url, thumbnail_url, width, height)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [photoId, checkinId, activityId, userId, key, photoUrl, thumbnailUrl, width, height]);

      const photo = { id: photoId, checkin_id: checkinId, activity_id: activityId, user_id: userId, storage_key: key, url: photoUrl, thumbnail_url: thumbnailUrl, width, height, likes_count: 0, created_at: new Date().toISOString() };

      // Update checkin with photo_url
      if (checkinId) {
        await query(
          'UPDATE checkins SET photo_url = ? WHERE id = ?',
          [photoUrl, checkinId]
        );

        // Award photo bonus points
        const activityResult = await query(
          'SELECT points_per_photo FROM activities WHERE id = ?',
          [activityId]
        );
        
        if (activityResult.rows.length > 0) {
          const photoBonus = activityResult.rows[0].points_per_photo;
          await query(
            'UPDATE activity_participants SET total_points = total_points + ? WHERE activity_id = ? AND user_id = ?',
            [photoBonus, activityId, userId]
          );
          await query(
            'UPDATE users SET total_points = total_points + ? WHERE id = ?',
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
    
    // Ensure values are integers
    const limitInt = parseInt(limit) || 20;
    const offsetInt = parseInt(offset) || 0;
    
    // Simple query - always show all photos for the activity
    const result = await query(`
      SELECT 
        p.*,
        u.nickname, u.avatar_url,
        t.name as team_name,
        c.checkin_date, c.comment,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM photos p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN checkins c ON p.checkin_id = c.id
      LEFT JOIN likes l ON p.id = l.photo_id AND l.user_id = ?
      WHERE p.activity_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId || 0, activityId, limitInt, offsetInt]);

    const rows = result.rows || [];
    return rows.map(row => ({
      ...row,
      is_liked: row.is_liked === 1
    }));
  }

  async likePhoto(photoId, userId) {
    try {
      const { v4: uuidv4 } = require('uuid');
      const likeId = uuidv4();
      
      await query(
        'INSERT INTO likes (id, photo_id, user_id) VALUES (?, ?, ?)',
        [likeId, photoId, userId]
      );

      const result = await query(
        'UPDATE photos SET likes_count = likes_count + 1 WHERE id = ?',
        [photoId]
      );

      // Award 1 point to photo owner for each like
      await query(`
        UPDATE users
        SET total_points = total_points + 1
        WHERE id = (SELECT user_id FROM photos WHERE id = ?)
      `, [photoId]);

      const updated = await query('SELECT likes_count FROM photos WHERE id = ?', [photoId]);
      return { likes_count: updated.rows[0]?.likes_count || 0 };
    } catch (error) {
      // SQLite constraint errors
      if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE constraint failed') || error.message.includes('constraint failed')) {
        throw new Error('Already liked this photo');
      }
      throw error;
    }
  }

  async unlikePhoto(photoId, userId) {
    const result = await query(
      'DELETE FROM likes WHERE photo_id = ? AND user_id = ?',
      [photoId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Like not found');
    }

    await query(
      'UPDATE photos SET likes_count = MAX(likes_count - 1, 0) WHERE id = ?',
      [photoId]
    );

    const countResult = await query('SELECT likes_count FROM photos WHERE id = ?', [photoId]);
    return { likes_count: countResult.rows[0]?.likes_count || 0 };
  }

  async getActivityGallery(activityId, userId) {
    // Always get all photos - just track is_liked for current user
    const photosResult = await query(`
      SELECT 
        p.*,
        u.nickname, u.avatar_url,
        t.name as team_name, t.color as team_color,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM photos p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN likes l ON p.id = l.photo_id AND l.user_id = ?
      WHERE p.activity_id = ?
      ORDER BY p.likes_count DESC, p.created_at DESC
    `, [userId || 0, activityId]);

    // Get leaderboard (winners) - based on checkins
    const winnersResult = await query(`
      SELECT 
        u.id, u.nickname, u.avatar_url,
        t.name as team_name, t.color as team_color,
        COUNT(c.id) as total_checkins,
        COALESCE(SUM(c.points_earned), 0) as total_points,
        MAX(c.points_earned) as max_streak,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.points_earned), 0) DESC) as rank
      FROM checkins c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE c.activity_id = ?
      GROUP BY u.id, u.nickname, u.avatar_url, t.name, t.color
      ORDER BY total_points DESC
      LIMIT 3
    `, [activityId]);

    // Activity stats
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM checkins WHERE activity_id = ?) as total_participants,
        (SELECT COUNT(*) FROM checkins WHERE activity_id = ?) as total_checkins,
        (SELECT COUNT(*) FROM photos WHERE activity_id = ?) as total_photos,
        (SELECT COUNT(*) FROM likes WHERE photo_id IN (SELECT id FROM photos WHERE activity_id = ?)) as total_likes
    `, [activityId, activityId, activityId, activityId]);

    return {
      photos: photosResult.rows.map(row => ({ ...row, is_liked: row.is_liked === 1 })),
      winners: winnersResult.rows,
      stats: statsResult.rows[0] || {}
    };
  }
}

module.exports = new PhotoService();

const OSS = require('ali-oss');
const logger = require('../utils/logger');

class OSSStorageService {
  constructor() {
    this.client = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      secure: true,
    });
    
    logger.info('OSS Storage Service initialized', { bucket: process.env.OSS_BUCKET });
  }

  async uploadFile(fileBuffer, key, mimeType, metadata = {}) {
    const result = await this.client.put(key, fileBuffer, {
      mime: mimeType,
      meta: metadata,
    });
    logger.info('OSS upload success', { key, url: result.url });
    return result.url;
  }

  async getPresignedUrl(key, expiresIn = 3600) {
    const url = this.client.signatureUrl(key, {
      expires: expiresIn,
      method: 'GET',
    });
    return url;
  }

  async deleteFile(key) {
    await this.client.delete(key);
    logger.info('OSS delete success', { key });
  }

  generateKey(filename, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `uploads/${userId}/${timestamp}-${random}-${sanitized}`;
  }
}

module.exports = OSSStorageService;

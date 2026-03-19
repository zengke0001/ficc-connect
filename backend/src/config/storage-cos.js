const COS = require('cos-nodejs-sdk-v5');
const logger = require('../utils/logger');

class COSStorageService {
  constructor() {
    this.client = new COS({
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
    });
    this.bucket = process.env.COS_BUCKET;
    this.region = process.env.COS_REGION;
    
    logger.info('COS Storage Service initialized', { bucket: this.bucket, region: this.region });
  }

  async uploadFile(fileBuffer, key, mimeType, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.client.putObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: metadata,
      }, (err, data) => {
        if (err) {
          logger.error('COS upload error', { error: err, key });
          reject(err);
        } else {
          const url = `https://${this.bucket}.cos.${this.region}.myqcloud.com/${key}`;
          logger.info('COS upload success', { key, url });
          resolve(url);
        }
      });
    });
  }

  async getPresignedUrl(key, expiresIn = 3600) {
    return new Promise((resolve, reject) => {
      this.client.getObjectUrl({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
        Expires: expiresIn,
        Sign: true,
      }, (err, data) => {
        if (err) {
          logger.error('COS presigned URL error', { error: err, key });
          reject(err);
        } else {
          resolve(data.Url);
        }
      });
    });
  }

  async deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.client.deleteObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      }, (err, data) => {
        if (err) {
          logger.error('COS delete error', { error: err, key });
          reject(err);
        } else {
          logger.info('COS delete success', { key });
          resolve(data);
        }
      });
    });
  }

  generateKey(filename, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `uploads/${userId}/${timestamp}-${random}-${sanitized}`;
  }
}

module.exports = COSStorageService;

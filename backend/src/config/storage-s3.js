const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');

class S3StorageService {
  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET;
    
    logger.info('S3 Storage Service initialized', { bucket: this.bucket });
  }

  async uploadFile(fileBuffer, key, mimeType, metadata = {}) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: metadata,
    });

    await this.client.send(command);
    const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    logger.info('S3 upload success', { key, url });
    return url;
  }

  async getPresignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
    logger.info('S3 delete success', { key });
  }

  generateKey(filename, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `uploads/${userId}/${timestamp}-${random}-${sanitized}`;
  }
}

module.exports = S3StorageService;

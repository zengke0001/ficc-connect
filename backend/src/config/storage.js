const S3StorageService = require('./storage-s3');
const OSSStorageService = require('./storage-oss');
const COSStorageService = require('./storage-cos');
const logger = require('../utils/logger');

class StorageFactory {
  static create(provider = process.env.STORAGE_PROVIDER) {
    logger.info(`Initializing storage provider: ${provider}`);
    
    switch (provider) {
      case 's3':
        return new S3StorageService();
      case 'oss':
        return new OSSStorageService();
      case 'cos':
        return new COSStorageService();
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }
}

module.exports = StorageFactory.create();

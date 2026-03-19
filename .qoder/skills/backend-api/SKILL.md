---
name: backend-api
description: Build production-ready Node.js backends with Express.js, PostgreSQL database, and cloud object storage (AWS S3, Alibaba OSS, Tencent COS) for file uploads. Use when creating REST APIs, database schemas, handling file uploads, or when the user mentions backend, API, database, or server development.
---

# Backend API Development with Express + PostgreSQL + Cloud Object Storage

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # PostgreSQL connection
│   │   ├── storage.js    # S3/MinIO configuration
│   │   └── env.js        # Environment variables
│   ├── controllers/      # Request handlers
│   │   ├── userController.js
│   │   └── uploadController.js
│   ├── services/         # Business logic
│   │   ├── userService.js
│   │   └── storageService.js
│   ├── repositories/     # Database access layer
│   │   ├── userRepository.js
│   │   └── baseRepository.js
│   ├── models/           # Database models/schemas
│   │   └── userModel.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js
│   ├── routes/           # API routes
│   │   ├── index.js
│   │   ├── userRoutes.js
│   │   └── uploadRoutes.js
│   ├── utils/            # Utility functions
│   │   ├── logger.js
│   │   └── validators.js
│   └── app.js            # Express app setup
├── migrations/           # Database migrations
├── tests/                # Test files
├── .env                  # Environment variables
├── .env.example
├── package.json
└── server.js             # Entry point
```

## PostgreSQL Setup

### Database Configuration

```javascript
// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 2000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

### Schema Design Best Practices

```sql
-- migrations/001_initial_schema.sql
-- Use UUID for primary keys (better for distributed systems)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Photos table with foreign key
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_key VARCHAR(500) NOT NULL,  -- Object storage key
    storage_url VARCHAR(500) NOT NULL,   -- Public/ presigned URL
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}',         -- Flexible metadata storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_photos_metadata ON photos USING GIN (metadata);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### Repository Pattern

```javascript
// src/repositories/baseRepository.js
class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async findAll(options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at DESC' } = options;
    const query = `
      SELECT * FROM ${this.tableName} 
      ORDER BY ${orderBy} 
      LIMIT $1 OFFSET $2
    `;
    const result = await this.db.query(query, [limit, offset]);
    return result.rows;
  }

  async create(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(data)];
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = BaseRepository;
```

```javascript
// src/repositories/userRepository.js
const BaseRepository = require('./baseRepository');
const db = require('../config/database');

class UserRepository extends BaseRepository {
  constructor() {
    super('users', db);
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    return result.rows[0];
  }

  async findWithPhotos(userId) {
    const query = `
      SELECT u.*, 
        json_agg(
          json_build_object(
            'id', p.id,
            'filename', p.filename,
            'url', p.storage_url,
            'created_at', p.created_at
          ) ORDER BY p.created_at DESC
        ) FILTER (WHERE p.id IS NOT NULL) as photos
      FROM users u
      LEFT JOIN photos p ON p.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = new UserRepository();
```

## Express.js API Setup

### Application Setup

```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

module.exports = app;
```

### Service Layer

```javascript
// src/services/userService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class UserService {
  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);
    const user = await userRepository.create({
      ...userData,
      password_hash: passwordHash
    });

    return this.sanitizeUser(user);
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user: this.sanitizeUser(user) };
  }

  sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new UserService();
```

### Controllers

```javascript
// src/controllers/userController.js
const userService = require('../services/userService');

class UserController {
  async register(req, res, next) {
    try {
      const user = await userService.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await userService.login(req.body.email, req.body.password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
```

## Cloud Object Storage

### Supported Providers

| Provider | SDK | Best For | Region |
|----------|-----|----------|--------|
| **AWS S3** | `@aws-sdk/client-s3` | Global deployment | Worldwide |
| **Alibaba OSS** | `ali-oss` | China market, Alibaba ecosystem | China + Global |
| **Tencent COS** | `cos-nodejs-sdk-v5` | WeChat ecosystem, China | China + Global |

### Provider Selection Guide

- **Choose AWS S3** if: Global audience, existing AWS infrastructure, need advanced features
- **Choose Alibaba OSS** if: Primary market is China, using Alibaba Cloud services, need CDN integration with Alibaba
- **Choose Tencent COS** if: Building WeChat mini-program, need WeChat CDN integration, China-focused

### AWS S3 Configuration

```javascript
// src/config/storage-s3.js
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

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
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
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
  }

  generateKey(filename, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `uploads/${userId}/${timestamp}-${random}-${sanitized}`;
  }
}

module.exports = new S3StorageService();
```

### Alibaba Cloud OSS Configuration

```javascript
// src/config/storage-oss.js
const OSS = require('ali-oss');

class OSSStorageService {
  constructor() {
    this.client = new OSS({
      region: process.env.OSS_REGION, // e.g., 'oss-cn-hangzhou'
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      secure: true, // Use HTTPS
    });
  }

  async uploadFile(fileBuffer, key, mimeType, metadata = {}) {
    const result = await this.client.put(key, fileBuffer, {
      mime: mimeType,
      meta: metadata,
    });
    return result.url;
  }

  async getPresignedUrl(key, expiresIn = 3600) {
    // Generate presigned URL for temporary access
    const url = this.client.signatureUrl(key, {
      expires: expiresIn,
      method: 'GET',
    });
    return url;
  }

  async deleteFile(key) {
    await this.client.delete(key);
  }

  generateKey(filename, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `uploads/${userId}/${timestamp}-${random}-${sanitized}`;
  }
}

module.exports = new OSSStorageService();
```

### Tencent Cloud COS Configuration

```javascript
// src/config/storage-cos.js
const COS = require('cos-nodejs-sdk-v5');

class COSStorageService {
  constructor() {
    this.client = new COS({
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
    });
    this.bucket = process.env.COS_BUCKET;
    this.region = process.env.COS_REGION; // e.g., 'ap-guangzhou'
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
        if (err) reject(err);
        else resolve(`https://${this.bucket}.cos.${this.region}.myqcloud.com/${key}`);
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
        if (err) reject(err);
        else resolve(data.Url);
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
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  generateKey(filename, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `uploads/${userId}/${timestamp}-${random}-${sanitized}`;
  }
}

module.exports = new COSStorageService();
```

### Universal Storage Factory

```javascript
// src/config/storage.js
const S3StorageService = require('./storage-s3');
const OSSStorageService = require('./storage-oss');
const COSStorageService = require('./storage-cos');

class StorageFactory {
  static create(provider = process.env.STORAGE_PROVIDER) {
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
```

### File Upload Middleware

```javascript
// src/middleware/upload.js
const multer = require('multer');
const path = require('path');

// Memory storage for direct upload to object storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Max 5 files per upload
  }
});

module.exports = upload;
```

### Upload Controller

```javascript
// src/controllers/uploadController.js
const sharp = require('sharp');
const storageService = require('../config/storage');
const photoRepository = require('../repositories/photoRepository');

class UploadController {
  async uploadPhotos(req, res, next) {
    try {
      const files = req.files;
      const userId = req.user.userId;

      const uploadResults = await Promise.all(
        files.map(async (file) => {
          // Generate unique key
          const key = storageService.generateKey(file.originalname, userId);

          // Process image (optional: resize, compress)
          let buffer = file.buffer;
          let metadata = {};

          if (file.mimetype.startsWith('image/')) {
            const image = sharp(file.buffer);
            const info = await image.metadata();
            metadata = { width: info.width, height: info.height };

            // Resize if too large
            if (info.width > 2048 || info.height > 2048) {
              buffer = await image
                .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();
            }
          }

          // Upload to object storage
          const url = await storageService.uploadFile(
            buffer,
            key,
            file.mimetype,
            { userId, originalName: file.originalname }
          );

          // Save to database
          const photo = await photoRepository.create({
            user_id: userId,
            filename: path.basename(key),
            original_name: file.originalname,
            mime_type: file.mimetype,
            size_bytes: buffer.length,
            storage_key: key,
            storage_url: url,
            width: metadata.width,
            height: metadata.height,
            metadata: { originalSize: file.size }
          });

          return photo;
        })
      );

      res.status(201).json({
        success: true,
        data: uploadResults
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePhoto(req, res, next) {
    try {
      const { photoId } = req.params;
      const userId = req.user.userId;

      // Get photo info
      const photo = await photoRepository.findById(photoId);
      if (!photo || photo.user_id !== userId) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      // Delete from object storage
      await storageService.deleteFile(photo.storage_key);

      // Delete from database
      await photoRepository.delete(photoId);

      res.json({ success: true, message: 'Photo deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();
```

## Environment Variables

```bash
# .env.example
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ficc_connect
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Storage Provider: 's3' | 'oss' | 'cos'
STORAGE_PROVIDER=s3

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name

# Alibaba OSS Configuration
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET=your-bucket-name

# Tencent COS Configuration
COS_REGION=ap-guangzhou
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=your-bucket-name

# Server
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ficc_connect
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Cloud Storage Setup Guides

### AWS S3 Setup

1. Create IAM user with S3 permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```

2. Configure CORS for browser uploads:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-domain.com"],
    "MaxAgeSeconds": 3000
  }
]
```

### Alibaba OSS Setup

1. Create RAM user with OSS permissions
2. Create bucket in desired region (e.g., `oss-cn-hangzhou`)
3. Configure CORS rules in bucket settings
4. Enable CDN for global acceleration (optional)

### Tencent COS Setup

1. Create CAM user with COS permissions
2. Create bucket in desired region (e.g., `ap-guangzhou`)
3. Configure CORS and origin-pull rules
4. Enable CDN for WeChat acceleration (recommended for mini-programs)

## Package.json Dependencies

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/s3-request-presigner": "^3.450.0",
    "ali-oss": "^6.20.0",
    "cos-nodejs-sdk-v5": "^2.14.0",
    "bcrypt": "^5.1.1",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "sharp": "^0.33.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## Best Practices Checklist

- [ ] Use repository pattern for database access
- [ ] Implement proper error handling middleware
- [ ] Validate all inputs (Joi or express-validator)
- [ ] Use transactions for multi-table operations
- [ ] Implement proper indexing on frequently queried columns
- [ ] Use connection pooling for database
- [ ] Store files in object storage, not database
- [ ] Generate presigned URLs for private files
- [ ] Implement rate limiting on all endpoints
- [ ] Use environment variables for all secrets
- [ ] Implement proper logging (Winston or Pino)
- [ ] Write tests for services and controllers

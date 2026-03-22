# Stage 1: Build PWA
FROM node:20-alpine AS pwa-builder

WORKDIR /pwa

# Copy PWA package files
COPY pwa/package*.json ./

# Install dependencies
RUN npm ci

# Copy PWA source
COPY pwa/ ./

# Build PWA
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy PWA build output to public directory
COPY --from=pwa-builder /pwa/dist ./public

# Create logs directory
RUN mkdir -p logs

EXPOSE 3001

CMD ["node", "server.js"]

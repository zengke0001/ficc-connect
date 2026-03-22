# Stage 1: Build PWA
FROM node:20-alpine AS pwa-builder

WORKDIR /pwa

# Copy PWA package files
COPY pwa/package*.json ./

# Install dependencies using official registry
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config delete registry 2>/dev/null || true && \
    npm ci --registry https://registry.npmjs.org/

# Copy PWA source
COPY pwa/ ./

# Build PWA
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY backend/package*.json ./

# Install using official registry
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config delete registry 2>/dev/null || true && \
    npm ci --omit=dev --registry https://registry.npmjs.org/

# Copy backend source
COPY backend/ ./

# Copy PWA build output to public directory
COPY --from=pwa-builder /pwa/dist ./public

# Create logs directory
RUN mkdir -p logs

EXPOSE 3001

CMD ["node", "server.js"]

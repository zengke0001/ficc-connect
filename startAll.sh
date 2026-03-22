#!/bin/bash

# FICC Connect - Start All Services
# This script starts PostgreSQL in Docker and runs the backend (with PWA)

set -e

echo "====================================="
echo "  FICC Connect - Starting Services"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo "Please start Docker first"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    docker stop ficc-postgres 2>/dev/null || true
    echo -e "${GREEN}PostgreSQL stopped${NC}"
}

# Set trap to cleanup on Ctrl+C (skip if running with nohup)
if [ -t 0 ]; then
    trap cleanup SIGINT SIGTERM
fi

# Start PostgreSQL
echo ""
echo -e "${YELLOW}Starting PostgreSQL...${NC}"

# Check if postgres container exists
if docker ps -a --format '{{.Names}}' | grep -q "^ficc-postgres$"; then
    # Container exists, start it
    docker start ficc-postgres > /dev/null
    echo -e "${GREEN}PostgreSQL container started${NC}"
else
    # Create new container
    echo "Creating PostgreSQL container..."
    docker run -d \
        --name ficc-postgres \
        -e POSTGRES_DB=ficc_connect \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -p 5432:5432 \
        -v ficc_postgres_data:/var/lib/postgresql/data \
        postgres:16-alpine > /dev/null
    echo -e "${GREEN}PostgreSQL container created and started${NC}"

    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
fi

# Wait for PostgreSQL to accept connections
echo "Checking PostgreSQL connection..."
until docker exec ficc-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}PostgreSQL is ready!${NC}"

# Initialize database if tables don't exist
echo ""
echo -e "${YELLOW}Checking database schema...${NC}"
if ! docker exec ficc-postgres psql -U postgres -d ficc_connect -c "SELECT 1 FROM users LIMIT 1" > /dev/null 2>&1; then
    echo "Database not initialized. Running schema migration..."
    docker cp backend/migrations/000_full_schema.sql ficc-postgres:/tmp/
    docker exec ficc-postgres psql -U postgres -d ficc_connect -f /tmp/000_full_schema.sql > /dev/null
    echo -e "${GREEN}Database initialized successfully!${NC}"
else
    echo -e "${GREEN}Database already initialized${NC}"
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

# Check if PWA dependencies are installed and build it
if [ ! -d "pwa/node_modules" ]; then
    echo ""
    echo -e "${YELLOW}Installing PWA dependencies...${NC}"
    cd pwa && npm install && cd ..
fi

# Build PWA
echo ""
echo -e "${YELLOW}Building PWA...${NC}"
cd pwa && npm run build && cd ..
echo -e "${GREEN}PWA build complete${NC}"

# Copy PWA build to backend public directory
echo "Copying PWA build to backend..."
mkdir -p backend/public
cp -r pwa/dist/* backend/public/
echo -e "${GREEN}PWA copied to backend/public${NC}"

# Start backend
echo ""
echo -e "${YELLOW}Starting backend server...${NC}"
echo ""
echo "====================================="
echo "  Services Started Successfully!"
echo "====================================="
echo ""
echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
echo -e "${GREEN}Backend API:${NC} http://localhost:3001/api"
echo -e "${GREEN}PWA App:${NC}   http://localhost:3001/ficc-connect/"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Run backend
cd backend && npm start

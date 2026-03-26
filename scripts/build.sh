#!/bin/bash

# FICC Connect - Build Script (Linux only)
# Usage: ./build.sh [options]
#
# Options:
#   -p, --production    Production build (default)
#   -d, --development    Development build
#   -c, --clean          Clean before build
#   --skip-install      Skip npm install

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_MODE="production"
CLEAN=false
SKIP_INSTALL=false

cd "$APP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
for arg in "$@"; do
    case $arg in
        -p|--production)
            BUILD_MODE="production"
            shift
            ;;
        -d|--development)
            BUILD_MODE="development"
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        -h|--help)
            echo "FICC Connect - Build Script (Linux only)"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -p, --production    Production build (default)"
            echo "  -d, --development  Development build"
            echo "  -c, --clean         Clean before building"
            echo "  --skip-install      Skip npm install"
            echo "  -h, --help          Show this help"
            exit 0
            ;;
    esac
done

echo "====================================="
echo "  FICC Connect - Build Script"
echo "====================================="
echo ""
echo "Platform: Linux"
echo "Mode: $BUILD_MODE"
echo ""

# Check platform
if [ "$(uname)" != "Linux" ]; then
    echo -e "${RED}Error: This build script is only for Linux${NC}"
    echo "Please use appropriate build tools for your platform."
    exit 1
fi

# Clean if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}Cleaning build artifacts...${NC}"
    cd "$APP_DIR/pwa"
    rm -rf dist node_modules/.vite 2>/dev/null || true
    cd "$APP_DIR/backend"
    rm -rf public 2>/dev/null || true
    echo -e "${GREEN}Clean complete${NC}"
    echo ""
fi

# Install dependencies
if [ "$SKIP_INSTALL" = false ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    echo ""

    # Backend dependencies
    echo -e "${BLUE}Backend:${NC}"
    cd "$APP_DIR/backend"
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo "  Dependencies already installed (use --skip-install to skip)"
    fi
    echo ""

    # PWA dependencies
    echo -e "${BLUE}PWA:${NC}"
    cd "$APP_DIR/pwa"
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo "  Dependencies already installed (use --skip-install to skip)"
    fi
    echo ""
else
    echo -e "${YELLOW}Skipping dependency installation${NC}"
    echo ""
fi

# Build PWA
echo -e "${YELLOW}Building PWA...${NC}"
cd "$APP_DIR/pwa"

if [ "$BUILD_MODE" = "production" ]; then
    echo "  Mode: Production"
    npm run build
else
    echo "  Mode: Development"
    npm run build -- --mode development
fi

echo ""
echo -e "${GREEN}====================================="
echo "  Build Complete!"
echo -e "=====================================${NC}"
echo ""
echo "Build output: $APP_DIR/backend/public"
echo ""
echo "To serve the app:"
echo "  cd backend && npm start"
echo ""
echo "Or start as service:"
echo "  ./scripts/start.sh -d"

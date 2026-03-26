#!/bin/bash

# FICC Connect - Status Script
# Usage: ./status.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="ficc-connect.service"
DB_PATH="$APP_DIR/backend/data/ficc_connect.db"

cd "$APP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "====================================="
echo "  FICC Connect - Service Status"
echo "====================================="
echo ""

# Systemd service status
echo -e "${BLUE}Systemd Service:${NC}"
if sudo systemctl is-active --quiet $SERVICE_NAME 2>/dev/null; then
    echo -e "${GREEN}● $SERVICE_NAME is running${NC}"
    echo ""
    sudo systemctl status $SERVICE_NAME --no-pager 2>/dev/null || true
else
    echo -e "${RED}○ $SERVICE_NAME is not running${NC}"
    echo ""
    # Check if service exists
    if sudo systemctl is-enabled --quiet $SERVICE_NAME 2>/dev/null; then
        echo "Service is installed but not active"
    else
        echo "Service is not installed"
    fi
fi

echo ""
echo -e "${BLUE}SQLite Database:${NC}"
if [ -f "$DB_PATH" ]; then
    echo -e "${GREEN}● Database exists${NC} ($DB_PATH)"
    echo "  Size: $(du -h "$DB_PATH" 2>/dev/null | cut -f1)"
else
    echo -e "${YELLOW}○ Database not initialized${NC}"
fi

echo ""
echo -e "${BLUE}Process Info:${NC}"
if pgrep -f "node.*server.js" > /dev/null 2>&1; then
    echo -e "${GREEN}● Backend process running${NC}"
    pgrep -f "node.*server.js" | xargs ps -p 2>/dev/null | tail -n +2 || true
else
    echo -e "${YELLOW}○ No backend process found${NC}"
fi

echo ""
echo "====================================="

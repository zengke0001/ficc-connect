#!/bin/bash

# FICC Connect - Restart Script
# Usage: ./restart.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="ficc-connect.service"

cd "$APP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Restarting $SERVICE_NAME...${NC}"
echo ""

# Rebuild PWA
echo ""
echo -e "${YELLOW}Rebuilding PWA...${NC}"
cd "$APP_DIR/pwa" && npm run build
echo -e "${GREEN}PWA rebuilt${NC}"

# Start service
echo ""
echo "Starting service..."
sudo systemctl start $SERVICE_NAME

sleep 2

if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo ""
    echo -e "${GREEN}====================================="
    echo "  Service Restarted Successfully!"
    echo -e "=====================================${NC}"
    echo ""
    echo -e "${GREEN}Backend API:${NC} http://localhost:3001/api"
    echo -e "${GREEN}PWA App:${NC}   http://localhost:3001/ficc-connect/"
else
    echo -e "${RED}Failed to restart service. Check logs with:${NC}"
    echo "  sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

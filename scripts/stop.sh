#!/bin/bash

# FICC Connect - Stop Script
# Usage: ./stop.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="ficc-connect.service"

cd "$APP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping $SERVICE_NAME...${NC}"

# Stop systemd service
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

echo -e "${GREEN}Service stopped${NC}"

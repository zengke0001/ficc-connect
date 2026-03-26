#!/bin/bash

# FICC Connect - Uninstall Script
# Usage: ./uninstall.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="ficc-connect.service"
INSTALL_DIR="/opt/ficc-connect"

cd "$APP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "====================================="
echo "  FICC Connect - Uninstall"
echo "====================================="
echo ""

# Ensure sudo
if ! sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}Sudo access required. Please enter your password:${NC}"
fi
sudo -v || exit 1

# Stop service if running
if sudo systemctl is-active --quiet $SERVICE_NAME 2>/dev/null; then
    echo -e "${YELLOW}Stopping service...${NC}"
    sudo systemctl stop $SERVICE_NAME
fi

# Disable service
echo -e "${YELLOW}Disabling service...${NC}"
sudo systemctl disable $SERVICE_NAME 2>/dev/null || true

# Remove service file
echo -e "${YELLOW}Removing service file...${NC}"
sudo rm -f /etc/systemd/system/$SERVICE_NAME
sudo systemctl daemon-reload

# Ask about removing installation directory
echo ""
echo -e "${YELLOW}Installation directory: $INSTALL_DIR${NC}"
read -p "Remove installation directory? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "$INSTALL_DIR" ]; then
        echo "Removing installation directory..."
        sudo rm -rf "$INSTALL_DIR"
        echo -e "${GREEN}Installation directory removed${NC}"
    else
        echo -e "${YELLOW}Installation directory not found${NC}"
    fi
fi

# Ask about removing local files (if not in install dir)
if [ "$APP_DIR" != "$INSTALL_DIR" ]; then
    read -p "Remove local files in $APP_DIR? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing local build files..."
        rm -rf "$APP_DIR/backend/public" 2>/dev/null || true
        rm -rf "$APP_DIR/pwa/dist" 2>/dev/null || true
        rm -rf "$APP_DIR/backend/data" 2>/dev/null || true
        rm -rf "$APP_DIR/backend/logs" 2>/dev/null || true
        echo -e "${GREEN}Local files removed${NC}"
    fi
fi

echo ""
echo -e "${GREEN}====================================="
echo "  Uninstall Complete!"
echo -e "=====================================${NC}"

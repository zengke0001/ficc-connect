#!/bin/bash

# FICC Connect - Install Service Script
# Usage: ./install_service.sh
# Requires sudo - copies files to /opt/ficc-connect and sets up systemd service

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
BLUE='\033[0;34m'
NC='\033[0m'

echo "====================================="
echo "  FICC Connect - Install Service"
echo "====================================="
echo ""

# Ensure sudo
if ! sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}Sudo access required. Please enter your password:${NC}"
fi
sudo -v || exit 1

echo -e "${YELLOW}Installing to $INSTALL_DIR...${NC}"

# Create installation directory
sudo mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR/backend/logs"
sudo mkdir -p "$INSTALL_DIR/backend/data"

# Check for .env file
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo -e "${YELLOW}Warning: backend/.env file not found.${NC}"
    if [ -f "$APP_DIR/backend/.env.example" ]; then
        echo "Copying .env.example to .env..."
        cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
        echo -e "${YELLOW}Please edit $INSTALL_DIR/backend/.env with your configuration${NC}"
    fi
fi

# Copy application files
echo "Copying files..."
sudo cp -r "$APP_DIR/backend" "$INSTALL_DIR/"
sudo cp -r "$APP_DIR/pwa" "$INSTALL_DIR/"
sudo cp -r "$APP_DIR/scripts" "$INSTALL_DIR/" 2>/dev/null || true
sudo cp -r "$APP_DIR/.qoder" "$INSTALL_DIR/" 2>/dev/null || true

# Copy service file
sudo cp "$APP_DIR/deploy/$SERVICE_NAME" /etc/systemd/system/

# Set permissions
sudo chown -R root:root "$INSTALL_DIR" 2>/dev/null || true
sudo chmod 600 "$INSTALL_DIR/backend/.env" 2>/dev/null || true

# Reload and enable
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

echo ""
echo -e "${GREEN}====================================="
echo "  Service Installed Successfully!"
echo -e "=====================================${NC}"
echo ""
echo "Start the service with:"
echo "  ./scripts/start.sh -d"

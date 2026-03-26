#!/bin/bash

# FICC Connect - Start Script
# Usage: ./start.sh [options]
#
# Options:
#   -d, --daemon    Run as systemd daemon service (requires sudo)
#   -f, --foreground  Run in foreground (default for development)

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

DAEMON_MODE=false

for arg in "$@"; do
    case $arg in
        -d|--daemon)
            DAEMON_MODE=true
            shift
            ;;
        -f|--foreground)
            DAEMON_MODE=false
            shift
            ;;
    esac
done

# Ensure sudo for daemon mode
ensure_sudo() {
    if ! sudo -n true 2>/dev/null; then
        echo -e "${YELLOW}Sudo access required. Please enter your password:${NC}"
    fi
    sudo -v || exit 1
}

# Initialize SQLite database
init_database() {
    echo -e "${YELLOW}Initializing SQLite database...${NC}"
    mkdir -p "$APP_DIR/backend/data"
    mkdir -p "$APP_DIR/backend/logs"
    
    cd "$APP_DIR/backend" || exit 1
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        npm install
    fi
    node migrations/run.js
    echo -e "${GREEN}Database initialized${NC}"
    cd "$APP_DIR" || exit 1
}

# Install dependencies and build
prepare_app() {
    # Backend dependencies
    if [ ! -d "$APP_DIR/backend/node_modules" ]; then
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        cd "$APP_DIR/backend" && npm install && cd ..
    fi

    # PWA dependencies and build
    if [ ! -d "$APP_DIR/pwa/node_modules" ]; then
        echo -e "${YELLOW}Installing PWA dependencies...${NC}"
        cd "$APP_DIR/pwa" && npm install && cd ..
    fi

    echo -e "${YELLOW}Building PWA...${NC}"
    cd "$APP_DIR/pwa" && npm run build && cd ..
    echo -e "${GREEN}PWA build complete${NC}"
}

# Start as daemon
start_daemon() {
    ensure_sudo
    
    echo -e "${YELLOW}Starting $SERVICE_NAME...${NC}"
    sudo systemctl start $SERVICE_NAME

    sleep 2

    if sudo systemctl is-active --quiet $SERVICE_NAME; then
        echo ""
        echo "====================================="
        echo -e "${GREEN}  Service Started Successfully!${NC}"
        echo "====================================="
        echo ""
        echo -e "${GREEN}Backend API:${NC} http://localhost:3001/api"
        echo -e "${GREEN}PWA App:${NC}   http://localhost:3001/ficc-connect/"
        echo ""
        echo "Service commands:"
        echo "  ./scripts/status.sh    - Check status"
        echo "  ./scripts/stop.sh     - Stop service"
        echo "  ./scripts/restart.sh  - Restart service"
        echo "  ./scripts/logs.sh     - View logs"
    else
        echo -e "${RED}Failed to start service. Check logs with:${NC}"
        echo "  sudo journalctl -u $SERVICE_NAME -n 50"
        exit 1
    fi
}

# Run in foreground
run_foreground() {
    echo "====================================="
    echo "  FICC Connect - Starting Services"
    echo "====================================="
    echo ""

    init_database
    prepare_app

    echo ""
    echo -e "${YELLOW}Starting backend server...${NC}"
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""

    cd "$APP_DIR/backend" && npm start
}

# Main
if [ "$DAEMON_MODE" = true ]; then
    start_daemon
else
    run_foreground
fi

#!/bin/bash

# FICC Connect - Start All Services (Linux/macOS)
# This script starts the backend with SQLite (no Docker/PostgreSQL required)
# Uses sql.js for in-browser/database file storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ficc-connect"
SERVICE_NAME="ficc-connect.service"
INSTALL_DIR="/opt/ficc-connect"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
DAEMON_MODE=false
STOP_MODE=false
STATUS_MODE=false
RESTART_MODE=false
UNINSTALL_MODE=false
LOGS_MODE=false

for arg in "$@"; do
    case $arg in
        -d|--daemon)
            DAEMON_MODE=true
            shift
            ;;
        -s|--stop)
            STOP_MODE=true
            shift
            ;;
        -t|--status)
            STATUS_MODE=true
            shift
            ;;
        -r|--restart)
            RESTART_MODE=true
            shift
            ;;
        -u|--uninstall)
            UNINSTALL_MODE=true
            shift
            ;;
        -l|--logs)
            LOGS_MODE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -d, --daemon     Run as systemd daemon service (requires sudo)"
            echo "  -s, --stop       Stop the daemon service"
            echo "  -r, --restart    Restart the daemon service"
            echo "  -t, --status     Check service status"
            echo "  -l, --logs       View service logs (follow mode)"
            echo "  -u, --uninstall  Uninstall the daemon service"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Without options, runs in foreground mode (development)"
            exit 0
            ;;
    esac
done

# Function to check sudo and prompt for password if needed
ensure_sudo() {
    if ! sudo -n true 2>/dev/null; then
        echo -e "${YELLOW}Sudo access required. Please enter your password:${NC}"
    fi
    sudo -v || exit 1
}

# Function to ensure SQLite database is initialized
init_sqlite_database() {
    echo -e "${YELLOW}Initializing SQLite database...${NC}"
    
    # Ensure data directory exists
    mkdir -p "$SCRIPT_DIR/backend/data"
    
    # Run migrations
    cd "$SCRIPT_DIR/backend"
    if [ -f "node_modules/sql.js/dist/sql-wasm.wasm" ]; then
        echo -e "${GREEN}SQLite database ready${NC}"
    else
        echo -e "${YELLOW}Installing backend dependencies first...${NC}"
        npm install
    fi
    
    node migrations/run.js
    echo -e "${GREEN}SQLite database initialized!${NC}"
}

# Function to install dependencies and build
prepare_app() {
    # Check if backend dependencies are installed
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        cd backend && npm install && cd ..
    fi

    # Check if PWA dependencies are installed
    if [ ! -d "pwa/node_modules" ]; then
        echo -e "${YELLOW}Installing PWA dependencies...${NC}"
        cd pwa && npm install && cd ..
    fi

    # Build PWA (outputs to backend/public)
    echo -e "${YELLOW}Building PWA...${NC}"
    cd pwa && npm run build && cd ..
    echo -e "${GREEN}PWA build complete${NC}"
}

# Function to install the systemd service
install_service() {
    ensure_sudo

    echo -e "${YELLOW}Installing systemd service...${NC}"

    # Create installation directory
    sudo mkdir -p "$INSTALL_DIR"
    sudo mkdir -p "$INSTALL_DIR/backend/logs"
    sudo mkdir -p "$INSTALL_DIR/backend/data"

    # Check for .env file
    if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
        echo -e "${YELLOW}Warning: backend/.env file not found.${NC}"
        if [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
            echo "Copying .env.example to .env..."
            cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
            echo -e "${YELLOW}Please edit $INSTALL_DIR/backend/.env with your configuration${NC}"
        else
            echo -e "${RED}Error: No .env or .env.example found. Please create backend/.env manually.${NC}"
            exit 1
        fi
    fi

    # Copy application files
    echo "Copying application files to $INSTALL_DIR..."
    sudo cp -r "$SCRIPT_DIR/backend" "$INSTALL_DIR/"
    sudo cp -r "$SCRIPT_DIR/pwa" "$INSTALL_DIR/"
    sudo cp -r "$SCRIPT_DIR/.qoder" "$INSTALL_DIR/" 2>/dev/null || true

    # Copy service file
    sudo cp "$SCRIPT_DIR/deploy/$SERVICE_NAME" /etc/systemd/system/

    # Set proper permissions
    sudo chown -R root:root "$INSTALL_DIR"
    sudo chmod 600 "$INSTALL_DIR/backend/.env"

    # Reload systemd
    sudo systemctl daemon-reload

    # Enable the service
    sudo systemctl enable $SERVICE_NAME

    echo -e "${GREEN}Service installed successfully!${NC}"
}

# Function to start the daemon service
start_daemon() {
    init_sqlite_database
    prepare_app
    install_service

    echo -e "${YELLOW}Starting $APP_NAME service...${NC}"
    sudo systemctl start $SERVICE_NAME

    sleep 2

    if sudo systemctl is-active --quiet $SERVICE_NAME; then
        echo ""
        echo "====================================="
        echo -e "${GREEN}  Services Started Successfully!${NC}"
        echo "====================================="
        echo ""
        echo -e "${GREEN}Database:${NC}    SQLite (${SCRIPT_DIR}/backend/data/ficc_connect.db)"
        echo -e "${GREEN}Backend API:${NC} http://localhost:3001/api"
        echo -e "${GREEN}PWA App:${NC}   http://localhost:3001/ficc-connect/"
        echo ""
        echo -e "${BLUE}Service Management:${NC}"
        echo "  Status:   sudo systemctl status $SERVICE_NAME"
        echo "  Stop:     sudo systemctl stop $SERVICE_NAME"
        echo "  Restart:  sudo systemctl restart $SERVICE_NAME"
        echo "  Logs:     sudo journalctl -u $SERVICE_NAME -f"
        echo ""
    else
        echo -e "${RED}Failed to start service. Check logs:${NC}"
        echo "  sudo journalctl -u $SERVICE_NAME -n 50"
        exit 1
    fi
}

# Function to stop the daemon service
stop_daemon() {
    ensure_sudo

    echo -e "${YELLOW}Stopping $APP_NAME service...${NC}"
    sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

    echo -e "${GREEN}Service stopped${NC}"
}

# Function to restart the daemon service
restart_daemon() {
    ensure_sudo

    echo -e "${YELLOW}Restarting $APP_NAME service...${NC}"

    # Rebuild and reinstall
    prepare_app
    sudo cp -r "$SCRIPT_DIR/backend" "$INSTALL_DIR/"

    sudo systemctl restart $SERVICE_NAME

    sleep 2

    if sudo systemctl is-active --quiet $SERVICE_NAME; then
        echo -e "${GREEN}Service restarted successfully!${NC}"
    else
        echo -e "${RED}Failed to restart service. Check logs:${NC}"
        echo "  sudo journalctl -u $SERVICE_NAME -n 50"
        exit 1
    fi
}

# Function to show service status
show_status() {
    echo -e "${YELLOW}Service Status:${NC}"
    sudo systemctl status $SERVICE_NAME --no-pager 2>/dev/null || echo -e "${RED}Service not installed${NC}"

    echo ""
    echo -e "${YELLOW}SQLite Database:${NC}"
    if [ -f "$SCRIPT_DIR/backend/data/ficc_connect.db" ]; then
        echo -e "${GREEN}Database file exists${NC}"
    else
        echo -e "${YELLOW}Database not initialized yet${NC}"
    fi
}

# Function to view logs
view_logs() {
    echo -e "${YELLOW}Showing logs (press Ctrl+C to exit)...${NC}"
    sudo journalctl -u $SERVICE_NAME -f
}

# Function to uninstall the service
uninstall_service() {
    ensure_sudo

    echo -e "${YELLOW}Uninstalling $APP_NAME service...${NC}"

    # Stop the service
    sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

    # Disable the service
    sudo systemctl disable $SERVICE_NAME 2>/dev/null || true

    # Remove service file
    sudo rm -f /etc/systemd/system/$SERVICE_NAME

    # Reload systemd
    sudo systemctl daemon-reload

    # Ask before removing installation directory
    read -p "Remove installation directory $INSTALL_DIR? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo rm -rf "$INSTALL_DIR"
        echo -e "${GREEN}Installation directory removed${NC}"
    fi

    echo -e "${GREEN}Service uninstalled successfully!${NC}"
}

# Function to run in foreground (development mode)
run_foreground() {
    echo "====================================="
    echo "  FICC Connect - Starting Services"
    echo "====================================="
    echo ""
    echo "Using SQLite database (no Docker required)"
    echo ""

    # Function to cleanup on exit
    cleanup() {
        echo ""
        echo -e "${YELLOW}Shutting down services...${NC}"
        echo -e "${GREEN}Done${NC}"
    }

    # Set trap to cleanup on Ctrl+C (skip if running with nohup)
    if [ -t 0 ]; then
        trap cleanup SIGINT SIGTERM
    fi

    init_sqlite_database
    prepare_app

    echo ""
    echo -e "${YELLOW}Starting backend server...${NC}"
    echo ""
    echo "====================================="
    echo "  Services Started Successfully!"
    echo "====================================="
    echo ""
    echo -e "${GREEN}Database:${NC}    SQLite (${SCRIPT_DIR}/backend/data/ficc_connect.db)"
    echo -e "${GREEN}Backend API:${NC} http://localhost:3001/api"
    echo -e "${GREEN}PWA App:${NC}   http://localhost:3001/ficc-connect/"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    # Run backend
    cd backend && npm start
}

# Main execution
if [ "$STOP_MODE" = true ]; then
    stop_daemon
elif [ "$STATUS_MODE" = true ]; then
    show_status
elif [ "$RESTART_MODE" = true ]; then
    restart_daemon
elif [ "$LOGS_MODE" = true ]; then
    view_logs
elif [ "$UNINSTALL_MODE" = true ]; then
    uninstall_service
elif [ "$DAEMON_MODE" = true ]; then
    start_daemon
else
    run_foreground
fi

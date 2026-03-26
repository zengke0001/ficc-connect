#!/bin/bash

# FICC Connect - Logs Script
# Usage: ./logs.sh [options]
#
# Options:
#   -n NUM    Show last NUM lines (default: 50)
#   -f        Follow logs (tail -f, default)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="ficc-connect.service"

cd "$APP_DIR"

LINES=50
FOLLOW=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -n)
            LINES="$2"
            shift 2
            ;;
        -n*)
            LINES="${1#*-n}"
            shift
            ;;
        --no-follow)
            FOLLOW=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -n NUM      Show last NUM lines (default: 50)"
            echo "  --no-follow Don't follow logs (exit after showing)"
            echo "  -h, --help  Show this help"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Colors
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Showing logs for $SERVICE_NAME (last $LINES lines)...${NC}"
echo "Press Ctrl+C to exit"
echo ""

if [ "$FOLLOW" = true ]; then
    sudo journalctl -u $SERVICE_NAME -f -n "$LINES"
else
    sudo journalctl -u $SERVICE_NAME -n "$LINES"
fi

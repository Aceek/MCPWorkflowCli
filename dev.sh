#!/bin/bash

# =============================================================================
# MCP Workflow Tracker - Development Launcher
# =============================================================================
# Usage:
#   ./dev.sh          - Interactive launcher
#   ./dev.sh start    - Start all services
#   ./dev.sh stop     - Stop all services
#   ./dev.sh logs     - Show logs (interactive selection)
#   ./dev.sh status   - Show status of all services
#   ./dev.sh db:reset - Reset SQLite database
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Ports
PORT_WEBUI=3001
PORT_WEBSOCKET=3002

# Database (SQLite)
DB_PATH="$PROJECT_ROOT/packages/shared/prisma/mcp-tracker.db"
export DATABASE_URL="file:$DB_PATH"

# PID files directory
PID_DIR="$HOME/.mcp-tracker"
PID_MCP="$PID_DIR/mcp-server.pid"
PID_WEBUI="$PID_DIR/web-ui.pid"
LOG_DIR="$PID_DIR/logs"
LOG_MCP="$LOG_DIR/mcp-server.log"
LOG_WEBUI="$LOG_DIR/web-ui.log"

# =============================================================================
# Utility Functions
# =============================================================================

print_header() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}MCP Workflow Tracker${NC} - Development Environment           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}Database: SQLite (standalone)${NC}                             ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "ok" ]; then
        echo -e "  ${GREEN}✓${NC} $message"
    elif [ "$status" = "warn" ]; then
        echo -e "  ${YELLOW}⚠${NC} $message"
    elif [ "$status" = "error" ]; then
        echo -e "  ${RED}✗${NC} $message"
    elif [ "$status" = "info" ]; then
        echo -e "  ${BLUE}ℹ${NC} $message"
    fi
}

print_section() {
    echo -e "\n${BOLD}$1${NC}"
    echo -e "${BLUE}─────────────────────────────────────────${NC}"
}

confirm() {
    local message=$1
    echo -en "  ${YELLOW}?${NC} $message [y/N] "
    read -r response
    [[ "$response" =~ ^[Yy]$ ]]
}

ensure_dirs() {
    mkdir -p "$PID_DIR" "$LOG_DIR"
}

# =============================================================================
# Database Functions
# =============================================================================

check_db() {
    if [ -f "$DB_PATH" ]; then
        local size=$(du -h "$DB_PATH" | cut -f1)
        print_status "ok" "SQLite database exists ($size)"
        return 0
    else
        print_status "warn" "SQLite database not found"
        return 1
    fi
}

init_db() {
    print_section "Initializing Database"

    cd "$PROJECT_ROOT/packages/shared"

    if [ -f "$DB_PATH" ]; then
        print_status "info" "Database already exists"
        return 0
    fi

    print_status "info" "Creating SQLite database..."
    pnpm exec prisma db push --skip-generate

    if [ -f "$DB_PATH" ]; then
        print_status "ok" "Database created successfully"
        return 0
    else
        print_status "error" "Failed to create database"
        return 1
    fi
}

reset_db() {
    print_section "Resetting Database"

    if [ -f "$DB_PATH" ]; then
        if confirm "This will delete all data. Continue?"; then
            rm -f "$DB_PATH"
            print_status "ok" "Database deleted"
            init_db
        else
            print_status "info" "Cancelled"
        fi
    else
        print_status "info" "No database to reset"
        init_db
    fi
}

# =============================================================================
# Check Functions
# =============================================================================

check_port() {
    local port=$1
    local name=$2

    if lsof -i:$port &>/dev/null; then
        local pid=$(lsof -ti:$port 2>/dev/null | head -1)
        local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        print_status "warn" "$name: Port $port is in use by $process (PID: $pid)"
        return 1
    else
        print_status "ok" "$name: Port $port is available"
        return 0
    fi
}

is_service_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" &>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# =============================================================================
# Service Management
# =============================================================================

kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

start_mcp_server() {
    print_section "Starting MCP Server"

    # Ensure database exists
    if ! check_db; then
        init_db || return 1
    fi

    # Check if already running
    if is_service_running "$PID_MCP"; then
        print_status "info" "MCP Server is already running (PID: $(cat $PID_MCP))"
        return 0
    fi

    # Note: WebSocket port auto-increments if busy (3002-3011)
    print_status "info" "Starting MCP Server..."

    cd "$PROJECT_ROOT"
    DATABASE_URL="$DATABASE_URL" nohup pnpm dev:mcp > "$LOG_MCP" 2>&1 &
    local pid=$!
    echo $pid > "$PID_MCP"

    # Wait for server to be ready
    sleep 2

    # Check if process is still running
    if ps -p "$pid" &>/dev/null; then
        # Find which port it's using
        local ws_port=$(lsof -p $pid -i -P 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
        if [ -n "$ws_port" ]; then
            print_status "ok" "MCP Server started (PID: $pid)"
            print_status "info" "  - stdio: MCP protocol"
            print_status "info" "  - WebSocket: port $ws_port"
        else
            print_status "ok" "MCP Server started (PID: $pid)"
            print_status "info" "  - stdio: MCP protocol"
            print_status "warn" "  - WebSocket: port detection failed (check logs)"
        fi
        return 0
    else
        print_status "error" "MCP Server failed to start"
        print_status "info" "Check logs: $LOG_MCP"
        return 1
    fi
}

start_webui() {
    print_section "Starting Web UI"

    # Check if already running
    if is_service_running "$PID_WEBUI"; then
        print_status "info" "Web UI is already running (PID: $(cat $PID_WEBUI))"
        return 0
    fi

    # Check port
    if ! check_port $PORT_WEBUI "Web UI"; then
        if confirm "Kill existing process on port $PORT_WEBUI?"; then
            kill_port $PORT_WEBUI
            print_status "ok" "Port $PORT_WEBUI freed"
        else
            print_status "error" "Cannot start Web UI - port in use"
            return 1
        fi
    fi

    print_status "info" "Starting Web UI..."

    cd "$PROJECT_ROOT"
    DATABASE_URL="$DATABASE_URL" nohup pnpm dev:ui > "$LOG_WEBUI" 2>&1 &
    local pid=$!
    echo $pid > "$PID_WEBUI"

    # Wait for server to be ready
    sleep 3
    if lsof -i:$PORT_WEBUI &>/dev/null; then
        print_status "ok" "Web UI started (PID: $pid)"
        print_status "info" "  - URL: http://localhost:$PORT_WEBUI"
        return 0
    else
        print_status "error" "Web UI failed to start"
        print_status "info" "Check logs: $LOG_WEBUI"
        return 1
    fi
}

stop_service() {
    local name=$1
    local pid_file=$2
    local port=$3

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" &>/dev/null; then
            kill "$pid" 2>/dev/null || true
            print_status "ok" "$name stopped (PID: $pid)"
        fi
        rm -f "$pid_file"
    fi

    # Also kill any remaining process on the port
    if [ -n "$port" ]; then
        kill_port $port
    fi
}

stop_all() {
    print_section "Stopping Services"

    stop_service "MCP Server" "$PID_MCP" $PORT_WEBSOCKET
    stop_service "Web UI" "$PID_WEBUI" $PORT_WEBUI

    print_status "ok" "All services stopped"
}

# =============================================================================
# Status & Logs
# =============================================================================

show_status() {
    print_section "Service Status"

    # Database
    check_db

    # MCP Server
    if is_service_running "$PID_MCP"; then
        local pid=$(cat $PID_MCP)
        local ws_port=$(lsof -p $pid -i -P 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
        print_status "ok" "MCP Server is running (PID: $pid, WebSocket: ${ws_port:-unknown})"
    elif lsof -i:$PORT_WEBSOCKET &>/dev/null; then
        print_status "warn" "Something is running on port $PORT_WEBSOCKET (not managed by this script)"
    else
        print_status "error" "MCP Server is not running"
    fi

    # Web UI
    if is_service_running "$PID_WEBUI"; then
        print_status "ok" "Web UI is running (PID: $(cat $PID_WEBUI))"
    elif lsof -i:$PORT_WEBUI &>/dev/null; then
        print_status "warn" "Something is running on port $PORT_WEBUI (not managed by this script)"
    else
        print_status "error" "Web UI is not running"
    fi

    echo ""
}

show_logs() {
    echo -e "\n${BOLD}Select logs to view:${NC}"
    echo "  1) MCP Server"
    echo "  2) Web UI"
    echo "  3) Both (split view with tail)"
    echo "  4) Back"
    echo ""
    echo -n "  Choice [1-4]: "
    read -r choice

    case $choice in
        1)
            if [ -f "$LOG_MCP" ]; then
                echo -e "\n${CYAN}=== MCP Server Logs ===${NC}\n"
                tail -f "$LOG_MCP"
            else
                print_status "error" "No MCP Server logs found"
            fi
            ;;
        2)
            if [ -f "$LOG_WEBUI" ]; then
                echo -e "\n${CYAN}=== Web UI Logs ===${NC}\n"
                tail -f "$LOG_WEBUI"
            else
                print_status "error" "No Web UI logs found"
            fi
            ;;
        3)
            echo -e "\n${CYAN}=== Combined Logs (Ctrl+C to exit) ===${NC}\n"
            tail -f "$LOG_MCP" "$LOG_WEBUI" 2>/dev/null || print_status "error" "No logs found"
            ;;
        4)
            return
            ;;
        *)
            print_status "error" "Invalid choice"
            ;;
    esac
}

# =============================================================================
# Main Menu
# =============================================================================

show_menu() {
    echo -e "\n${BOLD}What would you like to do?${NC}"
    echo "  1) Start all services"
    echo "  2) Stop all services"
    echo "  3) Restart all services"
    echo "  4) Show status"
    echo "  5) View logs"
    echo "  6) Open Web UI in browser"
    echo "  7) Reset database"
    echo "  8) Exit"
    echo ""
    echo -n "  Choice [1-8]: "
    read -r choice

    case $choice in
        1) start_all ;;
        2) stop_all ;;
        3) stop_all && sleep 1 && start_all ;;
        4) show_status ;;
        5) show_logs ;;
        6)
            if command -v xdg-open &> /dev/null; then
                xdg-open "http://localhost:$PORT_WEBUI" &>/dev/null &
            elif command -v open &> /dev/null; then
                open "http://localhost:$PORT_WEBUI"
            else
                print_status "info" "Open http://localhost:$PORT_WEBUI in your browser"
            fi
            ;;
        7) reset_db ;;
        8)
            echo -e "\n${GREEN}Goodbye!${NC}\n"
            exit 0
            ;;
        *)
            print_status "error" "Invalid choice"
            ;;
    esac
}

start_all() {
    ensure_dirs

    # Ensure database exists
    if ! check_db; then
        init_db || return 1
    fi

    start_mcp_server || return 1
    start_webui || return 1

    print_section "All Services Started"
    print_status "ok" "SQLite Database: $DB_PATH"
    print_status "ok" "MCP Server: running (WebSocket auto-assigned)"
    print_status "ok" "Web UI: http://localhost:$PORT_WEBUI"
    echo ""
    print_status "info" "Use './dev.sh logs' to view logs"
    print_status "info" "Use './dev.sh stop' to stop all services"
}

# =============================================================================
# Entry Point
# =============================================================================

main() {
    print_header
    ensure_dirs

    case "${1:-}" in
        start)
            start_all
            ;;
        stop)
            stop_all
            ;;
        restart)
            stop_all
            sleep 1
            start_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        db:reset)
            reset_db
            ;;
        db:init)
            init_db
            ;;
        *)
            # Interactive mode
            show_status
            while true; do
                show_menu
            done
            ;;
    esac
}

main "$@"

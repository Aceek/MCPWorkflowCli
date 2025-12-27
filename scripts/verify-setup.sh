#!/bin/bash
# Mission Control - Setup Verification Script
# Comprehensive diagnostic for troubleshooting setup issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$PROJECT_DIR/packages/shared"
MCP_SERVER_DIR="$PROJECT_DIR/packages/mcp-server"
DB_PATH="$SHARED_DIR/prisma/mcp-tracker.db"
MCP_CONFIG="$PROJECT_DIR/.mcp.json"
SYMLINK_DOCS="$HOME/.claude/docs/mission-system"
SYMLINK_AGENT="$HOME/.claude/agents/mission-architect.md"

# Counters
ERRORS=0
WARNINGS=0

# Parse arguments
VERBOSE=false
FIX=false
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose) VERBOSE=true; shift ;;
    --fix) FIX=true; shift ;;
    -h|--help)
      echo "Mission Control - Setup Verification"
      echo ""
      echo "Usage: ./verify-setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -v, --verbose   Show detailed output"
      echo "  --fix           Attempt to fix issues automatically"
      echo "  -h, --help      Show this help"
      echo ""
      exit 0
      ;;
    *) shift ;;
  esac
done

print_header() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}     ${BLUE}Mission Control - Setup Verification${NC}         ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; ((WARNINGS++)); }
fail() { echo -e "${RED}✗${NC} $1"; ((ERRORS++)); }
info() { echo -e "${CYAN}ℹ${NC} $1"; }
verbose() { [ "$VERBOSE" = true ] && echo -e "  ${CYAN}→ $1${NC}"; }

# ============================================================================
# CHECK FUNCTIONS
# ============================================================================

check_node_modules() {
  print_section "Dependencies"

  if [ -d "$PROJECT_DIR/node_modules" ]; then
    ok "node_modules exists"
    verbose "Path: $PROJECT_DIR/node_modules"
  else
    fail "node_modules missing"
    info "Fix: pnpm install"
    return 1
  fi

  if [ -d "$PROJECT_DIR/node_modules/.pnpm/@prisma+client"* ]; then
    ok "Prisma client installed"
  else
    fail "Prisma client missing"
    info "Fix: pnpm db:generate"
    return 1
  fi
}

check_build() {
  print_section "Build"

  if [ -f "$MCP_SERVER_DIR/dist/index.js" ]; then
    ok "MCP server built"
    verbose "Path: $MCP_SERVER_DIR/dist/index.js"
  else
    fail "MCP server not built"
    info "Fix: pnpm build:all"
    return 1
  fi
}

check_database_file() {
  print_section "Database File"

  if [ -f "$DB_PATH" ]; then
    ok "Database file exists"
    verbose "Path: $DB_PATH"

    # Check file size
    local size=$(stat -f%z "$DB_PATH" 2>/dev/null || stat -c%s "$DB_PATH" 2>/dev/null)
    verbose "Size: $size bytes"

    if [ "$size" -lt 1000 ]; then
      warn "Database file seems too small (may be empty)"
    fi
  else
    fail "Database file missing: $DB_PATH"
    info "Fix: pnpm db:migrate"
    return 1
  fi
}

check_database_tables() {
  print_section "Database Tables"

  if ! command -v sqlite3 &> /dev/null; then
    warn "sqlite3 not installed, skipping table check"
    return 0
  fi

  if [ ! -f "$DB_PATH" ]; then
    fail "Cannot check tables: database file missing"
    return 1
  fi

  # Check required tables
  local tables=("Mission" "Phase" "Task" "Workflow" "Decision" "Issue" "Milestone")
  local missing=0

  for table in "${tables[@]}"; do
    if sqlite3 "$DB_PATH" "SELECT 1 FROM $table LIMIT 1" &> /dev/null; then
      ok "Table $table exists"
    else
      fail "Table $table missing"
      ((missing++))
    fi
  done

  if [ $missing -gt 0 ]; then
    info "Fix: pnpm db:migrate"
    return 1
  fi
}

check_env_file() {
  print_section "Environment"

  local env_file="$SHARED_DIR/.env"

  if [ -f "$env_file" ]; then
    ok ".env file exists"
    verbose "Path: $env_file"

    if grep -q "DATABASE_URL" "$env_file"; then
      ok "DATABASE_URL defined in .env"
      verbose "$(grep DATABASE_URL "$env_file" | head -1)"
    else
      fail "DATABASE_URL not defined in .env"
      return 1
    fi
  else
    fail ".env file missing"
    info "Fix: echo 'DATABASE_URL=\"file:./mcp-tracker.db\"' > $env_file"
    return 1
  fi
}

check_mcp_config() {
  print_section "MCP Configuration"

  if [ -f "$MCP_CONFIG" ]; then
    ok ".mcp.json exists"
    verbose "Path: $MCP_CONFIG"
  else
    fail ".mcp.json missing"
    info "Fix: ./scripts/generate-mcp-config.sh ."
    return 1
  fi

  # Check JSON validity
  if command -v jq &> /dev/null; then
    if jq empty "$MCP_CONFIG" 2>/dev/null; then
      ok ".mcp.json is valid JSON"
    else
      fail ".mcp.json is invalid JSON"
      return 1
    fi
  fi

  # Check mission-control server config
  if grep -q "mission-control" "$MCP_CONFIG"; then
    ok "mission-control server configured"
  else
    fail "mission-control not found in .mcp.json"
    return 1
  fi

  # Check paths in config
  local server_path=$(grep -o '"args":\s*\["[^"]*"\]' "$MCP_CONFIG" | grep -o '/[^"]*' | head -1)
  if [ -n "$server_path" ] && [ -f "$server_path" ]; then
    ok "Server path in config is valid"
    verbose "Server: $server_path"
  else
    fail "Server path in config is invalid or file missing"
    verbose "Path: $server_path"
    return 1
  fi

  # Check DATABASE_URL in config
  if grep -q "DATABASE_URL" "$MCP_CONFIG"; then
    ok "DATABASE_URL in .mcp.json"

    local db_url=$(grep -o '"DATABASE_URL":\s*"[^"]*"' "$MCP_CONFIG" | grep -o 'file:[^"]*')
    local db_file="${db_url#file:}"

    if [ -f "$db_file" ]; then
      ok "Database path in config is valid"
      verbose "DB: $db_file"
    else
      fail "Database file in config doesn't exist: $db_file"
      return 1
    fi
  else
    warn "DATABASE_URL not in .mcp.json (may use .env fallback)"
  fi
}

check_symlinks() {
  print_section "Symlinks"

  if [ -L "$SYMLINK_DOCS" ]; then
    local target=$(readlink -f "$SYMLINK_DOCS" 2>/dev/null || readlink "$SYMLINK_DOCS")
    if [ -d "$target" ]; then
      ok "Docs symlink valid"
      verbose "$SYMLINK_DOCS -> $target"
    else
      fail "Docs symlink broken (target missing)"
      info "Fix: ./scripts/symlink.sh --force"
    fi
  else
    fail "Docs symlink missing"
    info "Fix: ./scripts/symlink.sh"
  fi

  if [ -L "$SYMLINK_AGENT" ]; then
    local target=$(readlink -f "$SYMLINK_AGENT" 2>/dev/null || readlink "$SYMLINK_AGENT")
    if [ -f "$target" ]; then
      ok "Agent symlink valid"
      verbose "$SYMLINK_AGENT -> $target"
    else
      fail "Agent symlink broken (target missing)"
      info "Fix: ./scripts/symlink.sh --force"
    fi
  else
    fail "Agent symlink missing"
    info "Fix: ./scripts/symlink.sh"
  fi
}

check_mcp_server_starts() {
  print_section "MCP Server Health"

  if [ ! -f "$MCP_SERVER_DIR/dist/index.js" ]; then
    fail "Cannot test: server not built"
    return 1
  fi

  # Create test request
  local request='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"verify","version":"1.0"}}}'

  info "Starting MCP server..."

  # Run server with timeout
  local response
  if command -v timeout &> /dev/null; then
    response=$(echo "$request" | DATABASE_URL="file:$DB_PATH" timeout 5 node "$MCP_SERVER_DIR/dist/index.js" 2>&1 | head -1)
  else
    response=$(echo "$request" | DATABASE_URL="file:$DB_PATH" node "$MCP_SERVER_DIR/dist/index.js" 2>&1 &
    local pid=$!
    sleep 2
    kill $pid 2>/dev/null
    wait $pid 2>/dev/null)
  fi

  if echo "$response" | grep -q '"result"'; then
    ok "MCP server starts and responds"
    verbose "Response: ${response:0:80}..."
  elif echo "$response" | grep -q "does not exist"; then
    fail "MCP server fails: database tables missing"
    info "Fix: pnpm db:migrate"
    return 1
  elif echo "$response" | grep -q "error"; then
    fail "MCP server returns error"
    verbose "$response"
    return 1
  else
    warn "MCP server response unclear"
    verbose "$response"
  fi
}

# ============================================================================
# FIX FUNCTIONS
# ============================================================================

auto_fix() {
  if [ "$FIX" != true ]; then
    return
  fi

  print_section "Auto-Fix"

  if [ $ERRORS -eq 0 ]; then
    info "No errors to fix"
    return
  fi

  info "Attempting automatic fixes..."

  # Fix missing node_modules
  if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    info "Installing dependencies..."
    cd "$PROJECT_DIR" && pnpm install
  fi

  # Fix missing Prisma client
  if [ ! -d "$PROJECT_DIR/node_modules/.pnpm/@prisma+client"* ]; then
    info "Generating Prisma client..."
    cd "$PROJECT_DIR" && pnpm db:generate
  fi

  # Fix missing database
  if [ ! -f "$DB_PATH" ]; then
    info "Running migrations..."
    cd "$PROJECT_DIR" && pnpm db:migrate
  fi

  # Fix missing build
  if [ ! -f "$MCP_SERVER_DIR/dist/index.js" ]; then
    info "Building project..."
    cd "$PROJECT_DIR" && pnpm build:all
  fi

  # Fix symlinks
  if [ ! -L "$SYMLINK_DOCS" ] || [ ! -L "$SYMLINK_AGENT" ]; then
    info "Creating symlinks..."
    "$SCRIPT_DIR/symlink.sh" --force
  fi

  # Fix MCP config
  if [ ! -f "$MCP_CONFIG" ]; then
    info "Generating MCP config..."
    "$SCRIPT_DIR/generate-mcp-config.sh" --force "$PROJECT_DIR"
  fi

  ok "Auto-fix complete. Run verify-setup.sh again to check."
}

# ============================================================================
# SUMMARY
# ============================================================================

print_summary() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo ""

  if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "Your setup is ready. Restart Claude Code to connect MCP."
  elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}$WARNINGS warning(s), no errors${NC}"
    echo ""
    echo "Setup should work but review warnings above."
  else
    echo -e "${RED}$ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Fix the errors above before using Mission Control."
    echo ""
    echo -e "Quick fix: ${CYAN}./scripts/verify-setup.sh --fix${NC}"
  fi
  echo ""
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  print_header

  check_node_modules || true
  check_build || true
  check_env_file || true
  check_database_file || true
  check_database_tables || true
  check_mcp_config || true
  check_symlinks || true
  check_mcp_server_starts || true

  auto_fix
  print_summary

  [ $ERRORS -eq 0 ]
}

main

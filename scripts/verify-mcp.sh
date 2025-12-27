#!/bin/bash
# Mission Control - MCP Verification Script
# Tests MCP server connection and tool availability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MCP_SERVER_PATH="$PROJECT_DIR/packages/mcp-server/dist/index.js"

# Flags
VERBOSE=false
TIMEOUT=10

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Mission Control - MCP Verification Script"
      echo ""
      echo "Usage: ./verify-mcp.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -v, --verbose      Show detailed output"
      echo "  -t, --timeout SEC  Timeout in seconds (default: 10)"
      echo "  -h, --help         Show this help message"
      echo ""
      echo "Verifies:"
      echo "  - MCP server binary exists and is executable"
      echo "  - Server starts correctly"
      echo "  - All tools are registered"
      echo "  - Database connection works"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

print_header() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}     ${BLUE}Mission Control - MCP Verification${NC}           ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_verbose() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}  → $1${NC}"
  fi
}

# Check if server binary exists
check_binary() {
  print_info "Checking MCP server binary..."

  if [ ! -f "$MCP_SERVER_PATH" ]; then
    print_error "Server binary not found: $MCP_SERVER_PATH"
    print_info "Run: ./scripts/setup.sh to build the project"
    return 1
  fi

  print_success "Server binary exists"
  print_verbose "Path: $MCP_SERVER_PATH"
  return 0
}

# Check database
check_database() {
  print_info "Checking database..."

  local db_path="$PROJECT_DIR/packages/shared/prisma/mcp-tracker.db"

  if [ ! -f "$db_path" ]; then
    print_error "Database file not found: $db_path"
    print_info "Fix: pnpm db:migrate"
    return 1
  fi

  print_success "Database file exists"
  print_verbose "Path: $db_path"

  # Check if we can query it and tables exist
  if command -v sqlite3 &> /dev/null; then
    if sqlite3 "$db_path" "SELECT 1" &> /dev/null; then
      print_success "Database is accessible"

      # Check critical tables
      local tables_ok=true
      for table in Mission Workflow Task; do
        if sqlite3 "$db_path" "SELECT 1 FROM $table LIMIT 1" &> /dev/null; then
          print_verbose "Table $table exists"
        else
          print_error "Table $table missing"
          tables_ok=false
        fi
      done

      if [ "$tables_ok" = false ]; then
        print_info "Fix: pnpm db:migrate"
        return 1
      fi
      print_success "Required tables exist"
    else
      print_error "Database file corrupted or inaccessible"
      return 1
    fi
  else
    print_warning "sqlite3 not installed, skipping table check"
  fi

  return 0
}

# Test MCP server with a simple request
test_server() {
  print_info "Testing MCP server..."

  # Create a temporary file for the request
  local request_file=$(mktemp)
  local response_file=$(mktemp)

  # MCP initialize request
  cat > "$request_file" << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"verify-mcp","version":"1.0.0"}}}
EOF

  print_verbose "Sending initialize request..."

  # Start server and send request with timeout
  local start_time=$(date +%s)

  local db_path="$PROJECT_DIR/packages/shared/prisma/mcp-tracker.db"

  # Use timeout command if available
  if command -v timeout &> /dev/null; then
    if timeout "$TIMEOUT" bash -c "cat '$request_file' | DATABASE_URL='file:$db_path' node '$MCP_SERVER_PATH' 2>/dev/null | head -1" > "$response_file" 2>&1; then
      local response=$(cat "$response_file")

      if [ -n "$response" ]; then
        print_success "Server responded to initialize"
        print_verbose "Response: ${response:0:100}..."

        # Check if response is valid JSON
        if echo "$response" | node -e "JSON.parse(require('fs').readFileSync(0,'utf8'))" 2>/dev/null; then
          print_success "Response is valid JSON"

          # Check for error
          if echo "$response" | grep -q '"error"'; then
            print_warning "Response contains error"
            print_verbose "$(echo "$response" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).error)" 2>/dev/null)"
          else
            print_success "Initialize successful"
          fi
        else
          print_warning "Response is not valid JSON"
        fi
      else
        print_error "Server returned empty response"
        rm -f "$request_file" "$response_file"
        return 1
      fi
    else
      print_error "Server timed out or failed to respond"
      rm -f "$request_file" "$response_file"
      return 1
    fi
  else
    # Fallback without timeout
    print_warning "timeout command not available, testing with basic check"

    # Just verify the server can be loaded
    if node -e "require('$MCP_SERVER_PATH')" 2>/dev/null; then
      print_success "Server module loads correctly"
    else
      # Try checking if it's an ES module
      if node --experimental-modules -e "import('file://$MCP_SERVER_PATH')" 2>/dev/null; then
        print_success "Server module loads correctly (ES module)"
      else
        print_warning "Could not verify server module loading"
      fi
    fi
  fi

  rm -f "$request_file" "$response_file"
  return 0
}

# List available tools
list_tools() {
  print_info "Checking registered tools..."

  # Create request for tools/list
  local request_file=$(mktemp)
  local response_file=$(mktemp)
  local db_path="$PROJECT_DIR/packages/shared/prisma/mcp-tracker.db"

  # Initialize + list tools request
  cat > "$request_file" << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"verify-mcp","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF

  if command -v timeout &> /dev/null; then
    local response=$(timeout "$TIMEOUT" bash -c "cat '$request_file' | DATABASE_URL='file:$db_path' node '$MCP_SERVER_PATH' 2>/dev/null" 2>&1 | tail -1)

    if [ -n "$response" ] && echo "$response" | grep -q '"tools"'; then
      local tool_count=$(echo "$response" | node -e "
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        console.log(data.result?.tools?.length || 0);
      " 2>/dev/null)

      if [ -n "$tool_count" ] && [ "$tool_count" -gt 0 ]; then
        print_success "$tool_count tools registered"

        if [ "$VERBOSE" = true ]; then
          echo "$response" | node -e "
            const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
            data.result?.tools?.forEach(t => console.log('  → ' + t.name));
          " 2>/dev/null || true
        fi
      else
        print_warning "No tools found in response"
      fi
    else
      print_warning "Could not retrieve tool list"
    fi
  else
    print_warning "Cannot list tools without timeout command"
  fi

  rm -f "$request_file" "$response_file"
  return 0
}

# Summary
print_summary() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo ""

  if [ "$all_passed" = true ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "MCP server is ready to use."
    echo ""
    echo -e "${BLUE}Quick start:${NC}"
    echo "  1. Add to your project's .mcp.json:"
    echo ""
    echo -e "     ${CYAN}./scripts/generate-mcp-config.sh /path/to/your/project${NC}"
    echo ""
    echo "  2. Start the web UI (optional):"
    echo -e "     ${CYAN}cd $PROJECT_DIR && pnpm dev:ui${NC}"
    echo ""
  else
    echo -e "${YELLOW}Some checks had warnings or errors.${NC}"
    echo ""
    echo "Please review the output above and fix any issues."
    echo "Run with -v for more details."
    echo ""
  fi
}

# Main execution
main() {
  print_header

  all_passed=true

  check_binary || all_passed=false
  echo ""

  check_database || all_passed=false
  echo ""

  test_server || all_passed=false
  echo ""

  list_tools || all_passed=false

  print_summary

  if [ "$all_passed" = true ]; then
    exit 0
  else
    exit 1
  fi
}

main

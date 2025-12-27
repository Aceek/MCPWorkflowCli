#!/bin/bash
# Mission Control - MCP Config Generator
# Generates .mcp.json configuration for a project

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
DATABASE_PATH="$PROJECT_DIR/packages/shared/prisma/mcp-tracker.db"

# Flags
OUTPUT_DIR=""
FORCE=false
STDOUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -o|--output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -f|--force)
      FORCE=true
      shift
      ;;
    --stdout)
      STDOUT=true
      shift
      ;;
    -h|--help)
      echo "Mission Control - MCP Config Generator"
      echo ""
      echo "Usage: ./generate-mcp-config.sh [OPTIONS] [PROJECT_PATH]"
      echo ""
      echo "Options:"
      echo "  -o, --output DIR   Output directory (default: current directory or PROJECT_PATH)"
      echo "  -f, --force        Overwrite existing .mcp.json"
      echo "  --stdout           Print config to stdout instead of file"
      echo "  -h, --help         Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./generate-mcp-config.sh                    # Interactive mode"
      echo "  ./generate-mcp-config.sh ~/my-project       # Generate for specific project"
      echo "  ./generate-mcp-config.sh --stdout           # Print to stdout"
      echo ""
      exit 0
      ;;
    *)
      if [ -z "$OUTPUT_DIR" ]; then
        OUTPUT_DIR="$1"
      fi
      shift
      ;;
  esac
done

print_success() {
  echo -e "${GREEN}✓${NC} $1" >&2
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1" >&2
}

print_error() {
  echo -e "${RED}✗${NC} $1" >&2
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1" >&2
}

# Generate config content
generate_config() {
  cat << EOF
{
  "mcpServers": {
    "mission-control": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"],
      "env": {
        "DATABASE_URL": "file:$DATABASE_PATH"
      }
    }
  }
}
EOF
}

# Validate MCP server exists
validate_server() {
  if [ ! -f "$MCP_SERVER_PATH" ]; then
    print_error "MCP server not found at: $MCP_SERVER_PATH"
    print_info "Run setup.sh first to build the project"
    exit 1
  fi
}

# Main execution
main() {
  # Validate server exists
  validate_server

  # Handle stdout mode
  if [ "$STDOUT" = true ]; then
    generate_config
    exit 0
  fi

  # Interactive mode if no output directory specified
  if [ -z "$OUTPUT_DIR" ]; then
    echo ""
    echo -e "${BLUE}Mission Control - MCP Config Generator${NC}"
    echo "========================================"
    echo ""
    echo "This will generate a .mcp.json file for your project."
    echo ""
    read -p "Enter project path (default: current directory): " user_path
    if [ -n "$user_path" ]; then
      OUTPUT_DIR="$user_path"
    else
      OUTPUT_DIR="$(pwd)"
    fi
  fi

  # Expand path
  OUTPUT_DIR="${OUTPUT_DIR/#\~/$HOME}"

  # Check if directory exists
  if [ ! -d "$OUTPUT_DIR" ]; then
    print_error "Directory does not exist: $OUTPUT_DIR"
    exit 1
  fi

  # Output file path
  OUTPUT_FILE="$OUTPUT_DIR/.mcp.json"

  # Check if file exists
  if [ -f "$OUTPUT_FILE" ]; then
    if [ "$FORCE" = true ]; then
      print_warning "Overwriting existing .mcp.json"
    else
      print_error ".mcp.json already exists at: $OUTPUT_FILE"
      print_info "Use --force to overwrite"
      exit 1
    fi
  fi

  # Generate and write config
  echo ""
  print_info "Generating MCP configuration..."

  if generate_config > "$OUTPUT_FILE"; then
    print_success "Created: $OUTPUT_FILE"
  else
    print_error "Failed to write config file"
    exit 1
  fi

  # Validate JSON
  if command -v jq &> /dev/null; then
    if jq empty "$OUTPUT_FILE" 2>/dev/null; then
      print_success "JSON syntax validated"
    else
      print_error "Invalid JSON generated"
      exit 1
    fi
  elif command -v node &> /dev/null; then
    if node -e "require('$OUTPUT_FILE')" 2>/dev/null; then
      print_success "JSON syntax validated"
    else
      print_error "Invalid JSON generated"
      exit 1
    fi
  fi

  echo ""
  echo -e "${GREEN}Configuration generated successfully!${NC}"
  echo ""
  echo "Contents of $OUTPUT_FILE:"
  echo ""
  cat "$OUTPUT_FILE"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Open your project in Claude Code"
  echo "  2. The MCP server will be automatically available"
  echo "  3. Run: $SCRIPT_DIR/verify-mcp.sh to test"
  echo ""
}

main

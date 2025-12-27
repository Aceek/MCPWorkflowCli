#!/bin/bash
# Workflow Control - Setup Script
# One-command installation and verification

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

# Flags
SILENT=false
SKIP_BUILD=false
SKIP_SYMLINKS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -s|--silent)
      SILENT=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-symlinks)
      SKIP_SYMLINKS=true
      shift
      ;;
    -h|--help)
      echo "Mission Control - Setup Script"
      echo ""
      echo "Usage: ./setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -s, --silent      Run without interactive prompts"
      echo "  --skip-build      Skip the build step"
      echo "  --skip-symlinks   Skip creating Claude symlinks"
      echo "  -h, --help        Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Print functions
print_header() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}        ${BLUE}Workflow Control - Setup${NC}                  ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  Orchestration + Observability for AI Agents     ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}▶${NC} $1"
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
  echo -e "${CYAN}ℹ${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  print_step "Checking prerequisites..."
  local has_errors=false

  # Check Node.js
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
      print_success "Node.js $(node -v) installed"
    else
      print_error "Node.js 20+ required (found $(node -v))"
      print_info "Install via: https://nodejs.org/ or use nvm"
      has_errors=true
    fi
  else
    print_error "Node.js not found"
    print_info "Install via: https://nodejs.org/ or use nvm"
    has_errors=true
  fi

  # Check pnpm
  if command -v pnpm &> /dev/null; then
    print_success "pnpm $(pnpm -v) installed"
  else
    print_error "pnpm not found"
    print_info "Install via: npm install -g pnpm"
    has_errors=true
  fi

  # Check git
  if command -v git &> /dev/null; then
    print_success "git $(git --version | cut -d' ' -f3) installed"
  else
    print_error "git not found"
    print_info "Install via your package manager (apt, brew, etc.)"
    has_errors=true
  fi

  if [ "$has_errors" = true ]; then
    echo ""
    print_error "Please install missing prerequisites and try again."
    exit 1
  fi

  echo ""
}

# Install dependencies
install_dependencies() {
  print_step "Installing dependencies..."
  cd "$PROJECT_DIR"

  if pnpm install; then
    print_success "Dependencies installed"
  else
    print_error "Failed to install dependencies"
    exit 1
  fi
  echo ""
}

# Generate Prisma client
generate_prisma() {
  print_step "Generating Prisma client..."
  cd "$PROJECT_DIR"

  if pnpm db:generate; then
    print_success "Prisma client generated"
  else
    print_error "Failed to generate Prisma client"
    exit 1
  fi
  echo ""
}

# Run migrations
run_migrations() {
  print_step "Running database migrations..."
  cd "$PROJECT_DIR"

  if pnpm db:migrate; then
    print_success "Database migrations applied"
  else
    print_error "Failed to run migrations"
    exit 1
  fi
  echo ""
}

# Build project
build_project() {
  if [ "$SKIP_BUILD" = true ]; then
    print_warning "Skipping build (--skip-build flag)"
    return
  fi

  print_step "Building project..."
  cd "$PROJECT_DIR"

  if pnpm build:all; then
    print_success "Project built successfully"
  else
    print_error "Build failed"
    exit 1
  fi
  echo ""
}

# Create symlinks
create_symlinks() {
  if [ "$SKIP_SYMLINKS" = true ]; then
    print_warning "Skipping symlinks (--skip-symlinks flag)"
    return
  fi

  print_step "Creating Claude symlinks..."

  # Run symlink script
  if "$SCRIPT_DIR/symlink.sh"; then
    print_success "Symlinks created"
  else
    print_warning "Symlink creation had issues (non-fatal)"
  fi
  echo ""
}

# Generate MCP config for this project
generate_mcp_config() {
  print_step "Generating MCP config for this project..."

  if "$SCRIPT_DIR/generate-mcp-config.sh" --force "$PROJECT_DIR" > /dev/null 2>&1; then
    print_success "MCP config created: $PROJECT_DIR/.mcp.json"
  else
    print_warning "MCP config generation had issues (non-fatal)"
  fi
  echo ""
}

# Run final verification
run_verification() {
  print_step "Running setup verification..."
  echo ""

  if "$SCRIPT_DIR/verify-setup.sh"; then
    print_success "All verifications passed"
  else
    print_warning "Some verifications failed - check output above"
    print_info "Run: ./scripts/verify-setup.sh --fix to attempt auto-fix"
  fi
  echo ""
}

# Print next steps
print_next_steps() {
  echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║${NC}           ${GREEN}Setup Complete!${NC}                        ${GREEN}║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BLUE}What was configured:${NC}"
  echo "  ✓ Dependencies installed"
  echo "  ✓ Database initialized"
  echo "  ✓ MCP server built"
  echo "  ✓ Symlinks created in ~/.claude/"
  echo "  ✓ MCP config generated (.mcp.json)"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo ""
  echo "  1. Restart Claude Code to connect MCP:"
  echo -e "     ${CYAN}exit${NC} then ${CYAN}claude${NC}"
  echo ""
  echo "  2. Verify MCP connection:"
  echo -e "     ${CYAN}/mcp${NC} (should show mission-control: connected)"
  echo ""
  echo "  3. Test with a workflow:"
  echo -e "     ${CYAN}\"Design a workflow for [your objective]\"${NC}"
  echo ""
  echo "  4. Start the web UI (optional):"
  echo -e "     ${CYAN}pnpm dev:ui${NC}"
  echo ""
  echo -e "${BLUE}Documentation:${NC}"
  echo "  - Workflow System: ~/.claude/docs/workflow-system/"
  echo "  - Project Docs:    $PROJECT_DIR/.claude/docs/"
  echo ""
}

# Main execution
main() {
  print_header

  # Confirm with user (unless silent mode)
  if [ "$SILENT" = false ]; then
    echo "This script will:"
    echo "  • Check prerequisites (Node.js 20+, pnpm, git)"
    echo "  • Install dependencies"
    echo "  • Generate Prisma client"
    echo "  • Run database migrations"
    if [ "$SKIP_BUILD" = false ]; then
      echo "  • Build the project"
    fi
    if [ "$SKIP_SYMLINKS" = false ]; then
      echo "  • Create symlinks in ~/.claude/"
      echo "  • Generate .mcp.json for this project"
    fi
    echo ""
    read -p "Continue? [Y/n] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
      echo "Aborted."
      exit 0
    fi
    echo ""
  fi

  check_prerequisites
  install_dependencies
  generate_prisma
  run_migrations
  build_project
  create_symlinks
  generate_mcp_config
  run_verification
  print_next_steps
}

main

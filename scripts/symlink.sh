#!/bin/bash
# Mission Control - Symlink Script
# Creates symlinks in ~/.claude/ for global agent access

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Target directories
CLAUDE_DIR="$HOME/.claude"
CLAUDE_DOCS_DIR="$CLAUDE_DIR/docs"
CLAUDE_AGENTS_DIR="$CLAUDE_DIR/agents"

# Source paths
MISSION_DOCS_SRC="$PROJECT_DIR/mission-system/docs"
MISSION_AGENT_SRC="$PROJECT_DIR/mission-system/agents/mission-architect.md"

# Flags
FORCE=false
REMOVE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--force)
      FORCE=true
      shift
      ;;
    -r|--remove)
      REMOVE=true
      shift
      ;;
    -h|--help)
      echo "Mission Control - Symlink Script"
      echo ""
      echo "Usage: ./symlink.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -f, --force    Force overwrite existing symlinks"
      echo "  -r, --remove   Remove symlinks instead of creating them"
      echo "  -h, --help     Show this help message"
      echo ""
      echo "Creates symlinks:"
      echo "  ~/.claude/docs/mission-system/ -> mission-system/docs/"
      echo "  ~/.claude/agents/mission-architect.md -> mission-system/agents/mission-architect.md"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

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

# Create a symlink with checks
create_symlink() {
  local src="$1"
  local dest="$2"
  local name="$3"

  # Check if source exists
  if [ ! -e "$src" ]; then
    print_error "Source not found: $src"
    return 1
  fi

  # Check if destination already exists
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    if [ -L "$dest" ]; then
      local current_target=$(readlink -f "$dest" 2>/dev/null || readlink "$dest")
      local expected_target=$(cd "$(dirname "$src")" && pwd)/$(basename "$src")

      if [ "$current_target" = "$expected_target" ] || [ "$current_target" = "$src" ]; then
        print_success "$name already linked correctly"
        return 0
      fi
    fi

    if [ "$FORCE" = true ]; then
      rm -rf "$dest"
      print_warning "Removed existing: $dest"
    else
      print_warning "$name already exists (use --force to overwrite)"
      return 0
    fi
  fi

  # Create parent directory if needed
  mkdir -p "$(dirname "$dest")"

  # Create symlink
  if ln -s "$src" "$dest"; then
    print_success "$name created: $dest -> $src"
    return 0
  else
    print_error "Failed to create symlink: $dest"
    return 1
  fi
}

# Remove a symlink
remove_symlink() {
  local dest="$1"
  local name="$2"

  if [ -L "$dest" ]; then
    if rm "$dest"; then
      print_success "$name removed"
    else
      print_error "Failed to remove: $dest"
    fi
  elif [ -e "$dest" ]; then
    print_warning "$name exists but is not a symlink (skipping)"
  else
    print_info "$name does not exist"
  fi
}

# Main execution
main() {
  echo ""
  echo -e "${BLUE}Mission Control - Symlink Setup${NC}"
  echo "================================"
  echo ""

  if [ "$REMOVE" = true ]; then
    echo "Removing symlinks..."
    echo ""
    remove_symlink "$CLAUDE_DOCS_DIR/mission-system" "Mission System docs"
    remove_symlink "$CLAUDE_AGENTS_DIR/mission-architect.md" "Mission Architect agent"
    echo ""
    print_success "Symlinks removed"
    exit 0
  fi

  # Check if .claude directory exists
  if [ ! -d "$CLAUDE_DIR" ]; then
    print_info "Creating ~/.claude directory..."
    mkdir -p "$CLAUDE_DIR"
  fi

  # Create docs symlink
  echo "Creating symlinks..."
  echo ""

  create_symlink "$MISSION_DOCS_SRC" "$CLAUDE_DOCS_DIR/mission-system" "Mission System docs"
  create_symlink "$MISSION_AGENT_SRC" "$CLAUDE_AGENTS_DIR/mission-architect.md" "Mission Architect agent"

  echo ""

  # Verify
  echo "Verifying symlinks..."
  local all_good=true

  if [ -L "$CLAUDE_DOCS_DIR/mission-system" ]; then
    print_success "Docs symlink verified"
  else
    print_error "Docs symlink missing or invalid"
    all_good=false
  fi

  if [ -L "$CLAUDE_AGENTS_DIR/mission-architect.md" ]; then
    print_success "Agent symlink verified"
  else
    print_error "Agent symlink missing or invalid"
    all_good=false
  fi

  echo ""

  if [ "$all_good" = true ]; then
    echo -e "${GREEN}All symlinks created successfully!${NC}"
    echo ""
    echo "You can now use:"
    echo "  - Mission System docs in any Claude Code session"
    echo "  - mission-architect agent via Task tool"
    echo ""
  else
    echo -e "${YELLOW}Some symlinks could not be created.${NC}"
    echo "Try running with --force to overwrite existing files."
    exit 1
  fi
}

main

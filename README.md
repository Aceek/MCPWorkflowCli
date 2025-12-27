# Workflow Control

> Orchestration + Observability for Agentic Workflows - Multi-agent workflow system with MCP tracking.

## Overview

Workflow Control is a unified system that:
1. **Orchestrates** multi-agent workflows (phases, sub-agents, coordination)
2. **Tracks** everything via MCP tools + SQLite (decisions, progress, files)
3. **Visualizes** workflows in real-time (WebUI dashboard)

## Architecture

**Monorepo Structure** (pnpm workspaces)
```
workflow-control/
├── packages/
│   ├── shared/           # Prisma schema + Types (source of truth)
│   ├── mcp-server/       # MCP Server (tools for orchestration & tracking)
│   └── web-ui/           # Next.js Dashboard
├── workflow-system/      # Workflow orchestration docs & templates
│   ├── docs/             # Architecture, templates, profiles
│   └── agents/           # workflow-architect agent
├── scripts/              # Setup & installation scripts
└── .claude/              # Dev config for this project
```

## Installation

### Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/))
- **pnpm** (`npm install -g pnpm`)
- **git**

### Automated Setup

```bash
# Clone the repository
git clone <repository-url>
cd workflow-control

# Run the setup script
./scripts/setup.sh
```

The setup script will:
- Check prerequisites (Node.js 20+, pnpm, git)
- Install dependencies
- Generate Prisma client
- Run database migrations
- Build the project
- Create symlinks in `~/.claude/` for global access

### Manual Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Build the project
pnpm build:all
```

## Configuration

### MCP Server Configuration

Add Workflow Control to your project's `.mcp.json`:

```bash
# Interactive mode
./scripts/generate-mcp-config.sh

# Or specify the project path
./scripts/generate-mcp-config.sh ~/my-project

# Or manually create .mcp.json:
```

```json
{
  "mcpServers": {
    "workflow-control": {
      "command": "node",
      "args": ["/path/to/workflow-control/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### Claude Code Symlinks

The setup script creates symlinks for global access:

```
~/.claude/docs/workflow-system/     -> Workflow System documentation
~/.claude/agents/workflow-architect.md -> Workflow Architect agent
```

To manage symlinks manually:

```bash
# Create symlinks
./scripts/symlink.sh

# Force overwrite existing
./scripts/symlink.sh --force

# Remove symlinks
./scripts/symlink.sh --remove
```

## Usage

### Start the Web UI

```bash
pnpm dev:ui
```

Opens at http://localhost:3000

### Verify MCP Server

```bash
./scripts/verify-mcp.sh

# With verbose output
./scripts/verify-mcp.sh --verbose
```

### MCP Tools Available

| Tool | Description |
|------|-------------|
| `start_workflow` | Create a new workflow with phases |
| `complete_workflow` | Finalize a workflow with summary |
| `start_task` | Start a task within a workflow |
| `complete_task` | Complete a task with results |
| `log_decision` | Record an architectural decision |
| `log_issue` | Report a problem or blocker |
| `log_milestone` | Mark a milestone achievement |
| `get_context` | Query workflow state and history |

## Scripts Reference

| Script | Description |
|--------|-------------|
| `./scripts/setup.sh` | Full installation and setup |
| `./scripts/symlink.sh` | Manage Claude symlinks |
| `./scripts/generate-mcp-config.sh` | Generate .mcp.json config |
| `./scripts/verify-mcp.sh` | Test MCP server connection |

### Script Options

```bash
# Setup
./scripts/setup.sh --help
./scripts/setup.sh --silent          # Non-interactive mode
./scripts/setup.sh --skip-build      # Skip building
./scripts/setup.sh --skip-symlinks   # Skip symlink creation

# Symlinks
./scripts/symlink.sh --help
./scripts/symlink.sh --force         # Overwrite existing
./scripts/symlink.sh --remove        # Remove symlinks

# MCP Config
./scripts/generate-mcp-config.sh --help
./scripts/generate-mcp-config.sh --stdout   # Print to stdout
./scripts/generate-mcp-config.sh --force    # Overwrite existing

# Verify
./scripts/verify-mcp.sh --help
./scripts/verify-mcp.sh --verbose    # Detailed output
./scripts/verify-mcp.sh --timeout 30 # Custom timeout
```

## Tech Stack

- **MCP Server**: Node.js + TypeScript + @modelcontextprotocol/sdk
- **Database**: SQLite (local, no external server required)
- **ORM**: Prisma (with TypeScript type-safe enums)
- **Web UI**: Next.js 15 + Socket.io (real-time updates)
- **Git Integration**: simple-git (snapshots/diffs)

## Documentation

Technical documentation is in `.claude/docs/`:
- **architecture.md** - System architecture
- **mcp-tools.md** - MCP tools specifications
- **database.md** - Prisma schema reference
- **standards.md** - Code standards

Workflow System docs are in `workflow-system/docs/`:
- **architecture.md** - Workflow orchestration patterns
- **templates/** - Workflow and agent templates
- **profiles/** - Simple, standard, and complex workflow profiles

## Troubleshooting

### MCP Server Not Found

```bash
# Rebuild the project
pnpm build:all

# Verify the binary exists
ls -la packages/mcp-server/dist/index.js
```

### Database Errors

```bash
# Regenerate Prisma client
pnpm db:generate

# Reset and migrate database
pnpm db:migrate
```

### Symlink Issues

```bash
# Force recreate symlinks
./scripts/symlink.sh --force

# Check symlink targets
ls -la ~/.claude/docs/workflow-system
ls -la ~/.claude/agents/workflow-architect.md
```

### Verify Everything Works

```bash
./scripts/verify-mcp.sh --verbose
```

## Uninstall

```bash
# Remove symlinks
./scripts/symlink.sh --remove

# Remove database
rm packages/shared/prisma/dev.db

# Remove node_modules
rm -rf node_modules packages/*/node_modules
```

---

**License**: MIT

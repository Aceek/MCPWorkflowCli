# Mission Control

> Orchestration + Observability for Agentic Workflows - Multi-agent mission system with MCP tracking.

## Overview

Mission Control is a unified system that:
1. **Orchestrates** multi-agent missions (phases, sub-agents, coordination)
2. **Tracks** everything via MCP tools + SQLite (decisions, progress, files)
3. **Visualizes** workflows in real-time (WebUI dashboard)

## Architecture

**Monorepo Structure** (pnpm workspaces)
```
mission-control/
├── packages/
│   ├── shared/           # Prisma schema + Types (source of truth)
│   ├── mcp-server/       # MCP Server (tools for orchestration & tracking)
│   └── web-ui/           # Next.js Dashboard
├── mission-system/       # Mission orchestration docs & templates
│   ├── docs/             # Architecture, templates, profiles
│   └── agents/           # mission-architect agent
├── scripts/              # Setup & installation scripts
└── .claude/              # Dev config for this project
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start MCP server (dev mode)
pnpm dev:mcp

# Start Web UI (dev mode)
pnpm dev:ui
```

## Tech Stack

- **MCP Server**: Node.js + TypeScript + @modelcontextprotocol/sdk
- **Database**: SQLite (local, no external server required)
- **ORM**: Prisma (with TypeScript type-safe enums)
- **Web UI**: Next.js + Socket.io (real-time updates)
- **Git Integration**: simple-git (snapshots/diffs)

## Documentation

Technical documentation is in `.claude/docs/`:
- **architecture.md** - System architecture
- **mcp-protocol.md** - MCP tools specifications
- **database.md** - Prisma schema reference
- **standards.md** - Code standards

## Current Phase

Building the unified mission-control system by merging:
- **mcpAgentTracker**: MCP-based workflow observability
- **mission-system**: Multi-agent orchestration framework

See `.claude/plans/VISION.md` and `.claude/plans/ROADMAP.md` for details.

---

**License**: MIT

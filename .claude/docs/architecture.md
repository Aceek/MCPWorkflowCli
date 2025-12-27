# Architecture

## Project Structure

```
mission-control/
├── packages/
│   ├── shared/          # Prisma schema + types (source of truth)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── .env         # DATABASE_URL
│   │
│   ├── mcp-server/      # MCP Server (stdio)
│   │   └── src/
│   │       ├── index.ts       # Entry (stdio)
│   │       ├── db.ts          # Prisma singleton
│   │       ├── tools/         # 9 MCP tools
│   │       ├── websocket/     # Real-time events
│   │       └── utils/
│   │
│   └── web-ui/          # Next.js Dashboard
│       └── src/
│           ├── app/
│           │   ├── missions/  # Missions views
│           │   └── workflow/  # Legacy views
│           ├── components/
│           └── lib/
│
├── mission-system/      # User docs (→ ~/.claude/)
└── scripts/             # Setup scripts
```

## Data Model

```
Mission (objective, profile)
├── Phase 1 (auto-created)
│   ├── Task 1.1 (orchestrator)
│   └── Task 1.2 (subagent: feature-implementer)
├── Phase 2
│   └── Task 2.1
└── ...

Workflow (legacy)
└── Task
    ├── Decision
    ├── Issue
    └── Milestone
```

## MCP Protocol

```
Claude Code → MCP Client
                 ↓ stdio (JSON-RPC)
             MCP Server → SQLite
                 ↓ WebSocket
             Web UI (real-time)
```

**Characteristics**:
- Communication via stdin/stdout
- No HTTP server
- Launched by agent automatically

## Package Rules

### shared
- **Contains**: Prisma schema, generated types
- **Forbidden**: Business logic, API calls

### mcp-server
- **Can**: Import @prisma/client, write DB, emit WebSocket
- **Forbidden**: UI code, HTTP endpoints, import from web-ui

### web-ui
- **Can**: Import @prisma/client, read DB, expose API routes
- **Forbidden**: Write DB, import from mcp-server

## Patterns

### Prisma Singleton

```typescript
// mcp-server/src/db.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Git Snapshot (CRITICAL)

```typescript
// start_task: Store hash
const startHash = await git.revparse(['HEAD'])

// complete_task: Union of 2 diffs
const committed = await git.diff([startHash, 'HEAD', '--name-status'])
const working = await git.diff(['HEAD', '--name-status'])
const allChanges = merge(committed, working) // Absolute truth
```

### Boundary Validation

```typescript
// All MCP inputs validated before logic
const validated = startMissionSchema.parse(args)
const mission = await prisma.mission.create({ data: validated })
```

## Data Flow

### Task Completion
```
1. Agent calls complete_task
2. MCP Server:
   - Calculate duration
   - Run Git diff (commits + working tree)
   - Parse files Added/Modified/Deleted
   - Verify scope vs actual files
3. Update DB
4. If phase_complete → update Phase + Mission
5. Emit WebSocket events
6. Web UI updates
```

## Database

- **Provider**: SQLite (portable, no server)
- **Arrays**: Stored as JSON strings
- **Enums**: Stored as TEXT, validated by Prisma client
- **Cascade**: Mission delete → Phases → Tasks → Decisions/Issues/Milestones

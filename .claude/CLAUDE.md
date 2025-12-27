# Workflow Control

Multi-agent workflow orchestration + observability via MCP.

## Architecture

| Package | Role | Access |
|---------|------|--------|
| `packages/shared` | Prisma schema + types | Source of truth |
| `packages/mcp-server` | MCP Server (stdio) | Write DB |
| `packages/web-ui` | Next.js Dashboard | Read-only DB |

**Forbidden**: Cross-package imports (except via shared)

## Critical Rules

### TypeScript
- `strict: true`, no `any`
- Prisma enums only (no magic strings)
- Zod validation for all MCP inputs

### Git Snapshot (complete_task)
```
DIFF 1: git diff <start_hash> HEAD --name-status  # Commits
DIFF 2: git diff HEAD --name-status               # Working tree
UNION = Absolute truth of agent work
```

### Caller Context
```typescript
// Orchestrator
start_task({ caller_type: 'orchestrator', phase: 1, ... })

// Sub-agent
start_task({ caller_type: 'subagent', agent_name: 'feature-implementer', ... })
```

## MCP Tools (8)

| Category | Tools |
|----------|-------|
| Workflow | `start_workflow`, `complete_workflow`, `get_context` |
| Task | `start_task`, `complete_task` |
| Logging | `log_decision`, `log_issue`, `log_milestone` |

**Budget**: 3-6 MCP calls per task (no context flooding)

## Commits

```
type(scope): description

Types: feat, fix, refactor, docs, test, chore
```

## Reference Docs

| Document | When to Read |
|----------|--------------|
| `docs/architecture.md` | Modifying monorepo structure |
| `docs/mcp-tools.md` | Implementing/modifying MCP tools |
| `docs/database.md` | Modifying Prisma schema |
| `docs/standards.md` | Always |

## Pre-Commit Checklist

- [ ] Code in correct package
- [ ] Prisma enums (no strings)
- [ ] Zod validation
- [ ] Git snapshot logic (if complete_task)
- [ ] Conventional commit message

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
| `.claude/docs/architecture.md` | Modifying monorepo structure |
| `.claude/docs/mcp-tools.md` | Implementing/modifying MCP tools |
| `.claude/docs/database.md` | Modifying Prisma schema |
| `.claude/docs/standards.md` | Always |

## Pre-Commit Checklist

- [ ] Code in correct package
- [ ] Prisma enums (no strings)
- [ ] Zod validation
- [ ] Git snapshot logic (if complete_task)
- [ ] Conventional commit message

---

## Active Workflow

**Workflow**: code-quality-review
**ID**: `<PENDING_start_workflow_call>`
**Phases**: 3 (parallel execution in phases 1 and 2)
**Path**: `.claude/workflows/code-quality-review/`

### Workflow Commands
- "start workflow" or "execute workflow" → Begin orchestrator execution
- "workflow status" → `get_context({workflow_id, include: ["phase_summary"]})`
- "continue workflow" → Resume from last completed phase
- "abort workflow" → Fail workflow and document reason

### Workflow Overview
Comprehensive code quality review across all 3 packages:
- Phase 1: Parallel analysis (SOLID, DRY, security, clean code)
- Phase 2: Parallel correction (conventional commits, no Claude mentions)
- Phase 3: Final validation review

**IMPORTANT**: Before starting, you MUST call `start_workflow` MCP tool to obtain workflow_id, then update all workflow files with the actual workflow_id.

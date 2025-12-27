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

## Workflow Lifecycle

**CRITICAL**: Design and execution are TWO SEPARATE steps.

| User Intent | Action | Condition |
|-------------|--------|-----------|
| "Design workflow", "Create workflow", "I need a workflow for..." | Invoke agent `workflow-architect` | `.claude/workflows/<name>/` does NOT exist |
| "Run workflow", "Execute workflow", "Start workflow" | Use MCP `start_workflow` | `.claude/workflows/<name>/` ALREADY exists |

### Step 1: Design (workflow-architect agent)

When user wants to CREATE a new workflow:
1. Invoke `workflow-architect` agent
2. Agent creates `.claude/workflows/<name>/` with:
   - `definition.md` - Objectives, scope, constraints
   - `workflow.md` - Phases, agents, prompts
   - `start.md` - Orchestrator execution protocol
3. Agent calls `start_workflow` MCP to get `workflow_id`
4. Agent updates all files with actual `workflow_id`

**Trigger phrases**: "design", "create", "I want a workflow", "help me build", "set up a workflow"

### Step 2: Execute (MCP tools)

When user wants to RUN an existing workflow:
1. **FIRST**: Verify `.claude/workflows/<name>/` exists
2. Read `start.md` for orchestrator protocol
3. Call `start_workflow` MCP if not already started
4. Execute phases per workflow.md

**Trigger phrases**: "run", "execute", "start", "launch", "begin"

### Pre-Execution Check

**BEFORE calling `start_workflow` MCP tool, ALWAYS verify:**
```bash
ls .claude/workflows/<workflow-name>/
```
If folder does NOT exist → invoke `workflow-architect` agent first.

### Workflow Commands

| Command | Action |
|---------|--------|
| "design workflow for X" | Invoke `workflow-architect` agent |
| "run workflow X" | Execute existing workflow via MCP |
| "workflow status" | `get_context({workflow_id, include: ["phase_summary"]})` |
| "continue workflow" | Resume from last completed phase |
| "abort workflow" | Fail workflow and document reason |

## Available Workflows

| Workflow | Path | Description |
|----------|------|-------------|
| `code-quality-review` | `.claude/workflows/code-quality-review/` | Analyze and fix code quality issues across all packages (SOLID, DRY, security, clean code) |

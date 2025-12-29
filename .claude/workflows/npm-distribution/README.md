# Workflow: npm-distribution

**Status**: Ready for execution (pending workflow_id)
**Profile**: complex (5 phases)
**Estimated Duration**: 9-14 hours

## Quick Start

### 1. Initialize Workflow (Get workflow_id)

The workflow files have been created but need a workflow_id from the MCP server.

**Option A: Via Claude Code with MCP connected**
```
User: "Start the npm-distribution workflow"
Claude: [Calls start_workflow MCP tool automatically]
```

**Option B: Manual via CLI (when implemented)**
```bash
# This will be available after Phase 4 is complete
mission-control workflow start npm-distribution
```

### 2. Update Files with workflow_id

Once you have the workflow_id, replace `{PENDING_MCP_CALL}` in:
- definition.md
- workflow.md
- start.md

### 3. Execute Workflow

```
User: "Execute the npm-distribution workflow"
Claude: [Reads start.md and begins orchestration]
```

## Workflow Overview

```
Phase 1: Analysis        (1-2h)  → feature-analyzer
   ↓
Phase 2: Config Package  (2-3h)  → config-implementer
   ↓
Phase 3: Migration       (2-3h)  → mcp-migrator + ui-migrator (parallel)
   ↓
Phase 4: CLI Package     (3-4h)  → cli-implementer
   ↓
Phase 5: Finalization    (1-2h)  → docs-implementer + test-implementer (parallel)
   ↓
[HUMAN CHECKPOINT]
```

## Key Features

- **Parallel Execution**: Phases 3 and 5 run multiple agents simultaneously
- **Context Management**: Automatic /compact after each phase
- **State Recovery**: Uses get_context to restore state after compaction
- **Human Checkpoint**: Phase 5 requires human approval before completion
- **Git Snapshots**: Each task captures git diff for accountability

## Deliverables

### New Packages
- `@mission-control/config` - TOML configuration with Zod validation
- `@mission-control/cli` - CLI with init/link/ui/doctor/config commands

### Modified Packages
- `@mission-control/mcp-server` - Uses centralized config
- `@mission-control/web-ui` - Uses centralized config

### Documentation
- Updated README.md with npm install instructions
- CHANGELOG.md with migration guide
- Package-specific READMEs

### Tests
- Unit tests for config package
- Unit tests for CLI commands
- Integration tests for complete flow

## Prerequisites

Before starting:
- [ ] All current tests pass: `pnpm test`
- [ ] Create safety branch: `git checkout -b npm-distribution-workflow`
- [ ] Read `.claude/plans/npm-distribution-plan.md`
- [ ] MCP server is connected (check `/mcp` in Claude Code)

## Monitoring Progress

During execution:
```
# Check phase summary
get_context({workflow_id, include: ["phase_summary"]})

# Check current tasks
get_context({workflow_id, include: ["tasks"], filter: {phase: N}})

# Check for blockers
get_context({workflow_id, include: ["blockers"]})
```

## Success Criteria

Workflow is complete when:
- [ ] All 5 phases completed
- [ ] All builds pass: `pnpm build`
- [ ] All tests pass: `pnpm test`
- [ ] Documentation updated
- [ ] Human review approved
- [ ] `complete_workflow` called with status "success"

## Troubleshooting

### MCP Server Not Connected
```bash
# Verify .mcp.json exists
cat .mcp.json

# Restart Claude Code
# Check /mcp command shows mission-control connected
```

### Context Overflow
```
Use /compact command
Then restore state: get_context({workflow_id, include: ["phase_summary"]})
```

### Subagent Failure
```
Check blockers: get_context({workflow_id, include: ["blockers"]})
Review error and provide guidance
Retry task if needed
```

## Related Files

- **Plan**: `.claude/plans/npm-distribution-plan.md`
- **Definition**: `definition.md` (objectives, scope, constraints)
- **Workflow**: `workflow.md` (phases, agents, prompts)
- **Orchestrator Guide**: `start.md` (execution protocol)

## References

- [Workflow System Architecture](~/.claude/docs/workflow-system/architecture.md)
- [MCP Tools Documentation](.claude/docs/mcp-tools.md)
- [NPM Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [pnpm Workspaces](https://pnpm.io/workspaces)

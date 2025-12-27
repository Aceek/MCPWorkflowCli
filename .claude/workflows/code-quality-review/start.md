# Start Workflow: Code Quality Review

**Workflow ID**: `<TO_BE_REGISTERED>`

## Orchestrator Protocol

### Pre-Execution

1. **Verify workflow registration**:
   - If workflow_id is `<TO_BE_REGISTERED>`, call `start_workflow` first
   - Update all workflow files with actual workflow_id

2. **Read workflow definition**:
   - Read `definition.md` for objectives and constraints
   - Read `workflow.md` for phase structure and agent prompts

3. **Create reports directory**:
   ```bash
   mkdir -p .claude/workflows/code-quality-review/reports
   ```

### Execution Sequence

#### Step 1: Register Workflow (if needed)

```
start_workflow({
  name: "code-quality-review",
  objective: "Perform comprehensive code quality analysis and remediation across all packages",
  profile: "STANDARD",
  total_phases: 3,
  scope: "packages/mcp-server, packages/shared, packages/web-ui (TypeScript files only)",
  constraints: "Conventional commits, atomic changes, no Claude Code mentions"
})
```

Store returned `workflow_id` and update all workflow files.

#### Step 2: Phase 1 - Analysis (Parallel)

Launch 3 sub-agents in parallel using Task tool:

**Task 1: mcp-server-analyzer**
```
Use Task tool with subagent_type: "general-purpose"
Provide full agent prompt from workflow.md Phase 1 Agent 1
Replace <TO_BE_REGISTERED> with actual workflow_id
```

**Task 2: shared-analyzer**
```
Use Task tool with subagent_type: "general-purpose"
Provide full agent prompt from workflow.md Phase 1 Agent 2
Replace <TO_BE_REGISTERED> with actual workflow_id
```

**Task 3: web-ui-analyzer**
```
Use Task tool with subagent_type: "general-purpose"
Provide full agent prompt from workflow.md Phase 1 Agent 3
Replace <TO_BE_REGISTERED> with actual workflow_id
```

**Wait for completion**: All 3 agents must complete before proceeding.

**Verify Phase 1 completion**:
- [ ] .claude/workflows/code-quality-review/reports/mcp-server-analysis.md exists
- [ ] .claude/workflows/code-quality-review/reports/shared-analysis.md exists
- [ ] .claude/workflows/code-quality-review/reports/web-ui-analysis.md exists

**Check for blockers**:
```
get_context({
  workflow_id: "<workflow_id>",
  include: ["blockers"],
  filter: { phase: 1 }
})
```

If blockers found → Request human review → HALT.

#### Step 3: Phase 2 - Corrections (Parallel)

Launch 3 sub-agents in parallel using Task tool:

**Task 1: mcp-server-fixer**
```
Use Task tool with subagent_type: "general-purpose"
Provide full agent prompt from workflow.md Phase 2 Agent 1
Replace <TO_BE_REGISTERED> with actual workflow_id
```

**Task 2: shared-fixer**
```
Use Task tool with subagent_type: "general-purpose"
Provide full agent prompt from workflow.md Phase 2 Agent 2
Replace <TO_BE_REGISTERED> with actual workflow_id
```

**Task 3: web-ui-fixer**
```
Use Task tool with subagent_type: "general-purpose"
Provide full agent prompt from workflow.md Phase 2 Agent 3
Replace <TO_BE_REGISTERED> with actual workflow_id
```

**Wait for completion**: All 3 agents must complete before proceeding.

**Verify Phase 2 completion**:
```bash
git log --oneline -20  # Verify atomic commits created
```

**Check for blockers**:
```
get_context({
  workflow_id: "<workflow_id>",
  include: ["blockers"],
  filter: { phase: 2 }
})
```

If blockers found → Request human review → HALT.

#### Step 4: Phase 3 - Final Review (Sequential)

Launch single sub-agent using Task tool:

**Task: quality-reviewer**
```
Use Task tool with subagent_type: "general-purpose"
Provide full agent prompt from workflow.md Phase 3 Agent
Replace <TO_BE_REGISTERED> with actual workflow_id
```

**Wait for completion**.

**Verify Phase 3 completion**:
- [ ] .claude/workflows/code-quality-review/final-review.md exists
- [ ] Final review status is APPROVED

**Check for blockers**:
```
get_context({
  workflow_id: "<workflow_id>",
  include: ["blockers"],
  filter: { phase: 3 }
})
```

If NOT APPROVED or blockers found → Request human review → HALT.

#### Step 5: Complete Workflow

```
complete_workflow({
  workflow_id: "<workflow_id>",
  status: "completed",
  summary: "Code quality review completed across 3 packages. Critical and high-priority issues addressed with atomic commits.",
  achievements: [
    "Analyzed X files across 3 packages",
    "Fixed Y critical/high priority issues",
    "Reduced code duplication by Z%",
    "Created N atomic commits following conventions",
    "Validated cross-package consistency"
  ],
  limitations: [
    "Medium/low priority issues deferred to future iterations"
  ]
})
```

### Error Handling

**If any agent fails**:
1. Review agent output and error messages
2. Check `get_context({include: ["blockers"]})` for details
3. If recoverable → Restart failed agent
4. If not recoverable → `complete_workflow({status: "failed", summary: "..."})`

**If breaking changes detected**:
1. Agent should use `log_issue({requires_human_review: true})`
2. Orchestrator halts workflow
3. Request human decision before proceeding

### Context Queries

**Phase summary**:
```
get_context({
  workflow_id: "<workflow_id>",
  include: ["phase_summary"]
})
```

**All decisions made**:
```
get_context({
  workflow_id: "<workflow_id>",
  include: ["decisions"]
})
```

**Key milestones**:
```
get_context({
  workflow_id: "<workflow_id>",
  include: ["milestones"]
})
```

### Human Checkpoints

Request human review at:
1. After Phase 1 if critical security issues found
2. After Phase 2 if breaking changes required
3. After Phase 3 if final review is NOT APPROVED

## Notes

- All agents use `subagent_type: "general-purpose"` (they write files)
- Phases 1 and 2 run agents in parallel for efficiency
- Phase 3 is sequential (requires Phase 2 completion)
- State management is 100% via MCP tools (no memory.md)
- Budget: ~18 MCP calls total (3 per phase × 3 agents + workflow start/complete + context queries)

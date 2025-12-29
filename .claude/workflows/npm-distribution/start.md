# Start Workflow: npm-distribution

**Workflow ID**: `cmjrsbohn0000fhythq59bjsh`
**Profile**: complex
**Total Phases**: 5

## Pre-Execution Checklist

- [ ] Read definition.md and workflow.md
- [ ] Verify workflow_id is obtained from `start_workflow` MCP call
- [ ] Confirm all tests currently pass: `pnpm test`
- [ ] Create safety branch: `git checkout -b npm-distribution-workflow`

## Orchestrator Protocol

### Context Management Strategy

**CRITICAL**: This is a 5-phase complex workflow. Context management is essential.

| Action | Trigger | Purpose |
|--------|---------|---------|
| `/compact` | After completing each phase | Free up context space |
| `/compact` | When context exceeds 50% capacity | Prevent context overflow |
| `get_context` | Before resuming after /compact | Restore state from MCP |
| `get_context` | At workflow start | Verify workflow_id validity |

### Execution Pattern (Direct Pattern with MCP State)

**Phase Execution Loop:**

```
FOR each phase (1 through 5):

  1. CONTEXT CHECK:
     - If context > 50% → /compact
     - Call get_context({workflow_id, include: ["phase_summary"]})
     - Verify previous phases completed

  2. START PHASE:
     start_phase({
       workflow_id: "{workflow_id}",
       number: <phase_number>,
       name: "<phase_name>",
       is_parallel: <true|false>
     }) → phase_id

  3. LAUNCH SUBAGENTS:
     - If parallel: Launch ALL agents via Task tool simultaneously
     - If sequential: Launch one agent via Task tool
     - Pass in prompt: workflow_id, phase_id, and full task instructions

  4. MONITOR PROGRESS:
     get_context({
       workflow_id: "{workflow_id}",
       include: ["tasks", "blockers"],
       filter: { phase: <phase_number> }
     })

     Check for:
     - Task completion status
     - Blockers with requires_human_review: true
     - Progress milestones

  5. HANDLE BLOCKERS:
     - If blocker.requires_human_review → STOP
     - Present blocker to human
     - Request guidance
     - Resume after resolution

  6. VERIFY COMPLETION:
     - For parallel phases: ALL agents must complete
     - Verify outputs exist (files created/modified)
     - Review task outcomes via get_context

  7. COMPLETE PHASE:
     complete_phase({
       phase_id: <phase_id>,
       status: "completed"
     })

  8. CONTEXT MANAGEMENT:
     /compact

END FOR
```

### Recovery Pattern (After /compact)

If context is cleared mid-workflow:

```
1. RESTORE STATE:
   get_context({
     workflow_id: "{workflow_id}",
     include: ["phase_summary", "tasks", "blockers"]
   })

2. IDENTIFY CURRENT PHASE:
   - phase_summary shows completed phases
   - Determine next phase to execute

3. VERIFY LAST TASK:
   get_context({
     workflow_id: "{workflow_id}",
     include: ["tasks"],
     filter: { phase: <current_phase> }
   })

   - If tasks incomplete → resume from last incomplete task
   - If tasks complete → proceed to next phase

4. RESUME EXECUTION:
   Continue from step 2 in Phase Execution Loop
```

### Phase-by-Phase Execution

#### Phase 1: Analysis and Structure

**Goal**: Analyze current structure and create migration plan.

**Actions**:
1. `start_phase({workflow_id, number: 1, name: "Analysis and Structure", is_parallel: false})`
2. Launch `feature-analyzer` via Task tool with prompt from workflow.md
3. Monitor via `get_context` every 2-3 minutes
4. Verify output: `.claude/analysis/npm-migration-analysis.md` exists
5. Read analysis document before proceeding
6. `complete_phase({phase_id, status: "completed"})`
7. `/compact`

**Expected Duration**: 1-2 hours

---

#### Phase 2: Config Package

**Goal**: Create `@mission-control/config` package.

**Actions**:
1. Restore state: `get_context({workflow_id, include: ["phase_summary"]})`
2. Verify Phase 1 completed
3. `start_phase({workflow_id, number: 2, name: "Config Package", is_parallel: false})`
4. Launch `config-implementer` via Task tool
5. Monitor progress
6. Verify build: `pnpm --filter @mission-control/config build`
7. Verify tests: `pnpm --filter @mission-control/config test`
8. `complete_phase({phase_id, status: "completed"})`
9. `/compact`

**Expected Duration**: 2-3 hours

---

#### Phase 3: Migrate Existing Packages (PARALLEL)

**Goal**: Migrate mcp-server and web-ui to use config package.

**Actions**:
1. Restore state: `get_context({workflow_id, include: ["phase_summary"]})`
2. Verify Phase 2 completed
3. `start_phase({workflow_id, number: 3, name: "Migrate Existing Packages", is_parallel: true})`
4. Launch BOTH agents in parallel:
   - Task 1: `mcp-migrator` (packages/mcp-server/)
   - Task 2: `ui-migrator` (packages/web-ui/)
5. Monitor both tasks:
   ```
   get_context({
     workflow_id,
     include: ["tasks", "blockers"],
     filter: { phase: 3 }
   })
   ```
6. Ensure BOTH complete before proceeding
7. Verify builds:
   - `pnpm --filter @mission-control/mcp-server build`
   - `pnpm --filter @mission-control/web-ui build`
8. `complete_phase({phase_id, status: "completed"})`
9. `/compact`

**Expected Duration**: 2-3 hours (parallel execution)

---

#### Phase 4: CLI Package

**Goal**: Create `@mission-control/cli` package with all commands.

**Actions**:
1. Restore state: `get_context({workflow_id, include: ["phase_summary"]})`
2. Verify Phase 3 completed
3. `start_phase({workflow_id, number: 4, name: "CLI Package", is_parallel: false})`
4. Launch `cli-implementer` via Task tool
5. Monitor progress with special attention to:
   - Each command implementation (init, link, ui, doctor, config)
   - Bin entry point creation
   - Test coverage
6. Verify build: `pnpm --filter @mission-control/cli build`
7. Test CLI manually:
   ```bash
   node packages/cli/bin/mission-control.js --help
   node packages/cli/bin/mission-control.js doctor --help
   ```
8. `complete_phase({phase_id, status: "completed"})`
9. `/compact`

**Expected Duration**: 3-4 hours

---

#### Phase 5: Finalization (PARALLEL + Human Checkpoint)

**Goal**: Complete documentation and integration tests, then human review.

**Actions**:
1. Restore state: `get_context({workflow_id, include: ["phase_summary"]})`
2. Verify Phase 4 completed
3. `start_phase({workflow_id, number: 5, name: "Finalization", is_parallel: true})`
4. Launch BOTH agents in parallel:
   - Task 1: `docs-implementer` (documentation)
   - Task 2: `test-implementer` (integration tests)
5. Monitor both tasks
6. Ensure both complete
7. Run all tests: `pnpm test`
8. `complete_phase({phase_id, status: "completed"})`
9. `/compact`
10. **HUMAN CHECKPOINT** - Generate summary report
11. STOP and await human approval
12. After approval → `complete_workflow`

**Expected Duration**: 1-2 hours + human review time

---

### Human Checkpoint Report Template

After Phase 5 completes, generate this report:

```markdown
# Workflow npm-distribution - Ready for Review

**Workflow ID**: {workflow_id}
**Status**: Awaiting human approval
**Completed**: {timestamp}

## Phases Summary

{Get from get_context phase_summary}

## Key Achievements

{Extracted from task outcomes across all phases}

## Files Created

{List new files from git diff}

## Files Modified

{List modified files from git diff}

## Test Results

- Unit Tests: {pass/fail count}
- Integration Tests: {pass/fail count}
- Coverage: {percentage}

## Build Status

- @mission-control/config: {pass/fail}
- @mission-control/cli: {pass/fail}
- @mission-control/mcp-server: {pass/fail}
- @mission-control/web-ui: {pass/fail}

## NPM Publication Checklist

Review before publishing:

- [ ] package.json files have correct name, version, description
- [ ] bin entries are correct and executable
- [ ] files arrays include dist/, bin/, prisma/
- [ ] dependencies are correct (workspace:* for internal)
- [ ] README.md exists in each package
- [ ] LICENSE file present
- [ ] CHANGELOG.md complete
- [ ] .npmignore or files field configured
- [ ] No sensitive data in published files

## Issues Requiring Human Review

{List any blockers logged during workflow}

## Recommendations

{Any suggestions from agents about next steps}

---

**Action Required**: Please review the above and either:
1. Approve → I will call complete_workflow
2. Request changes → I will create follow-up tasks
```

---

### Completion

When human approves:

```
complete_workflow({
  workflow_id: "{workflow_id}",
  status: "success",
  summary: "Successfully restructured Mission Control for NPM distribution",
  achievements: [
    "Created @mission-control/config package with TOML support",
    "Created @mission-control/cli with 5 commands",
    "Migrated mcp-server and web-ui to use centralized config",
    "Comprehensive documentation and integration tests",
    "Ready for NPM publication"
  ],
  recommendations: [
    "Test npm publish in dry-run mode",
    "Create GitHub release with changelog",
    "Update main documentation with new installation flow"
  ]
})
```

---

## Error Handling

### If Subagent Fails

1. Check blocker via `get_context({workflow_id, include: ["blockers"]})`
2. If technical issue → provide guidance and retry
3. If requires human → STOP and escalate
4. Log decision about resolution approach

### If Build Fails

1. Review error logs
2. Log as blocker requiring review
3. Don't proceed to next phase until resolved

### If Test Fails

1. Identify failing test
2. Determine if blocker or known limitation
3. Log issue with requires_human_review: true
4. STOP until resolved

---

## MCP Budget Guidelines

This workflow will execute ~15-20 MCP calls total:

| Phase | MCP Calls | Tools Used |
|-------|-----------|------------|
| 1 | 2-3 | start_phase, complete_phase, get_context |
| 2 | 2-3 | start_phase, complete_phase, get_context |
| 3 | 3-4 | start_phase, complete_phase, get_context (multiple) |
| 4 | 2-3 | start_phase, complete_phase, get_context |
| 5 | 3-4 | start_phase, complete_phase, get_context (multiple) |
| Subagents | ~4 each | start_task, log_*, complete_task |

**Total**: ~12-17 orchestrator calls + ~60 subagent calls

Stay within MCP budget (3-6 calls per task for subagents).

---

## Success Verification

After workflow completes, verify:

```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Test CLI
node packages/cli/bin/mission-control.js --version
node packages/cli/bin/mission-control.js --help

# Verify package.json files
cat packages/config/package.json
cat packages/cli/package.json

# Check documentation
ls README.md CHANGELOG.md
ls packages/*/README.md
```

All must succeed before workflow is truly complete.

# Start Workflow: Code Quality Review

**Workflow ID**: `<PENDING_start_workflow_call>`

## Orchestrator Protocol

You are the orchestrator for a 3-phase workflow with parallel execution in phases 1 and 2.

### Pre-Execution Checklist
1. [ ] Read .claude/workflows/code-quality-review/definition.md
2. [ ] Read .claude/workflows/code-quality-review/workflow.md
3. [ ] Verify workflow_id is set (obtained from start_workflow MCP call)
4. [ ] Understand scope isolation rules

### Execution Flow

#### Phase 1: Parallel Analysis (3 agents)

```
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 1,
     caller_type: "orchestrator",
     name: "Phase 1: Parallel Quality Analysis",
     goal: "Analyze all 3 packages for quality issues"
   }) → task_id

2. Launch 3 sub-agents IN PARALLEL (single message, 3 Task calls):
   a. Task({
        subagent_type: "general-purpose",
        prompt: [quality-analyzer-mcp prompt from workflow.md]
      })
   b. Task({
        subagent_type: "general-purpose",
        prompt: [quality-analyzer-shared prompt from workflow.md]
      })
   c. Task({
        subagent_type: "general-purpose",
        prompt: [quality-analyzer-webui prompt from workflow.md]
      })

3. Wait for all 3 agents to complete

4. complete_task({
     task_id: "<task_id>",
     status: "success",
     outcome: {
       summary: "All 3 packages analyzed",
       achievements: [
         "analysis-mcp-server.md created",
         "analysis-shared.md created",
         "analysis-web-ui.md created"
       ]
     },
     phase_complete: true
   })

5. Check for blockers:
   get_context({
     workflow_id: "<workflow_id>",
     include: ["blockers"],
     filter: { phase: 1 }
   })

   IF blockers found → STOP and request human help
```

#### Phase 2: Parallel Correction (3 agents)

```
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 2,
     caller_type: "orchestrator",
     name: "Phase 2: Parallel Quality Correction",
     goal: "Fix issues in all 3 packages with conventional commits"
   }) → task_id

2. Launch 3 sub-agents IN PARALLEL:
   a. Task({
        subagent_type: "general-purpose",
        prompt: [quality-corrector-mcp prompt from workflow.md]
      })
   b. Task({
        subagent_type: "general-purpose",
        prompt: [quality-corrector-shared prompt from workflow.md]
      })
   c. Task({
        subagent_type: "general-purpose",
        prompt: [quality-corrector-webui prompt from workflow.md]
      })

3. Wait for all 3 agents to complete

4. complete_task({
     task_id: "<task_id>",
     status: "success",
     outcome: {
       summary: "All 3 packages corrected",
       achievements: [
         "correction-report-mcp-server.md created",
         "correction-report-shared.md created",
         "correction-report-web-ui.md created",
         "X conventional commits pushed"
       ]
     },
     phase_complete: true
   })

5. Check for blockers:
   get_context({
     workflow_id: "<workflow_id>",
     include: ["blockers"],
     filter: { phase: 2 }
   })

   IF blockers found → STOP and request human help
```

#### Phase 3: Final Review (1 agent)

```
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 3,
     caller_type: "orchestrator",
     name: "Phase 3: Final Quality Review",
     goal: "Validate all corrections meet success criteria"
   }) → task_id

2. Launch quality-reviewer agent:
   Task({
     subagent_type: "general-purpose",
     prompt: [quality-reviewer prompt from workflow.md]
   })

3. Wait for agent to complete

4. complete_task({
     task_id: "<task_id>",
     status: "success",
     outcome: {
       summary: "Final review completed",
       achievements: ["final-quality-report.md created", "All success criteria validated"]
     },
     phase_complete: true
   })

5. Check for blockers:
   get_context({
     workflow_id: "<workflow_id>",
     include: ["blockers"],
     filter: { phase: 3 }
   })

   IF blockers found → STOP and request human help
```

#### Workflow Completion

```
complete_workflow({
  workflow_id: "<workflow_id>",
  status: "completed",
  summary: "Comprehensive code quality review completed across all 3 packages with X issues identified and Y corrected",
  achievements: [
    "3 detailed analysis reports",
    "3 correction reports with conventional commits",
    "Final quality validation approved",
    "All tests passing",
    "Zero Claude Code mentions in commits"
  ]
})
```

### Error Handling

**If any sub-agent reports failure:**
1. Read their error summary
2. Determine if retry possible or human intervention needed
3. If critical blocker → log_issue and STOP
4. If recoverable → retry with adjusted parameters

**If tests fail in Phase 2:**
1. Sub-agent must log_issue with requires_human_review: true
2. Orchestrator detects via get_context
3. STOP and request human to review test failures

**If final review shows NEEDS_REVISION:**
1. Orchestrator reads final-quality-report.md
2. Determines if additional correction phase needed
3. Consults human for next steps

### Context Management

- This is a 3-phase workflow with parallelism
- NO /clear needed (total context manageable)
- Each sub-agent queries only their relevant context
- Orchestrator tracks phase completion via complete_task

### Validation Before Start

CRITICAL CHECKS:
- [ ] workflow_id obtained from start_workflow call
- [ ] All definition.md and workflow.md files have workflow_id populated
- [ ] Git repository is clean (no uncommitted changes from previous work)
- [ ] Tests currently pass (baseline)

### Orchestrator Responsibilities

**YOU MUST:**
- Read definition.md and workflow.md at start
- Execute phases sequentially (1 → 2 → 3)
- Launch parallel agents within phases 1 and 2
- Track each phase with start_task and complete_task
- Check for blockers after each phase
- NEVER delegate orchestration to sub-agents
- Call complete_workflow when all phases done

**YOU MUST NOT:**
- Skip phases
- Allow sub-agents to work outside their scope
- Continue if blockers detected
- Modify workflow scope without human approval

### MCP Call Budget

Expected MCP calls by orchestrator:
- Phase 1: start_task + complete_task + get_context (blockers) = 3 calls
- Phase 2: start_task + complete_task + get_context (blockers) = 3 calls
- Phase 3: start_task + complete_task + get_context (blockers) = 3 calls
- Workflow end: complete_workflow = 1 call

Total: ~10 MCP calls by orchestrator
Sub-agents: ~3-5 calls each (start_task, log_milestone, complete_task)

### Ready to Execute?

When human says "start workflow" or "execute workflow":
1. Verify workflow_id is set in all files
2. Begin with Phase 1 per protocol above
3. Report progress after each phase
4. Request human review if any blockers detected

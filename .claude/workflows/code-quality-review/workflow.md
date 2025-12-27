# Workflow: Code Quality Review

**Workflow ID**: `<TO_BE_REGISTERED>`

## Schema

```
┌─────────────────────────────────────────────────────┐
│              Phase 1: Analysis                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ mcp-server   │ │   shared     │ │   web-ui    │ │
│  │   analyzer   │ │   analyzer   │ │  analyzer   │ │
│  └──────────────┘ └──────────────┘ └─────────────┘ │
│         │                 │                │         │
│         └─────────────────┴────────────────┘         │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│             Phase 2: Corrections                    │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ mcp-server   │ │   shared     │ │   web-ui    │ │
│  │    fixer     │ │    fixer     │ │    fixer    │ │
│  └──────────────┘ └──────────────┘ └─────────────┘ │
│         │                 │                │         │
│         └─────────────────┴────────────────┘         │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│            Phase 3: Final Review                    │
│              ┌──────────────────┐                   │
│              │ quality-reviewer │                   │
│              └──────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

## Phases

### Phase 1: Analysis (Parallel)

Three parallel agents analyze their respective packages.

#### Agent 1: mcp-server-analyzer

```yaml
phase:
  number: 1
  name: "Package Analysis"
  agents:
    - type: Task
      subagent_type: "general-purpose"
      scope: "packages/mcp-server/src"
  completion: "Analysis report written to .claude/workflows/code-quality-review/reports/mcp-server-analysis.md"
```

**Agent Prompt:**

```
WORKFLOW_ID: <TO_BE_REGISTERED>
PHASE: 1
CALLER_TYPE: subagent
AGENT_NAME: mcp-server-analyzer

TASK: Analyze code quality in packages/mcp-server/src

SCOPE:
- packages/mcp-server/src/**/*.ts

ANALYSIS CRITERIA:
1. SOLID Principles violations
2. Code duplication (DRY)
3. Security vulnerabilities (secrets, SQL injection, unsafe operations)
4. Clean code metrics:
   - Files >400 lines
   - Functions >50 lines
   - Poor naming conventions
   - Missing error handling

OUTPUT: Write detailed analysis report to:
.claude/workflows/code-quality-review/reports/mcp-server-analysis.md

REPORT FORMAT:
# mcp-server Analysis

## Summary
- Total files analyzed: X
- Issues found: Y
- Severity breakdown: Critical/High/Medium/Low

## Critical Issues
[File path]: [Issue description]

## High Priority
[File path]: [Issue description]

## Medium Priority
[File path]: [Issue description]

## Recommendations
- Priority 1: [Action]
- Priority 2: [Action]

MCP PROTOCOL:
1. start_task({
     workflow_id: "<TO_BE_REGISTERED>",
     phase: 1,
     caller_type: "subagent",
     agent_name: "mcp-server-analyzer",
     name: "Analyze mcp-server package",
     goal: "Identify code quality issues in mcp-server",
     areas: ["packages/mcp-server"]
   })
2. Perform analysis
3. Write report
4. complete_task({
     task_id: "<from_start_task>",
     status: "success",
     outcome: {
       summary: "Analyzed X files, found Y issues",
       achievements: ["Generated detailed analysis report"],
       manual_review_needed: false
     },
     phase_complete: false
   })
```

#### Agent 2: shared-analyzer

```yaml
phase:
  number: 1
  name: "Package Analysis"
  agents:
    - type: Task
      subagent_type: "general-purpose"
      scope: "packages/shared/src"
  completion: "Analysis report written to .claude/workflows/code-quality-review/reports/shared-analysis.md"
```

**Agent Prompt:**

```
WORKFLOW_ID: <TO_BE_REGISTERED>
PHASE: 1
CALLER_TYPE: subagent
AGENT_NAME: shared-analyzer

TASK: Analyze code quality in packages/shared/src

SCOPE:
- packages/shared/src/**/*.ts

ANALYSIS CRITERIA:
[Same as Agent 1]

OUTPUT: Write detailed analysis report to:
.claude/workflows/code-quality-review/reports/shared-analysis.md

MCP PROTOCOL:
1. start_task({
     workflow_id: "<TO_BE_REGISTERED>",
     phase: 1,
     caller_type: "subagent",
     agent_name: "shared-analyzer",
     name: "Analyze shared package",
     goal: "Identify code quality issues in shared",
     areas: ["packages/shared"]
   })
2. Perform analysis
3. Write report
4. complete_task({
     task_id: "<from_start_task>",
     status: "success",
     outcome: {
       summary: "Analyzed X files, found Y issues",
       achievements: ["Generated detailed analysis report"],
       manual_review_needed: false
     },
     phase_complete: false
   })
```

#### Agent 3: web-ui-analyzer

```yaml
phase:
  number: 1
  name: "Package Analysis"
  agents:
    - type: Task
      subagent_type: "general-purpose"
      scope: "packages/web-ui/src"
  completion: "Analysis report written to .claude/workflows/code-quality-review/reports/web-ui-analysis.md"
```

**Agent Prompt:**

```
WORKFLOW_ID: <TO_BE_REGISTERED>
PHASE: 1
CALLER_TYPE: subagent
AGENT_NAME: web-ui-analyzer

TASK: Analyze code quality in packages/web-ui/src

SCOPE:
- packages/web-ui/src/**/*.ts
- packages/web-ui/src/**/*.tsx

ANALYSIS CRITERIA:
[Same as Agent 1, plus React-specific issues]

OUTPUT: Write detailed analysis report to:
.claude/workflows/code-quality-review/reports/web-ui-analysis.md

MCP PROTOCOL:
1. start_task({
     workflow_id: "<TO_BE_REGISTERED>",
     phase: 1,
     caller_type: "subagent",
     agent_name: "web-ui-analyzer",
     name: "Analyze web-ui package",
     goal: "Identify code quality issues in web-ui",
     areas: ["packages/web-ui"]
   })
2. Perform analysis
3. Write report
4. complete_task({
     task_id: "<from_start_task>",
     status: "success",
     outcome: {
       summary: "Analyzed X files, found Y issues",
       achievements: ["Generated detailed analysis report"],
       manual_review_needed: false
     },
     phase_complete: true
   })
```

---

### Phase 2: Corrections (Parallel)

Three parallel agents fix issues in their respective packages based on Phase 1 reports.

#### Agent 1: mcp-server-fixer

```yaml
phase:
  number: 2
  name: "Apply Fixes"
  agents:
    - type: Task
      subagent_type: "general-purpose"
      scope: "packages/mcp-server/src"
  completion: "All high/critical issues fixed, commits created"
```

**Agent Prompt:**

```
WORKFLOW_ID: <TO_BE_REGISTERED>
PHASE: 2
CALLER_TYPE: subagent
AGENT_NAME: mcp-server-fixer

TASK: Fix code quality issues in packages/mcp-server/src

INPUT: Read analysis report from Phase 1:
.claude/workflows/code-quality-review/reports/mcp-server-analysis.md

SCOPE:
- packages/mcp-server/src/**/*.ts

PRIORITY:
1. Critical issues (security vulnerabilities)
2. High priority (SOLID violations, major duplication)
3. Medium priority (clean code metrics)

COMMIT RULES:
- Conventional commits: type(scope): description
- English only
- Atomic commits (one logical change)
- No "Claude Code" mentions
- Examples:
  * refactor(tools): extract common validation logic
  * fix(security): remove hardcoded credentials
  * refactor(utils): split large file into modules

MCP PROTOCOL:
1. start_task({
     workflow_id: "<TO_BE_REGISTERED>",
     phase: 2,
     caller_type: "subagent",
     agent_name: "mcp-server-fixer",
     name: "Fix mcp-server issues",
     goal: "Apply corrections based on analysis",
     areas: ["packages/mcp-server"]
   })
2. Read analysis report
3. Fix issues with atomic commits
4. log_decision() for significant architectural changes
5. complete_task({
     task_id: "<from_start_task>",
     status: "success",
     outcome: {
       summary: "Fixed X critical, Y high, Z medium issues",
       achievements: ["Created N atomic commits", "Reduced duplication by X%"],
       limitations: ["Low priority issues deferred"],
       manual_review_needed: false
     },
     phase_complete: false
   })
```

#### Agent 2: shared-fixer

```yaml
phase:
  number: 2
  name: "Apply Fixes"
  agents:
    - type: Task
      subagent_type: "general-purpose"
      scope: "packages/shared/src"
  completion: "All high/critical issues fixed, commits created"
```

**Agent Prompt:**

```
WORKFLOW_ID: <TO_BE_REGISTERED>
PHASE: 2
CALLER_TYPE: subagent
AGENT_NAME: shared-fixer

TASK: Fix code quality issues in packages/shared/src

INPUT: Read analysis report from Phase 1:
.claude/workflows/code-quality-review/reports/shared-analysis.md

SCOPE:
- packages/shared/src/**/*.ts

[Same structure as mcp-server-fixer]

MCP PROTOCOL:
1. start_task({
     workflow_id: "<TO_BE_REGISTERED>",
     phase: 2,
     caller_type: "subagent",
     agent_name: "shared-fixer",
     name: "Fix shared issues",
     goal: "Apply corrections based on analysis",
     areas: ["packages/shared"]
   })
2. Read analysis report
3. Fix issues with atomic commits
4. log_decision() for significant architectural changes
5. complete_task({
     task_id: "<from_start_task>",
     status: "success",
     outcome: {
       summary: "Fixed X critical, Y high, Z medium issues",
       achievements: ["Created N atomic commits", "Reduced duplication by X%"],
       manual_review_needed: false
     },
     phase_complete: false
   })
```

#### Agent 3: web-ui-fixer

```yaml
phase:
  number: 2
  name: "Apply Fixes"
  agents:
    - type: Task
      subagent_type: "general-purpose"
      scope: "packages/web-ui/src"
  completion: "All high/critical issues fixed, commits created"
```

**Agent Prompt:**

```
WORKFLOW_ID: <TO_BE_REGISTERED>
PHASE: 2
CALLER_TYPE: subagent
AGENT_NAME: web-ui-fixer

TASK: Fix code quality issues in packages/web-ui/src

INPUT: Read analysis report from Phase 1:
.claude/workflows/code-quality-review/reports/web-ui-analysis.md

SCOPE:
- packages/web-ui/src/**/*.ts
- packages/web-ui/src/**/*.tsx

[Same structure as mcp-server-fixer]

MCP PROTOCOL:
1. start_task({
     workflow_id: "<TO_BE_REGISTERED>",
     phase: 2,
     caller_type: "subagent",
     agent_name: "web-ui-fixer",
     name: "Fix web-ui issues",
     goal: "Apply corrections based on analysis",
     areas: ["packages/web-ui"]
   })
2. Read analysis report
3. Fix issues with atomic commits
4. log_decision() for significant architectural changes
5. complete_task({
     task_id: "<from_start_task>",
     status: "success",
     outcome: {
       summary: "Fixed X critical, Y high, Z medium issues",
       achievements: ["Created N atomic commits", "Reduced duplication by X%"],
       manual_review_needed: false
     },
     phase_complete: true
   })
```

---

### Phase 3: Final Review (Sequential)

Single agent performs comprehensive cross-package review.

#### Agent: quality-reviewer

```yaml
phase:
  number: 3
  name: "Final Review"
  agents:
    - type: Task
      subagent_type: "general-purpose"
      scope: "packages/"
  completion: "Final review report completed, workflow ready for completion"
```

**Agent Prompt:**

```
WORKFLOW_ID: <TO_BE_REGISTERED>
PHASE: 3
CALLER_TYPE: subagent
AGENT_NAME: quality-reviewer

TASK: Perform comprehensive final review of all corrections

INPUT:
- Read all Phase 1 analysis reports
- Review all commits from Phase 2
- Use get_context() to retrieve decisions and issues

SCOPE:
- All packages (cross-package consistency check)

VALIDATION CRITERIA:
1. All critical and high-priority issues addressed
2. No new issues introduced
3. Cross-package consistency:
   - Shared utilities properly used
   - No forbidden imports
   - Consistent patterns across packages
4. Commit quality:
   - Conventional commits format
   - Atomic changes
   - No Claude Code mentions
5. Code quality metrics improved:
   - Duplication reduced
   - File/function sizes compliant
   - SOLID principles respected

OUTPUT: Write final review report to:
.claude/workflows/code-quality-review/final-review.md

REPORT FORMAT:
# Final Code Quality Review

## Summary
- Total issues addressed: X
- Cross-package consistency: PASS/FAIL
- Code quality improvement: X%

## Validation Results
- [x] All critical issues fixed
- [x] All high-priority issues fixed
- [ ] Medium issues (X deferred)

## Cross-Package Analysis
- Shared utilities: [status]
- Import boundaries: [status]
- Pattern consistency: [status]

## Commit Quality
- Total commits: X
- Format compliance: 100%
- Atomicity: [assessment]

## Recommendations for Future
1. [Recommendation]
2. [Recommendation]

## Approval Status
APPROVED / REQUIRES REVISION

MCP PROTOCOL:
1. start_task({
     workflow_id: "<TO_BE_REGISTERED>",
     phase: 3,
     caller_type: "subagent",
     agent_name: "quality-reviewer",
     name: "Final quality review",
     goal: "Validate all corrections and cross-package consistency",
     areas: ["packages/mcp-server", "packages/shared", "packages/web-ui"]
   })
2. get_context({
     workflow_id: "<TO_BE_REGISTERED>",
     include: ["decisions", "milestones", "phase_summary"]
   })
3. Review all changes and reports
4. Write final review report
5. complete_task({
     task_id: "<from_start_task>",
     status: "success",
     outcome: {
       summary: "Quality review completed, all validations passed",
       achievements: [
         "Verified X issues fixed",
         "Confirmed cross-package consistency",
         "Validated commit quality"
       ],
       next_steps: ["Workflow ready for completion"],
       manual_review_needed: false
     },
     phase_complete: true
   })
```

---

## Blocker Escalation

If any agent encounters blockers:

1. Use `log_issue()` with `requires_human_review: true`
2. Document the blocker clearly
3. Orchestrator will detect via `get_context({include: ["blockers"]})`
4. Halt workflow and request human intervention

## Success Metrics

- Phase 1: 3 analysis reports generated
- Phase 2: 3+ atomic commits per package, 30%+ duplication reduction
- Phase 3: Final review APPROVED status

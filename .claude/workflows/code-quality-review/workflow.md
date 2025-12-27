# Workflow: Code Quality Review

**Workflow ID**: `<PENDING_start_workflow_call>`
**Total Phases**: 3

## Schema
```
┌──────────────────────────────────────────────────────────┐
│                    Phase 1: Analysis                     │
│                      (Parallel)                          │
├──────────────────┬──────────────────┬────────────────────┤
│  Analyzer MCP    │  Analyzer Shared │  Analyzer Web-UI   │
│  (mcp-server/)   │  (shared/)       │  (web-ui/)         │
└────────┬─────────┴────────┬─────────┴────────┬───────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│                  Phase 2: Correction                     │
│                      (Parallel)                          │
├──────────────────┬──────────────────┬────────────────────┤
│  Corrector MCP   │  Corrector       │  Corrector Web-UI  │
│  (mcp-server/)   │  Shared          │  (web-ui/)         │
│                  │  (shared/)       │                    │
└────────┬─────────┴────────┬─────────┴────────┬───────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  Phase 3: Final │
                   │  Quality Review │
                   └─────────────────┘
```

## Phases

### Phase 1: Parallel Analysis

```yaml
phase:
  id: analyze
  number: 1
  name: "Quality Analysis (Parallel)"
  description: "Analyze each service independently for SOLID, DRY, security, and clean code violations"
  agents:
    - type: quality-analyzer-mcp
      subagent_type: "general-purpose"
      scope: "packages/mcp-server/"
    - type: quality-analyzer-shared
      subagent_type: "general-purpose"
      scope: "packages/shared/"
    - type: quality-analyzer-webui
      subagent_type: "general-purpose"
      scope: "packages/web-ui/"
  parallel: true
  outputs:
    - analysis-mcp-server.md
    - analysis-shared.md
    - analysis-web-ui.md
  completion: "All 3 analysis reports generated with categorized findings"
```

#### Agent Prompt: quality-analyzer-mcp
```
WORKFLOW_ID: <workflow_id>
PHASE: 1
CALLER_TYPE: subagent
AGENT_NAME: quality-analyzer-mcp

TASK: Analyze packages/mcp-server/ for code quality issues
READ: .claude/workflows/code-quality-review/definition.md
SCOPE: packages/mcp-server/ (tools, websocket, utils, database)

ANALYSIS CATEGORIES:
1. SOLID Principles
   - Single Responsibility: Files/classes doing too much
   - Open/Closed: Hard-coded values preventing extension
   - Liskov Substitution: Improper inheritance
   - Interface Segregation: Fat interfaces
   - Dependency Inversion: Direct dependencies on concrete implementations

2. DRY (Don't Repeat Yourself)
   - Code duplication (same logic in multiple places)
   - Copy-paste patterns
   - Opportunities for abstraction

3. Security
   - Input validation gaps
   - SQL injection risks
   - Error messages leaking sensitive info
   - Missing authentication/authorization checks

4. Clean Code
   - Files > 300 lines
   - Functions > 50 lines
   - Unclear variable/function names
   - Complex nested logic (cyclomatic complexity)
   - Missing error handling

DELIVERABLES:
1. Comprehensive analysis report: .claude/workflows/code-quality-review/analysis-mcp-server.md
2. Issues categorized by severity (critical, high, medium, low)
3. Specific file locations and line numbers
4. Suggested refactoring approaches

OUTPUT FORMAT:
# Quality Analysis: MCP Server

## Executive Summary
- Total issues: X
- Critical: Y | High: Z | Medium: A | Low: B

## SOLID Violations
### Single Responsibility
- **File**: path/to/file.ts:LINE
  - **Issue**: Description
  - **Impact**: Why it matters
  - **Suggestion**: How to fix

[Continue for each category...]

MCP PROTOCOL:
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 1,
     caller_type: "subagent",
     agent_name: "quality-analyzer-mcp",
     name: "Analyze MCP Server Quality",
     goal: "Identify all code quality issues in packages/mcp-server/",
     areas: ["packages/mcp-server"]
   })
2. [During analysis]
   - log_milestone({task_id, message: "Analyzed tools/", progress: 33})
   - log_decision({task_id, category: "approach", question: "Analysis depth", chosen: "Deep file-by-file review", reasoning: "Comprehensive quality baseline needed"})
3. complete_task({
     task_id: "<task_id>",
     status: "success",
     outcome: {
       summary: "Identified X issues across Y files in mcp-server package",
       achievements: ["Analysis report generated", "Issues categorized by severity"]
     },
     phase_complete: true
   })
```

#### Agent Prompt: quality-analyzer-shared
```
WORKFLOW_ID: <workflow_id>
PHASE: 1
CALLER_TYPE: subagent
AGENT_NAME: quality-analyzer-shared

TASK: Analyze packages/shared/ for code quality issues
READ: .claude/workflows/code-quality-review/definition.md
SCOPE: packages/shared/ (Prisma schema, shared types, utilities)

[Same analysis categories and format as quality-analyzer-mcp]

OUTPUT: .claude/workflows/code-quality-review/analysis-shared.md

MCP PROTOCOL:
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 1,
     caller_type: "subagent",
     agent_name: "quality-analyzer-shared",
     name: "Analyze Shared Package Quality",
     goal: "Identify all code quality issues in packages/shared/",
     areas: ["packages/shared"]
   })
2. [Work with milestones]
3. complete_task({task_id, status: "success", outcome: {...}, phase_complete: true})
```

#### Agent Prompt: quality-analyzer-webui
```
WORKFLOW_ID: <workflow_id>
PHASE: 1
CALLER_TYPE: subagent
AGENT_NAME: quality-analyzer-webui

TASK: Analyze packages/web-ui/ for code quality issues
READ: .claude/workflows/code-quality-review/definition.md
SCOPE: packages/web-ui/ (components, hooks, lib, api routes)

[Same analysis categories and format as quality-analyzer-mcp]

OUTPUT: .claude/workflows/code-quality-review/analysis-web-ui.md

MCP PROTOCOL:
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 1,
     caller_type: "subagent",
     agent_name: "quality-analyzer-webui",
     name: "Analyze Web UI Quality",
     goal: "Identify all code quality issues in packages/web-ui/",
     areas: ["packages/web-ui"]
   })
2. [Work with milestones]
3. complete_task({task_id, status: "success", outcome: {...}, phase_complete: true})
```

---

### Phase 2: Parallel Correction

```yaml
phase:
  id: correct
  number: 2
  name: "Quality Correction (Parallel)"
  description: "Fix identified issues in each service independently with atomic commits"
  requires: 1
  agents:
    - type: quality-corrector-mcp
      subagent_type: "general-purpose"
      scope: "packages/mcp-server/"
    - type: quality-corrector-shared
      subagent_type: "general-purpose"
      scope: "packages/shared/"
    - type: quality-corrector-webui
      subagent_type: "general-purpose"
      scope: "packages/web-ui/"
  parallel: true
  outputs:
    - Git commits (conventional, English, no Claude Code mentions)
    - correction-report-mcp-server.md
    - correction-report-shared.md
    - correction-report-web-ui.md
  completion: "All critical/high issues corrected, tests passing, commits pushed"
```

#### Agent Prompt: quality-corrector-mcp
```
WORKFLOW_ID: <workflow_id>
PHASE: 2
CALLER_TYPE: subagent
AGENT_NAME: quality-corrector-mcp

TASK: Fix code quality issues in packages/mcp-server/
READ:
  - .claude/workflows/code-quality-review/definition.md
  - .claude/workflows/code-quality-review/analysis-mcp-server.md
SCOPE: packages/mcp-server/

CORRECTION PROTOCOL:
1. Read analysis report from Phase 1
2. Prioritize: Critical > High > Medium > Low
3. For each issue:
   a. Fix code
   b. Verify tests pass
   c. Create atomic commit with conventional format
   d. Log milestone

COMMIT FORMAT (REQUIRED):
type(scope): description

Examples:
- refactor(tools): extract duplicate validation logic
- fix(websocket): add input validation for user messages
- refactor(database): split large query builder into smaller functions
- fix(auth): prevent SQL injection in user lookup

FORBIDDEN:
- NO "Generated with Claude Code" mentions
- NO co-authored-by Claude
- NO emojis in commits

GIT WORKFLOW:
1. Stage changes: git add <files>
2. Commit: git commit -m "type(scope): description"
3. Continue to next issue
4. After all corrections: git push

DELIVERABLES:
1. All critical and high severity issues fixed
2. Conventional commits for each logical change
3. Correction report: .claude/workflows/code-quality-review/correction-report-mcp-server.md
4. Tests passing

CORRECTION REPORT FORMAT:
# Correction Report: MCP Server

## Summary
- Issues addressed: X / Y total
- Commits created: Z
- Tests status: PASSING/FAILING

## Corrections Applied
### Critical Issues
- [x] File: path/to/file.ts:LINE - Issue description
  - Commit: abc1234 - refactor(tools): extract validation
  - Result: Code now follows SRP

[Continue for each severity level...]

## Deferred Issues
- [ ] Low priority issue - Reason for deferring

MCP PROTOCOL:
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 2,
     caller_type: "subagent",
     agent_name: "quality-corrector-mcp",
     name: "Correct MCP Server Quality Issues",
     goal: "Fix all critical/high issues in packages/mcp-server/",
     areas: ["packages/mcp-server"]
   })
2. get_context({
     workflow_id: "<workflow_id>",
     include: ["decisions"],
     filter: { phase: 1, agent: "quality-analyzer-mcp" }
   })
3. [During corrections]
   - log_milestone({task_id, message: "Fixed 5/12 critical issues", progress: 42})
   - log_decision({task_id, category: "approach", question: "Refactor order", chosen: "Bottom-up (utilities first)", reasoning: "Prevents breaking dependent code"})
4. complete_task({
     task_id: "<task_id>",
     status: "success",
     outcome: {
       summary: "Corrected X critical and Y high severity issues with Z atomic commits",
       achievements: ["All critical issues resolved", "Tests passing", "Conventional commits applied"]
     },
     phase_complete: true
   })
```

#### Agent Prompt: quality-corrector-shared
```
WORKFLOW_ID: <workflow_id>
PHASE: 2
CALLER_TYPE: subagent
AGENT_NAME: quality-corrector-shared

TASK: Fix code quality issues in packages/shared/
READ:
  - .claude/workflows/code-quality-review/definition.md
  - .claude/workflows/code-quality-review/analysis-shared.md
SCOPE: packages/shared/

[Same correction protocol as quality-corrector-mcp]

OUTPUT: .claude/workflows/code-quality-review/correction-report-shared.md

MCP PROTOCOL:
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 2,
     caller_type: "subagent",
     agent_name: "quality-corrector-shared",
     name: "Correct Shared Package Quality Issues",
     goal: "Fix all critical/high issues in packages/shared/",
     areas: ["packages/shared"]
   })
2. get_context({workflow_id, include: ["decisions"], filter: {phase: 1, agent: "quality-analyzer-shared"}})
3. [Work with milestones and commits]
4. complete_task({task_id, status: "success", outcome: {...}, phase_complete: true})
```

#### Agent Prompt: quality-corrector-webui
```
WORKFLOW_ID: <workflow_id>
PHASE: 2
CALLER_TYPE: subagent
AGENT_NAME: quality-corrector-webui

TASK: Fix code quality issues in packages/web-ui/
READ:
  - .claude/workflows/code-quality-review/definition.md
  - .claude/workflows/code-quality-review/analysis-web-ui.md
SCOPE: packages/web-ui/

[Same correction protocol as quality-corrector-mcp]

OUTPUT: .claude/workflows/code-quality-review/correction-report-web-ui.md

MCP PROTOCOL:
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 2,
     caller_type: "subagent",
     agent_name: "quality-corrector-webui",
     name: "Correct Web UI Quality Issues",
     goal: "Fix all critical/high issues in packages/web-ui/",
     areas: ["packages/web-ui"]
   })
2. get_context({workflow_id, include: ["decisions"], filter: {phase: 1, agent: "quality-analyzer-webui"}})
3. [Work with milestones and commits]
4. complete_task({task_id, status: "success", outcome: {...}, phase_complete: true})
```

---

### Phase 3: Final Quality Review

```yaml
phase:
  id: review
  number: 3
  name: "Final Quality Review"
  description: "Validate all corrections meet quality standards"
  requires: 2
  agents:
    - type: quality-reviewer
      subagent_type: "general-purpose"
      scope: "All packages"
  parallel: false
  outputs:
    - final-quality-report.md
  completion: "All success criteria validated, final report approved"
```

#### Agent Prompt: quality-reviewer
```
WORKFLOW_ID: <workflow_id>
PHASE: 3
CALLER_TYPE: subagent
AGENT_NAME: quality-reviewer

TASK: Final validation of all quality corrections
READ:
  - .claude/workflows/code-quality-review/definition.md
  - .claude/workflows/code-quality-review/analysis-*.md
  - .claude/workflows/code-quality-review/correction-report-*.md
SCOPE: All packages (packages/mcp-server, packages/shared, packages/web-ui)

REVIEW CHECKLIST:
1. All critical issues addressed
2. All high severity issues addressed
3. Tests passing across all packages
4. Git commits follow conventional format
5. No "Claude Code" mentions in commits
6. Code meets SOLID principles
7. DRY violations eliminated
8. Security issues patched
9. Clean code standards applied

VALIDATION STEPS:
1. Read all 3 analysis reports
2. Read all 3 correction reports
3. Review git log for commit quality
4. Run tests: npm test (or appropriate command)
5. Spot-check critical fixes in code
6. Verify success criteria from definition.md

DELIVERABLES:
1. Final quality report: .claude/workflows/code-quality-review/final-quality-report.md

FINAL REPORT FORMAT:
# Final Quality Review Report

## Workflow Success Criteria Status
- [x] All 3 services analyzed with detailed reports
- [x] SOLID violations identified and categorized
- [x] DRY violations identified and categorized
- [x] Security issues flagged and prioritized
- [x] Code smells documented
- [x] All identified issues corrected with tests passing
- [x] Final quality review validates corrections
- [x] Git history shows conventional commits only

## Quality Metrics
| Package | Issues Found | Issues Fixed | Tests Status |
|---------|--------------|--------------|--------------|
| mcp-server | X | Y | PASS/FAIL |
| shared | X | Y | PASS/FAIL |
| web-ui | X | Y | PASS/FAIL |

## Commit Quality Audit
- Total commits: X
- Conventional format compliance: 100%
- Forbidden mentions: 0

## Spot Check Results
[Sample of critical fixes verified in actual code]

## Recommendations
[Any follow-up improvements or monitoring needed]

## Conclusion
APPROVED / NEEDS_REVISION

MCP PROTOCOL:
1. start_task({
     workflow_id: "<workflow_id>",
     phase: 3,
     caller_type: "subagent",
     agent_name: "quality-reviewer",
     name: "Final Quality Review",
     goal: "Validate all corrections meet workflow success criteria",
     areas: ["packages/mcp-server", "packages/shared", "packages/web-ui"]
   })
2. get_context({
     workflow_id: "<workflow_id>",
     include: ["decisions", "milestones", "tasks"],
     filter: { phase: 2 }
   })
3. [During review]
   - log_milestone({task_id, message: "Validated mcp-server corrections", progress: 33})
   - log_decision({task_id, category: "scope", question: "Review depth", chosen: "Full validation with spot checks", reasoning: "Balance thoroughness with efficiency"})
4. complete_task({
     task_id: "<task_id>",
     status: "success",
     outcome: {
       summary: "All quality corrections validated and approved",
       achievements: ["All success criteria met", "Tests passing", "Commit quality verified"]
     },
     phase_complete: true
   })
```

---

## Phase Transition Rules

| From | To | Condition |
|------|----|-----------|
| Phase 1 | Phase 2 | All 3 analysis reports completed without blockers |
| Phase 2 | Phase 3 | All 3 correction reports completed, tests passing |
| Phase 3 | Done | Final report shows APPROVED status |

## Blocker Escalation

Any agent encountering a blocker must:
1. log_issue({task_id, type: "blocker", description: "...", severity: "high", requires_human_review: true})
2. Return error summary to orchestrator
3. Orchestrator queries: get_context({workflow_id, include: ["blockers"]})
4. Orchestrator STOPS and requests human help

Example blockers:
- Circular dependencies preventing refactoring
- Breaking changes required but forbidden by constraints
- Test failures after corrections
- Merge conflicts during parallel work

## Context Management

1. Phase 1: Each analyzer works independently (no cross-context)
2. Phase 2: Each corrector reads ONLY their analyzer's report
3. Phase 3: Reviewer reads all Phase 1 and Phase 2 context

## Scope Isolation (CRITICAL)

Parallel phases MUST have non-overlapping scopes:
- **quality-analyzer-mcp**: packages/mcp-server/ ONLY
- **quality-analyzer-shared**: packages/shared/ ONLY
- **quality-analyzer-webui**: packages/web-ui/ ONLY

Same for correctors. NO cross-contamination.

# Profile: Complex

## Use Case
- Codebase-wide changes
- 50+ files affected
- Multiple independent scopes
- Requires parallel analysis
- High-risk refactoring

## Schema
```
        ┌────────────┐
   ┌────│ Analyzer-1 │
   │    └────────────┘
   │    ┌────────────┐
───┼────│ Analyzer-2 │────┐   Phase 1 (Parallel)
   │    └────────────┘    │
   │    ┌────────────┐    │
   └────│ Analyzer-3 │    │
        └────────────┘    │
                          ▼
                   ┌────────────┐
              ┌────│   Planner  │   Phase 2
              │    └────────────┘
              │
              ▼
        ┌────────────┐
   ┌────│  Impl-1    │
   │    └────────────┘
   │    ┌────────────┐
───┼────│  Impl-2    │────┐   Phase 3 (Parallel)
   │    └────────────┘    │
   │    ┌────────────┐    │
   └────│  Impl-3    │    │
        └────────────┘    │
                          ▼
                   ┌────────────┐
                   │  Reviewer  │   Phase 4
                   └────────────┘
```

## Phases

```yaml
phases:
  - id: analyze
    number: 1
    name: Parallel Analysis
    agents:
      - type: analyzer
        subagent_type: "general-purpose"
        scope: <scope-1>
      - type: analyzer
        subagent_type: "general-purpose"
        scope: <scope-2>
      - type: analyzer
        subagent_type: "general-purpose"
        scope: <scope-3>
    parallel: true  # All 3 run concurrently
    outputs:
      - log_decision: analysis findings per scope
    completion: all analyzers complete

  - id: plan
    number: 2
    name: Consolidate & Plan
    requires: 1
    checkpoint: human  # Review analysis before proceeding
    agents:
      - type: planner
        subagent_type: "general-purpose"
        scope: synthesize analyses, create implementation plan
    parallel: false
    outputs:
      - log_decision: implementation plan, risk assessment
    completion: plan approved

  - id: implement
    number: 3
    name: Parallel Implementation
    requires: 2
    agents:
      - type: implementer
        subagent_type: "general-purpose"
        scope: <scope-1>
      - type: implementer
        subagent_type: "general-purpose"
        scope: <scope-2>
      - type: implementer
        subagent_type: "general-purpose"
        scope: <scope-3>
    parallel: true  # Ensure scopes don't overlap!
    outputs:
      - log_milestone: progress per scope
    completion: all implementations done

  - id: review
    number: 4
    name: Final Review
    requires: 3
    agents:
      - type: reviewer
        subagent_type: "general-purpose"
        scope: full mission validation
    parallel: false
    outputs:
      - final-report.md
    completion: all criteria met
```

## MCP Integration

### Orchestrator Flow for Parallel Phases
```
# Phase 1: Parallel Analysis
start_task({mission_id, phase: 1, caller_type: "orchestrator", name: "Phase 1: Parallel Analysis"})

# Launch all analyzers in parallel (single message with multiple Task calls)
Task({prompt: "Analyzer-1..."})
Task({prompt: "Analyzer-2..."})
Task({prompt: "Analyzer-3..."})

# Wait for all to complete, then:
complete_task({task_id, phase_complete: true})

# Check blockers
get_context({mission_id, include: ["blockers"], filter: {phase: 1}})

# Phase 2: Planning (human checkpoint)
[Wait for human approval if configured]
```

### Sub-Agent: Planner
Reads all analysis decisions:
```
get_context({
  mission_id: "...",
  include: ["decisions"],
  filter: { phase: 1 }
})
```

### Sub-Agent: Implementer (Scoped)
Each implementer reads only the plan and their scope:
```
get_context({
  mission_id: "...",
  include: ["decisions"],
  filter: { phase: 2 }
})
```

### Sub-Agent: Reviewer
Reads all implementation progress:
```
get_context({
  mission_id: "...",
  include: ["decisions", "milestones", "tasks"],
  filter: { phase: 3 }
})
```

## Context Management Rules
1. /clear after analyze phase if context is large
2. /clear after plan phase before implementation
3. Each implementer queries only their relevant scope decisions
4. Reviewer gets fresh context via get_context queries

## Scope Isolation
CRITICAL: Define scopes that do NOT overlap:
- By directory: `src/api/`, `src/ui/`, `src/core/`
- By feature: `auth`, `payments`, `notifications`
- By layer: `models`, `services`, `controllers`

## Blocker Escalation
For parallel phases, any blocker stops the entire phase:
```
log_issue({
  task_id: "...",
  type: "blocker",
  description: "Circular dependency found in scope-2",
  severity: "high",
  requiresHumanReview: true
})
```

Orchestrator detects via:
```
get_context({mission_id, include: ["blockers"], filter: {phase: 1}})
```

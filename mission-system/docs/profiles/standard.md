# Profile: Standard

## Use Case
- Multi-component tasks
- 10-50 files affected
- Requires understanding before implementation
- Moderate complexity

## Schema
```
┌─────────────┐
│  Analyzer   │  Phase 1
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Implementer │  Phase 2
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Reviewer   │  Phase 3
└─────────────┘
```

## Phases

```yaml
phases:
  - id: analyze
    number: 1
    name: Analyze Codebase
    agents:
      - type: analyzer
        subagent_type: "general-purpose"
        scope: understand current state, identify changes needed
    parallel: false
    outputs:
      - log_decision: analysis findings and recommendations
      - log_milestone: analysis progress
    completion: analysis complete

  - id: implement
    number: 2
    name: Implement Changes
    requires: 1
    agents:
      - type: implementer
        subagent_type: "general-purpose"
        scope: execute planned changes from analysis
    parallel: false
    outputs:
      - log_decision: implementation choices
      - log_milestone: implementation progress
    completion: all planned changes done

  - id: review
    number: 3
    name: Review & Validate
    requires: 2
    agents:
      - type: reviewer
        subagent_type: "general-purpose"
        scope: validate against mission + analysis
    parallel: false
    outputs:
      - log_decision: review findings
      - final-report.md
    completion: all criteria met OR blockers documented
```

## MCP Integration

### Orchestrator Flow
```
1. start_task({mission_id, phase: 1, caller_type: "orchestrator"})
2. Launch analyzer sub-agent
3. complete_task({task_id, phase_complete: true})
4. get_context({mission_id, include: ["blockers"]}) → check for blockers
5. start_task({mission_id, phase: 2, caller_type: "orchestrator"})
6. Launch implementer sub-agent
7. complete_task({task_id, phase_complete: true})
8. get_context({mission_id, include: ["blockers"]}) → check for blockers
9. start_task({mission_id, phase: 3, caller_type: "orchestrator"})
10. Launch reviewer sub-agent
11. complete_task({task_id, phase_complete: true})
12. complete_mission({mission_id, status: "completed"})
```

### Sub-Agent: Implementer
Reads analysis decisions before implementing:
```
get_context({
  mission_id: "...",
  include: ["decisions"],
  filter: { phase: 1 }
})
```

### Sub-Agent: Reviewer
Reads all previous decisions:
```
get_context({
  mission_id: "...",
  include: ["decisions", "tasks"],
  filter: { phase: 2 }
})
```

## Context Management
- After analysis phase: implementer queries analysis decisions via get_context
- After implementation: reviewer queries implementation decisions via get_context
- No need to clear context - MCP provides filtered queries

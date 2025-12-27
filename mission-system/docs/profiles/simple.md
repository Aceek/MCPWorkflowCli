# Profile: Simple

## Use Case
- Single-scope tasks
- < 10 files affected
- Clear, well-defined objective
- No cross-component dependencies

## Schema
```
┌──────────────┐     ┌──────────────┐
│   Executor   │────▶│   Reviewer   │
└──────────────┘     └──────────────┘
     Phase 1              Phase 2
```

## Phases

```yaml
phases:
  - id: execute
    number: 1
    name: Execute Task
    agents:
      - type: implementer
        subagent_type: "general-purpose"
        scope: <entire mission scope>
    parallel: false
    outputs:
      - log_decision: key implementation choices
      - log_milestone: progress updates
    completion: all changes implemented

  - id: review
    number: 2
    name: Review & Validate
    requires: 1
    agents:
      - type: reviewer
        subagent_type: "general-purpose"
        scope: validate against mission criteria
    parallel: false
    outputs:
      - log_decision: review findings
      - final-report.md
    completion: all success criteria met
```

## MCP Integration

### Orchestrator Flow
```
1. start_task({mission_id, phase: 1, caller_type: "orchestrator"})
2. Launch implementer sub-agent
3. complete_task({task_id, phase_complete: true})
4. start_task({mission_id, phase: 2, caller_type: "orchestrator"})
5. Launch reviewer sub-agent
6. complete_task({task_id, phase_complete: true})
7. complete_mission({mission_id, status: "completed"})
```

### Sub-Agent Flow
```
1. start_task({mission_id, phase: N, caller_type: "subagent", agent_name: "..."})
2. [Work] log_decision for key choices
3. [Work] log_milestone for progress
4. complete_task({task_id, status, outcome, phase_complete: true})
```

## Context Sharing

Sub-agents query previous phase context:
```
get_context({
  mission_id: "...",
  include: ["decisions", "milestones"],
  filter: { phase: 1 }
})
```

## When NOT to Use
- Multiple components need coordination
- Risk of conflicting changes
- Requires analysis before implementation

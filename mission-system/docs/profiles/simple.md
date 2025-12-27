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
```

## Phases

```yaml
phases:
  - id: execute
    name: Execute Task
    agents:
      - type: implementer
        scope: <entire mission scope>
    parallel: false
    outputs:
      - memory.md#Progress
      - memory.md#Decisions
    completion: all changes implemented

  - id: review
    name: Review & Validate
    requires: execute
    agents:
      - type: reviewer
        scope: validate against mission criteria
    parallel: false
    outputs:
      - memory.md#Progress
      - final-report.md
    completion: all success criteria met
```

## Memory Structure
```markdown
# Memory: <mission>
Updated: <ts>
Phase: 1/2

## Decisions
- [ts] <decision>

## Progress
| Task | Status | File(s) |
|------|--------|---------|

## Review
| Criterion | Pass | Notes |
|-----------|------|-------|
```

## When NOT to Use
- Multiple components need coordination
- Risk of conflicting changes
- Requires analysis before implementation

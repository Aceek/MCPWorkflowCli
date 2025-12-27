# Profile: Standard

## Use Case
- Multi-component tasks
- 10-50 files affected
- Requires understanding before implementation
- Moderate complexity

## Schema
```
┌─────────────┐
│  Analyzer   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Implementer │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Reviewer   │
└─────────────┘
```

## Phases

```yaml
phases:
  - id: analyze
    name: Analyze Codebase
    agents:
      - type: analyzer
        scope: understand current state, identify changes needed
    parallel: false
    outputs:
      - memory.md#Decisions
      - memory.md#Progress (planned changes)
    completion: analysis report complete

  - id: implement
    name: Implement Changes
    requires: analyze
    agents:
      - type: implementer
        scope: execute planned changes from analysis
    parallel: false
    outputs:
      - memory.md#Progress
      - memory.md#Decisions (implementation choices)
    completion: all planned changes done

  - id: review
    name: Review & Validate
    requires: implement
    agents:
      - type: reviewer
        scope: validate against mission + analysis
    parallel: false
    outputs:
      - memory.md#Progress
      - final-report.md
    completion: all criteria met OR blockers documented
```

## Memory Structure
```markdown
# Memory: <mission>
Updated: <ts>
Phase: 1/3

## Analysis Summary
<Compact findings from analyzer>

## Planned Changes
| Component | Change Type | Priority |
|-----------|-------------|----------|

## Decisions
- [ts] <decision> (rationale)

## Progress
| Planned | Status | Actual Files |
|---------|--------|--------------|

## Blockers
- [ ] <blocker> → <impact>

## Review Results
| Criterion | Pass | Notes |
|-----------|------|-------|
```

## Context Management
- Clear context after analyze phase if > 20 files analyzed
- Re-read memory.md at implement start

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
───┼────│ Analyzer-2 │────┐
   │    └────────────┘    │
   │    ┌────────────┐    │
   └────│ Analyzer-3 │    │
        └────────────┘    │
                          ▼
                   ┌────────────┐
              ┌────│   Planner  │
              │    └────────────┘
              │
              ▼
        ┌────────────┐
   ┌────│  Impl-1    │
   │    └────────────┘
   │    ┌────────────┐
───┼────│  Impl-2    │────┐
   │    └────────────┘    │
   │    ┌────────────┐    │
   └────│  Impl-3    │    │
        └────────────┘    │
                          ▼
                   ┌────────────┐
                   │  Reviewer  │
                   └────────────┘
```

## Phases

```yaml
phases:
  - id: analyze
    name: Parallel Analysis
    agents:
      - type: analyzer
        scope: <scope-1>
      - type: analyzer
        scope: <scope-2>
      - type: analyzer
        scope: <scope-3>
    parallel: true  # All 3 run concurrently
    outputs:
      - memory.md#Analysis-<scope>
    completion: all analyzers complete

  - id: plan
    name: Consolidate & Plan
    requires: analyze
    checkpoint: human  # Review analysis before proceeding
    agents:
      - type: planner
        scope: synthesize analyses, create implementation plan
    parallel: false
    outputs:
      - memory.md#Implementation-Plan
      - memory.md#Risk-Assessment
    completion: plan approved

  - id: implement
    name: Parallel Implementation
    requires: plan
    agents:
      - type: implementer
        scope: <scope-1>
      - type: implementer
        scope: <scope-2>
      - type: implementer
        scope: <scope-3>
    parallel: true  # Ensure scopes don't overlap!
    outputs:
      - memory.md#Progress
    completion: all implementations done

  - id: review
    name: Final Review
    requires: implement
    agents:
      - type: reviewer
        scope: full mission validation
    parallel: false
    outputs:
      - final-report.md
    completion: all criteria met
```

## Memory Structure
```markdown
# Memory: <mission>
Updated: <ts>
Phase: 1/4

## Analysis: <scope-1>
<Compact findings>

## Analysis: <scope-2>
<Compact findings>

## Analysis: <scope-3>
<Compact findings>

## Implementation Plan
| Scope | Priority | Dependencies | Risk |
|-------|----------|--------------|------|

## Risk Assessment
| Risk | Mitigation | Owner |
|------|------------|-------|

## Decisions
- [ts] <decision>

## Progress
| Scope | Component | Status | Notes |
|-------|-----------|--------|-------|

## Blockers
- [ ] <blocker> → <impact> → <scope affected>

## Integration Notes
<Cross-scope dependencies, merge order, etc.>
```

## Context Management Rules
1. /clear after analyze phase (mandatory)
2. /clear after plan phase (mandatory)
3. Each implementer only reads their scope section
4. Reviewer gets fresh context with full memory.md

## Scope Isolation
CRITICAL: Define scopes that do NOT overlap:
- By directory: `src/api/`, `src/ui/`, `src/core/`
- By feature: `auth`, `payments`, `notifications`
- By layer: `models`, `services`, `controllers`

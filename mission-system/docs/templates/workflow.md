# Workflow Template

<instructions>
1. Draw ASCII schema first (visual overview)
2. Define phases in YAML
3. Delete this block after filling
</instructions>

```markdown
# Workflow: <workflow_name>

## Schema
┌─────────────┐
│   Phase 1   │
│  <agents>   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Phase 2   │
│  <agents>   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Phase 3   │
│  <agents>   │
└─────────────┘

## Phases

```yaml
phases:
  - id: <phase_id>
    name: <Human Readable Name>
    description: <What this phase accomplishes>
    agents:
      - type: <agent-name>
        scope: <what this agent handles>
        tools: [Read, Write, Bash]  # Optional: restrict tools
    parallel: false
    outputs:
      - memory.md#<Section>
    completion: <criteria>

  - id: <next_phase_id>
    requires: <previous_phase_id>
    checkpoint: human  # Optional
    # ... same structure
```

## Phase Transition Rules

| From | To | Condition |
|------|----|-----------|
| <phase_id> | <next_phase_id> | <when to transition> |

## Rollback Strategy
<What to do if phase fails. Optional.>
```

## ASCII Schema Patterns

### Sequential
```
[A] → [B] → [C]
```

### Parallel then Merge
```
    ┌─[A]─┐
────┼─[B]─┼────[D]
    └─[C]─┘
```

### Conditional Branch
```
[A] ─┬─ condition1 → [B]
     └─ condition2 → [C]
```

### Loop with Review
```
[Implement] ←──┐
     │         │
     ▼         │ fail
[Review] ──────┘
     │ pass
     ▼
  [Done]
```

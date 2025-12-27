# Mission Template

<instructions>
Replace all <placeholders> with actual values.
Delete this instructions block after filling.
IMPORTANT: mission_id is obtained from start_mission MCP tool call.
</instructions>

```markdown
# Mission: <mission_name>

**Mission ID**: `<mission_id>`
**Profile**: <simple|standard|complex>
**Created**: <ISO_timestamp>

## Objective
<1-2 sentences: what success looks like>

## Scope
| Include | Exclude |
|---------|---------|
| <paths/components in scope> | <explicitly out of scope> |

## Constraints
- <Technical constraint 1>
- <Quality requirement>
- <Performance target if any>

## Success Criteria
- [ ] <Measurable criterion 1>
- [ ] <Measurable criterion 2>

## Context
<Background info agents need. Keep minimal.>

## References
- <Link or path to relevant docs>
- <API specs, design docs, etc.>
```

## Field Guidelines

| Field | Purpose | Token Budget |
|-------|---------|--------------|
| Mission ID | Links to MCP database | Required |
| Profile | Complexity level | simple/standard/complex |
| Objective | North star for all agents | 50 tokens max |
| Scope | Prevent scope creep | Use table format |
| Constraints | Hard limits | Bullet list |
| Success Criteria | Definition of done | Checkboxes |
| Context | Shared knowledge | 200 tokens max |
| References | External docs | Links only |

## MCP Integration

The `mission_id` is obtained by calling:

```
start_mission({
  name: "<mission_name>",
  objective: "<objective>",
  profile: "simple" | "standard" | "complex",
  total_phases: <number>,
  scope: "<scope>",
  constraints: "<constraints>"
})
```

Response contains:
```json
{
  "mission_id": "clxxx...",
  "profile": "standard",
  "total_phases": 3,
  "created_at": "2024-12-27T..."
}
```

Store `mission_id` in this file and in workflow.md.

# Workflow Definition Template

<instructions>
Replace all <placeholders> with actual values.
Delete this instructions block after filling.
IMPORTANT: workflow_id is obtained from start_workflow MCP tool call.
</instructions>

```markdown
# Workflow: <workflow_name>

**Workflow ID**: `<workflow_id>`
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
| Workflow ID | Links to MCP database | Required |
| Profile | Complexity level | simple/standard/complex |
| Objective | North star for all agents | 50 tokens max |
| Scope | Prevent scope creep | Use table format |
| Constraints | Hard limits | Bullet list |
| Success Criteria | Definition of done | Checkboxes |
| Context | Shared knowledge | 200 tokens max |
| References | External docs | Links only |

## MCP Integration

The `workflow_id` is obtained by calling:

```
start_workflow({
  name: "<workflow_name>",
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
  "workflow_id": "clxxx...",
  "profile": "standard",
  "total_phases": 3,
  "created_at": "2024-12-27T..."
}
```

Store `workflow_id` in this file and in workflow.md.

## MCP Access

**Subagents CAN call MCP tools directly.** Full access to all `mcp__mission-control__*` tools.

Both orchestrator and subagents manage their own MCP calls for task lifecycle.

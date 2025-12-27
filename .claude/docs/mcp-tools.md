# MCP Tools

8 tools for workflow orchestration and tracking.

## Overview

| Tool | Purpose | Frequency |
|------|---------|-----------|
| `start_workflow` | Create workflow with profile | 1x/workflow |
| `complete_workflow` | Finalize with summary + metrics | 1x/workflow |
| `get_context` | Query state (decisions, blockers) | 0-N/workflow |
| `start_task` | Start task + Git snapshot | 1x/task |
| `complete_task` | Complete task + Git diff | 1x/task |
| `log_decision` | Architectural decision | 0-3/task |
| `log_issue` | Problem/blocker | 0-3/task |
| `log_milestone` | Progress update | 0-5/task |

## Workflow Tools

### start_workflow

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Short workflow name |
| `objective` | string | yes | Measurable goal |
| `profile` | enum | no | `simple`\|`standard`\|`complex` |
| `total_phases` | number | no | Expected phases count |
| `scope` | string | no | Included/excluded |
| `constraints` | string | no | Technical limits |

**Returns**: `{ workflow_id, profile, total_phases, created_at }`

### complete_workflow

| Field | Type | Required |
|-------|------|----------|
| `workflow_id` | string | yes |
| `status` | enum | yes | `completed`\|`failed`\|`partial` |
| `summary` | string | yes |
| `achievements` | string[] | no |
| `limitations` | string[] | no |

**Returns**: `{ workflow_id, status, metrics: { total_phases, total_tasks, duration, files_changed } }`

### get_context

| Field | Type | Required |
|-------|------|----------|
| `workflow_id` | string | yes |
| `include` | string[] | yes | `decisions`\|`milestones`\|`blockers`\|`phase_summary`\|`tasks` |
| `filter.phase` | number | no |
| `filter.agent` | string | no |

**Returns**: Context data based on `include` array

## Task Tools

### start_task

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Workflow ID |
| `phase` | number | no | Phase number (auto-creates) |
| `phase_name` | string | no | Name for auto-created phase |
| `caller_type` | enum | no | `orchestrator`\|`subagent` |
| `agent_name` | string | no | For subagent type |
| `name` | string | yes | Task name |
| `goal` | string | yes | Task goal |
| `areas` | string[] | no | Code areas touched |

**Returns**: `{ task_id, snapshot_id, snapshot_type, phase_id, phase_created }`

**Git Snapshot**: Stores current HEAD hash for diff calculation.

### complete_task (CRITICAL)

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `status` | enum | yes | `success`\|`partial_success`\|`failed` |
| `outcome.summary` | string | yes |
| `outcome.achievements` | string[] | no |
| `outcome.limitations` | string[] | no |
| `outcome.next_steps` | string[] | no |
| `outcome.manual_review_needed` | bool | no |
| `phase_complete` | bool | no | Mark phase done |
| `metadata.packages_added` | string[] | no |
| `metadata.tests_status` | enum | no | `passed`\|`failed`\|`not_run` |

**Git Diff Logic**:
```
1. Retrieve start_hash from task.snapshotData
2. DIFF 1: git diff <start_hash> HEAD --name-status (commits)
3. DIFF 2: git diff HEAD --name-status (working tree)
4. UNION = All files changed during task
```

**Returns**: `{ task_id, duration_seconds, files_changed, verification, phase_status }`

## Logging Tools

### log_decision

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `category` | enum | yes | `architecture`\|`library_choice`\|`trade_off`\|`workaround`\|`other` |
| `question` | string | yes |
| `options_considered` | string[] | no |
| `chosen` | string | yes |
| `reasoning` | string | yes |
| `trade_offs` | string | no |

### log_issue

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `type` | enum | yes | `documentation_gap`\|`bug_encountered`\|`dependency_conflict`\|`unclear_requirement`\|`other` |
| `description` | string | yes |
| `resolution` | string | yes |
| `requires_human_review` | bool | no | Appears as blocker in get_context |

### log_milestone

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `message` | string | yes |
| `progress` | number | no | 0-100 |
| `metadata` | object | no |

## WebSocket Events

| Event | Trigger |
|-------|---------|
| `workflow:created` | start_workflow |
| `workflow:updated` | complete_workflow, phase changes |
| `phase:created` | First task of phase |
| `phase:updated` | complete_task with phase_complete |
| `task:created` | start_task |
| `task:updated` | complete_task |

## Enums (Prisma)

```typescript
enum WorkflowStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED }
enum WorkflowProfile { SIMPLE, STANDARD, COMPLEX }
enum PhaseStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED }
enum TaskStatus { IN_PROGRESS, SUCCESS, PARTIAL_SUCCESS, FAILED }
enum CallerType { ORCHESTRATOR, SUBAGENT }
enum DecisionCategory { ARCHITECTURE, LIBRARY_CHOICE, TRADE_OFF, WORKAROUND, OTHER }
enum IssueType { DOC_GAP, BUG, DEPENDENCY_CONFLICT, UNCLEAR_REQUIREMENT, OTHER }
```

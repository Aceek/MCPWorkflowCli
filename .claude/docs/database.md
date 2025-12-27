# Database Schema

SQLite via Prisma ORM. Schema in `packages/shared/prisma/schema.prisma`.

## Model Hierarchy

```
Workflow → Phase → Task → Decision/Issue/Milestone
```

## Enums

```prisma
enum WorkflowProfile { SIMPLE, STANDARD, COMPLEX }
enum WorkflowStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED }
enum PhaseStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED }
enum TaskStatus { IN_PROGRESS, SUCCESS, PARTIAL_SUCCESS, FAILED }
enum CallerType { ORCHESTRATOR, SUBAGENT }
enum DecisionCategory { ARCHITECTURE, LIBRARY_CHOICE, TRADE_OFF, WORKAROUND, OTHER }
enum IssueType { DOC_GAP, BUG, DEPENDENCY_CONFLICT, UNCLEAR_REQUIREMENT, OTHER }
enum TestsStatus { PASSED, FAILED, NOT_RUN }
```

## Models

### Workflow
| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `name` | string | Short name |
| `description` | string? | Optional description |
| `objective` | string | Measurable goal |
| `scope` | string? | What's included/excluded |
| `constraints` | string? | Technical limits |
| `profile` | WorkflowProfile | simple/standard/complex |
| `status` | WorkflowStatus | Current state |
| `currentPhase` | int | Progress (0 = not started) |
| `totalPhases` | int | Expected phases |
| `phases` | Phase[] | Relation |

### Phase
| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `workflowId` | string | FK to Workflow |
| `number` | int | Sequence (1, 2, 3...) |
| `name` | string | Phase name |
| `status` | PhaseStatus | Current state |
| `isParallel` | bool | Parallel tasks allowed |
| `tasks` | Task[] | Relation |

**Unique**: `[workflowId, number]`

### Task
| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `workflowId` | string | FK to Workflow |
| `phaseId` | string? | FK to Phase (optional) |
| `callerType` | CallerType? | orchestrator/subagent |
| `agentName` | string? | Sub-agent identifier |
| `name` | string | Task name |
| `goal` | string | Task goal |
| `status` | TaskStatus | Current state |
| `areas` | JSON | Code areas `["auth", "api"]` |
| `snapshotType` | string? | git/checksum |
| `snapshotData` | JSON? | `{gitHash: "abc123"}` |
| `filesAdded` | JSON | Auto-calculated |
| `filesModified` | JSON | Auto-calculated |
| `filesDeleted` | JSON | Auto-calculated |

### Decision
| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | FK to Task |
| `category` | DecisionCategory | Type of decision |
| `question` | string | What was decided |
| `chosen` | string | Choice made |
| `reasoning` | string | Why |

### Issue
| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | FK to Task |
| `type` | IssueType | Problem category |
| `description` | string | Problem details |
| `resolution` | string | How resolved |
| `requiresHumanReview` | bool | Blocker flag |

### Milestone
| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | FK to Task |
| `message` | string | Progress message |
| `progress` | int? | 0-100 |

## Indexes

| Model | Indexes |
|-------|---------|
| Workflow | `[status]`, `[createdAt]` |
| Phase | `[workflowId, number]` (unique), `[workflowId]` |
| Task | `[workflowId]`, `[phaseId]`, `[status]`, `[callerType]`, `[agentName]` |

## Cascade Deletes

```
Workflow → Phases → Tasks → Decisions/Issues/Milestones
```

## SQLite Notes

- **Arrays**: Stored as JSON strings, parse with `JSON.parse()`
- **Enums**: Stored as TEXT, validated by Prisma client
- **No server**: Single file `packages/shared/dev.db`

## Commands

```bash
# Initialize
cd packages/shared
echo 'DATABASE_URL="file:./dev.db"' > .env
npx prisma migrate dev --name init

# Generate client
npx prisma generate

# Studio
npx prisma studio
```

# Mission Control - Roadmap

## Overview

| Phase | Name | Goal | Status |
|-------|------|------|--------|
| 1 | **Merge & Reorganize** | Single repo with proper structure | `in_progress` |
| 2 | **Schema Extension** | Add Mission, Phase, CallerType to DB | `pending` |
| 3 | **MCP Tools Extension** | 8 simplified tools + phase auto-management | `pending` |
| 4 | **Agent Adaptation** | Update agent prompts for MCP | `pending` |
| 5 | **WebUI Adaptation** | Mission/Phase hierarchy views | `pending` |
| 6 | **Setup Script** | Guided installation + verification | `pending` |
| 7 | **Documentation** | Update all docs for new system | `pending` |

---

## Phase 1: Merge & Reorganize

**Goal**: Single `mission-control` repo with clean structure

### 1.1 Repository Setup
- [x] Rename `mcpAgentTracker` → `mission-control`
- [x] Update `package.json` name and description
- [x] Update all internal references to new name

### 1.2 Import mission-system
- [x] Create `mission-system/` directory in repo root
- [x] Copy `docs/` from original mission-system
  - [x] `architecture.md`
  - [x] `templates/mission.md`
  - [x] `templates/workflow.md`
  - [x] `templates/agent.md`
  - [x] `profiles/simple.md`
  - [x] `profiles/standard.md`
  - [x] `profiles/complex.md`
- [x] Copy `agents/` from original mission-system
  - [x] `mission-architect.md` (only agent bundled with this project)

### 1.3 Scripts Directory
- [x] Create `scripts/` directory
- [x] Create placeholder `setup.sh`
- [x] Create placeholder `symlink.sh`
- [x] Create placeholder `verify-mcp.sh`

### 1.4 Clean Old References
- [ ] Remove old `documentations/` if redundant (deferred to Phase 7)
- [x] Update `.gitignore` if needed (no changes required)
- [x] Remove any orphaned files (none found)

**Completion Criteria**:
- Repo has `packages/`, `mission-system/`, `scripts/` structure
- mission-system docs + mission-architect agent are in repo
- Project builds successfully

---

## Phase 2: Schema Extension

**Goal**: Database supports missions, phases, and caller context

### 2.1 New Enums
- [ ] Add `MissionProfile` enum (SIMPLE, STANDARD, COMPLEX)
- [ ] Add `MissionStatus` enum (PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED)
- [ ] Add `PhaseStatus` enum (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- [ ] Add `CallerType` enum (ORCHESTRATOR, SUBAGENT)

### 2.2 Mission Model
- [ ] Create `Mission` model in `schema.prisma`
  - [ ] id, name, description
  - [ ] objective, scope, constraints
  - [ ] profile (MissionProfile)
  - [ ] status (MissionStatus)
  - [ ] currentPhase, totalPhases
  - [ ] missionPath
  - [ ] timestamps (createdAt, updatedAt, completedAt)
  - [ ] relation to Phase[]

### 2.3 Phase Model
- [ ] Create `Phase` model in `schema.prisma`
  - [ ] id, missionId (FK)
  - [ ] number, name, description
  - [ ] status (PhaseStatus)
  - [ ] isParallel
  - [ ] timestamps (startedAt, completedAt)
  - [ ] relation to Task[]
  - [ ] unique constraint [missionId, number]

### 2.4 Task Model Extension
- [ ] Add `phaseId` field (optional FK to Phase)
- [ ] Add `callerType` field (CallerType)
- [ ] Add `agentName` field (String, optional)
- [ ] Add `agentPrompt` field (String, optional)
- [ ] Add indexes for new fields

### 2.5 Migration
- [ ] Generate Prisma migration
- [ ] Test migration on clean DB
- [ ] Test migration on existing DB (backward compat)
- [ ] Verify all relations work

**Completion Criteria**:
- `pnpm prisma migrate deploy` succeeds
- New models accessible via Prisma client
- Existing Workflow/Task data preserved

---

## Phase 3: MCP Tools Extension

**Goal**: Simplified tool set (8 tools) for mission orchestration

### 3.1 New Tools

#### start_mission (replaces start_workflow)
- [ ] Define Zod schema:
  - name (required), objective (required)
  - profile (optional): simple | standard | complex
  - total_phases (optional): number
  - scope, constraints (optional)
- [ ] Create `tools/start-mission.ts`
- [ ] Create Mission record in DB
- [ ] Return mission_id, created_at
- [ ] Emit WebSocket event `mission:created`
- [ ] Register tool in MCP server
- [ ] Add backward compat: `start_workflow` as alias

#### complete_mission
- [ ] Define Zod schema:
  - mission_id (required)
  - status: completed | failed | partial
  - summary (required)
  - achievements, limitations (optional)
- [ ] Create `tools/complete-mission.ts`
- [ ] Update Mission status + completedAt
- [ ] Aggregate mission metrics (duration, tasks, files)
- [ ] Return mission summary
- [ ] Emit WebSocket event `mission:completed`
- [ ] Register tool in MCP server

#### get_context (unified query)
- [ ] Define Zod schema:
  - mission_id (required)
  - include[]: decisions | milestones | blockers | phase_summary | tasks
  - filter (optional): { phase?, agent?, since? }
- [ ] Create `tools/get-context.ts`
- [ ] Query decisions (with phase/agent filter)
- [ ] Query milestones (with phase filter)
- [ ] Query blockers (issues with requiresHumanReview=true)
- [ ] Query phase summary (status, tasks count, duration)
- [ ] Return unified context object
- [ ] Register tool in MCP server

### 3.2 Extend Existing Tools

#### start_task (extended)
- [ ] Add `mission_id` to input schema (optional, for mission context)
- [ ] Add `phase` to input schema (number, optional)
- [ ] Add `phase_name` to input schema (optional, for first task of phase)
- [ ] Add `caller_type` to input schema (required): orchestrator | subagent
- [ ] Add `agent_name` to input schema (optional)
- [ ] Implement phase auto-creation:
  - [ ] If phase doesn't exist for mission_id + phase number, create it
  - [ ] Use phase_name if provided, else "Phase {n}"
  - [ ] Emit `phase:created` event
- [ ] Update DB write to include new fields
- [ ] Maintain backward compat (workflow_id still works)

#### complete_task (extended)
- [ ] Add `phase_complete` to input schema (boolean, default false)
- [ ] If phase_complete=true:
  - [ ] Update Phase status to COMPLETED
  - [ ] Set Phase completedAt
  - [ ] Update Mission currentPhase
  - [ ] Emit `phase:completed` event
- [ ] Include phase_status in response

### 3.3 Unchanged Tools
- [ ] Verify `log_decision` works with new schema (task linked to phase)
- [ ] Verify `log_issue` works with new schema
- [ ] Verify `log_milestone` works with new schema

### 3.4 Tool Registration
- [ ] Update `index.ts` to register new tools
- [ ] Update ListToolsRequestSchema handler
- [ ] Update CallToolRequestSchema handler
- [ ] Deprecate `start_workflow` (keep as alias)
- [ ] Test all 8 tools via MCP client

**Completion Criteria**:
- 8 tools registered and callable
- Phase auto-management working (create/complete)
- Backward compat for start_workflow
- WebSocket events emitted correctly
- All tools tested end-to-end

---

## Phase 4: Agent Adaptation

**Goal**: mission-architect uses MCP tools; document integration for external agents

### 4.1 mission-architect Agent (Bundled)
- [ ] Update to call `start_mission` when creating mission
- [ ] Store mission_id in generated mission.md
- [ ] Update generated workflow.md with phase_ids
- [ ] Update generated start.md with MCP instructions
- [ ] Remove any memory.md references

### 4.2 Orchestrator Instructions
- [ ] Write orchestrator pattern doc
- [ ] Define MCP call sequence:
  1. `start_mission`
  2. Loop: `start_phase` → launch sub-agents → `complete_phase`
  3. `complete_mission`
- [ ] Handle blocker escalation (stop + report)

### 4.3 External Agent Integration Guide
> Note: Agents like feature-planner, feature-implementer, senior-reviewer are EXTERNAL to this project.
> We only document how they CAN use MCP tools if desired.

- [ ] Write integration guide for external agents
- [ ] Document MCP tool usage patterns:
  - [ ] `start_task` with caller_type="subagent"
  - [ ] `log_decision`, `log_milestone`, `log_issue` usage
  - [ ] `get_mission_context` for reading shared state
  - [ ] `complete_task` for finalizing work
- [ ] Provide example agent prompt snippet

### 4.4 Prompt Templates
- [ ] Create reusable MCP instruction block (for any agent to copy)
- [ ] Document caller_type conventions
- [ ] Document required vs optional tools per agent type

**Completion Criteria**:
- mission-architect fully updated for MCP
- Integration guide for external agents complete
- Test run on sample mission with mission-architect

---

## Phase 5: WebUI Adaptation

**Goal**: Dashboard shows mission → phase → task hierarchy

### 5.1 Data Layer
- [ ] Add API route `/api/missions` (list)
- [ ] Add API route `/api/missions/[id]` (detail + phases)
- [ ] Add API route `/api/phases/[id]` (tasks)
- [ ] Update existing task routes for phase context

### 5.2 Missions List Page
- [ ] Create `/app/missions/page.tsx` (or update root)
- [ ] Mission cards with:
  - [ ] Name, objective
  - [ ] Status badge
  - [ ] Progress bar (phase X of Y)
  - [ ] Created date
- [ ] Filter by status
- [ ] Sort by date

### 5.3 Mission Detail Page
- [ ] Create `/app/missions/[id]/page.tsx`
- [ ] Header: mission name, objective, status
- [ ] Phase timeline (vertical):
  - [ ] Phase cards with status indicators
  - [ ] Expandable to show tasks
  - [ ] Duration per phase
- [ ] Blockers panel (if any)
- [ ] Agent activity feed

### 5.4 Task Detail Enhancement
- [ ] Add caller context display (agent name, type)
- [ ] Add breadcrumb: Mission → Phase → Task
- [ ] Link back to parent phase/mission

### 5.5 Real-time Updates
- [ ] Add WebSocket listeners for mission events
- [ ] Update UI on `mission:created`, `mission:updated`
- [ ] Update UI on `phase:started`, `phase:completed`
- [ ] Highlight new blockers

### 5.6 Components
- [ ] `MissionCard.tsx`
- [ ] `PhaseTimeline.tsx`
- [ ] `PhaseCard.tsx`
- [ ] `AgentBadge.tsx` (shows agent name/type)
- [ ] `BlockerAlert.tsx`

**Completion Criteria**:
- Missions list page functional
- Mission detail with phases visible
- Real-time updates working
- Mobile-responsive

---

## Phase 6: Setup Script

**Goal**: One-command installation and verification

### 6.1 Prerequisites Check
- [ ] Check Node.js version (20+)
- [ ] Check pnpm installed
- [ ] Check git installed
- [ ] Provide install instructions if missing

### 6.2 Install Script (`setup.sh`)
- [ ] Interactive mode (prompts) vs silent mode (flags)
- [ ] Install dependencies (`pnpm install`)
- [ ] Build project (`pnpm build`)
- [ ] Run migrations (`pnpm prisma migrate deploy`)
- [ ] Error handling with clear messages

### 6.3 Symlink Script (`symlink.sh`)
- [ ] Create `~/.claude/docs/mission-system/` symlink
- [ ] Create `~/.claude/agents/mission-architect.md` symlink
- [ ] Handle existing symlinks (update vs skip)
- [ ] Verify symlinks created correctly

### 6.4 MCP Configuration
- [ ] Generate `.mcp.json` for user's project
- [ ] Interactive: ask for project path
- [ ] Template with correct paths to mission-control
- [ ] Validate JSON syntax

### 6.5 Verification Script (`verify-mcp.sh`)
- [ ] Start MCP server in test mode
- [ ] Send test tool call
- [ ] Verify response
- [ ] Report success/failure with debug info

### 6.6 Documentation
- [ ] Update README with setup instructions
- [ ] Add troubleshooting section
- [ ] Add uninstall instructions

**Completion Criteria**:
- `./scripts/setup.sh` works end-to-end
- Symlinks created correctly
- MCP verified and working
- Clear error messages on failure

---

## Phase 7: Documentation

**Goal**: All docs updated for new system

### 7.1 Project Documentation
- [ ] Update root README.md
  - [ ] New project name and description
  - [ ] Quick start guide
  - [ ] Feature overview
- [ ] Update `.claude/CLAUDE.md`
  - [ ] New architecture description
  - [ ] New tool references
  - [ ] Updated workflow instructions

### 7.2 Technical Docs (`.claude/docs/`)
- [ ] Update `architecture.md` for mission concepts
- [ ] Update `mcp-protocol.md` with new tools
- [ ] Update `database.md` with new models
- [ ] Update `standards.md` if needed
- [ ] Update `tech-stack.md` if needed

### 7.3 Mission System Docs
- [ ] Update `mission-system/docs/architecture.md`
  - [ ] Remove memory.md references
  - [ ] Add MCP tool usage
- [ ] Update templates for MCP
  - [ ] `templates/mission.md`
  - [ ] `templates/workflow.md`
  - [ ] `templates/agent.md`
- [ ] Update profiles with MCP instructions

### 7.4 Agent Documentation
- [ ] Document mission-architect agent usage
- [ ] Create external agent integration guide (how to use MCP tools)
- [ ] Document caller_type conventions

### 7.5 Clean Old Docs
- [ ] Remove redundant `documentations/` folder
- [ ] Archive or delete obsolete docs
- [ ] Update all internal doc links

**Completion Criteria**:
- All docs reflect new system
- No memory.md references
- Quick start guide works
- Agent docs complete

---

## Progress Tracking

### Current Status

```
Phase 1: Merge & Reorganize    [■■■■■■■■░░] 90%
Phase 2: Schema Extension      [ ] 0%
Phase 3: MCP Tools Extension   [ ] 0%
Phase 4: Agent Adaptation      [ ] 0%
Phase 5: WebUI Adaptation      [ ] 0%
Phase 6: Setup Script          [ ] 0%
Phase 7: Documentation         [ ] 0%
```

### Session Log

| Date | Phase | Tasks Completed | Notes |
|------|-------|-----------------|-------|
| 2024-12-27 | 0 | Created VISION.md, ROADMAP.md | Initial planning |
| 2024-12-27 | 1 | Renamed to mission-control, imported mission-system, created scripts/ | documentations/ cleanup deferred to Phase 7 |

---

## Notes

### Dependencies Between Phases

```
Phase 1 (Merge)
    ↓
Phase 2 (Schema) ←──────────┐
    ↓                       │
Phase 3 (MCP Tools) ────────┤ Can start WebUI after schema
    ↓                       │
Phase 4 (Agents) ───────────┘
    ↓
Phase 5 (WebUI) ← needs schema + some tools
    ↓
Phase 6 (Setup) ← needs everything working
    ↓
Phase 7 (Docs) ← final polish
```

### Parallelization Opportunities

- Phase 4 (Agents) can start once Phase 3 has basic tools
- Phase 5 (WebUI) can start once Phase 2 is done
- Phase 7 (Docs) can be incremental throughout

### Risk Areas

1. **Schema migration** - Backward compat with existing data
2. **Agent prompts** - May need iteration to get right
3. **WebUI complexity** - Phase hierarchy adds UI complexity
4. **MCP tool testing** - Need good test coverage

---

**Version**: 0.1
**Created**: December 2024
**Last Updated**: December 2024

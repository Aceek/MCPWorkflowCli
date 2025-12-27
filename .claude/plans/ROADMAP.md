# [SUPERSEDED] Mission Control - Roadmap

> **Note**: This roadmap has been completed and superseded.
> The Mission and Workflow models have been unified into a single Workflow model.
> See `.claude/docs/` for current documentation.

---

## HISTORICAL CONTEXT (Archived)

## Overview

| Phase | Name | Goal | Status |
|-------|------|------|--------|
| 1 | **Merge & Reorganize** | Single repo with proper structure | `completed` |
| 2 | **Schema Extension** | Add Workflow, Phase, CallerType to DB | `completed` |
| 3 | **MCP Tools Extension** | 8 simplified tools + phase auto-management | `completed` |
| 4 | **Agent Adaptation** | Update agent prompts for MCP | `completed` |
| 5 | **WebUI Adaptation** | Workflow/Phase hierarchy views | `completed` |
| 6 | **Setup Script** | Guided installation + verification | `completed` |
| 7 | **Documentation** | Update all docs for new system | `completed` |

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

## Phase 2: Schema Extension ✅

**Goal**: Database supports missions, phases, and caller context

### 2.1 New Enums
- [x] Add `MissionProfile` enum (SIMPLE, STANDARD, COMPLEX)
- [x] Add `MissionStatus` enum (PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED)
- [x] Add `PhaseStatus` enum (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- [x] Add `CallerType` enum (ORCHESTRATOR, SUBAGENT)

### 2.2 Mission Model
- [x] Create `Mission` model in `schema.prisma`
  - [x] id, name, description
  - [x] objective, scope, constraints
  - [x] profile (MissionProfile)
  - [x] status (MissionStatus)
  - [x] currentPhase, totalPhases
  - [x] missionPath
  - [x] timestamps (createdAt, updatedAt, completedAt)
  - [x] relation to Phase[]

### 2.3 Phase Model
- [x] Create `Phase` model in `schema.prisma`
  - [x] id, missionId (FK)
  - [x] number, name, description
  - [x] status (PhaseStatus)
  - [x] isParallel
  - [x] timestamps (startedAt, completedAt)
  - [x] relation to Task[]
  - [x] unique constraint [missionId, number]

### 2.4 Task Model Extension
- [x] Add `phaseId` field (optional FK to Phase)
- [x] Add `callerType` field (CallerType)
- [x] Add `agentName` field (String, optional)
- [x] Add `agentPrompt` field (String, optional)
- [x] Add indexes for new fields

### 2.5 Migration
- [x] Generate Prisma migration
- [x] Test migration on clean DB
- [x] Test migration on existing DB (backward compat)
- [x] Verify all relations work

**Completion Criteria**:
- [x] `pnpm prisma migrate deploy` succeeds
- [x] New models accessible via Prisma client
- [x] Existing Workflow/Task data preserved

---

## Phase 3: MCP Tools Extension ✅

**Goal**: Simplified tool set (8 tools) for mission orchestration

### 3.1 New Tools

#### start_mission (replaces start_workflow)
- [x] Define Zod schema:
  - name (required), objective (required)
  - profile (optional): simple | standard | complex
  - total_phases (optional): number
  - scope, constraints (optional)
- [x] Create `tools/start-mission.ts`
- [x] Create Mission record in DB
- [x] Return mission_id, created_at
- [x] Emit WebSocket event `mission:created`
- [x] Register tool in MCP server
- [x] Add backward compat: `start_workflow` as alias

#### complete_mission
- [x] Define Zod schema:
  - mission_id (required)
  - status: completed | failed | partial
  - summary (required)
  - achievements, limitations (optional)
- [x] Create `tools/complete-mission.ts`
- [x] Update Mission status + completedAt
- [x] Aggregate mission metrics (duration, tasks, files)
- [x] Return mission summary
- [x] Emit WebSocket event `mission:completed`
- [x] Register tool in MCP server

#### get_context (unified query)
- [x] Define Zod schema:
  - mission_id (required)
  - include[]: decisions | milestones | blockers | phase_summary | tasks
  - filter (optional): { phase?, agent?, since? }
- [x] Create `tools/get-context.ts`
- [x] Query decisions (with phase/agent filter)
- [x] Query milestones (with phase filter)
- [x] Query blockers (issues with requiresHumanReview=true)
- [x] Query phase summary (status, tasks count, duration)
- [x] Return unified context object
- [x] Register tool in MCP server

### 3.2 Extend Existing Tools

#### start_task (extended)
- [x] Add `mission_id` to input schema (optional, for mission context)
- [x] Add `phase` to input schema (number, optional)
- [x] Add `phase_name` to input schema (optional, for first task of phase)
- [x] Add `caller_type` to input schema (required): orchestrator | subagent
- [x] Add `agent_name` to input schema (optional)
- [x] Implement phase auto-creation:
  - [x] If phase doesn't exist for mission_id + phase number, create it
  - [x] Use phase_name if provided, else "Phase {n}"
  - [x] Emit `phase:created` event
- [x] Update DB write to include new fields
- [x] Maintain backward compat (workflow_id still works)

#### complete_task (extended)
- [x] Add `phase_complete` to input schema (boolean, default false)
- [x] If phase_complete=true:
  - [x] Update Phase status to COMPLETED
  - [x] Set Phase completedAt
  - [x] Update Mission currentPhase
  - [x] Emit `phase:completed` event
- [x] Include phase_status in response

### 3.3 Unchanged Tools
- [x] Verify `log_decision` works with new schema (task linked to phase)
- [x] Verify `log_issue` works with new schema
- [x] Verify `log_milestone` works with new schema

### 3.4 Tool Registration
- [x] Update `index.ts` to register new tools
- [x] Update ListToolsRequestSchema handler
- [x] Update CallToolRequestSchema handler
- [x] Deprecate `start_workflow` (keep as alias)
- [ ] Test all 8 tools via MCP client

**Completion Criteria**:
- [x] 8 tools registered and callable
- [x] Phase auto-management working (create/complete)
- [x] Backward compat for start_workflow
- [x] WebSocket events emitted correctly
- [ ] All tools tested end-to-end

---

## Phase 4: Agent Adaptation ✅

**Goal**: mission-architect uses MCP tools; document integration for external agents

### 4.1 mission-architect Agent (Bundled)
- [x] Update to call `start_mission` when creating mission
- [x] Store mission_id in generated mission.md
- [x] Update generated workflow.md with phase numbers
- [x] Update generated start.md with MCP orchestrator instructions
- [x] Remove any memory.md references

### 4.2 Orchestrator Instructions
- [x] Write orchestrator pattern doc (`orchestrator-guide.md`)
- [x] Define MCP call sequence:
  1. `start_task` (orchestrator)
  2. Loop: launch sub-agent → `complete_task` with phase_complete
  3. `complete_mission`
- [x] Handle blocker escalation (get_context + stop + report)

### 4.3 External Agent Integration Guide
> Note: Agents like feature-planner, feature-implementer, senior-reviewer are EXTERNAL to this project.
> We only document how they CAN use MCP tools if desired.

- [x] Write integration guide for external agents (`agent-integration.md`)
- [x] Document MCP tool usage patterns:
  - [x] `start_task` with caller_type="subagent"
  - [x] `log_decision`, `log_milestone`, `log_issue` usage
  - [x] `get_context` for reading shared state
  - [x] `complete_task` for finalizing work
- [x] Provide example agent prompt snippets

### 4.4 Prompt Templates
- [x] Create reusable MCP instruction block (`mcp-instructions.md`)
- [x] Document caller_type conventions
- [x] Document required vs optional tools per agent type

### 4.5 Template Updates
- [x] Update `mission.md` template with mission_id field
- [x] Update `workflow.md` template with phase numbers
- [x] Update `agent.md` template with MCP protocol
- [x] Update all profile docs (simple, standard, complex) for MCP
- [x] Update `architecture.md` for MCP-based state tracking

**Completion Criteria**:
- [x] mission-architect fully updated for MCP
- [x] Integration guide for external agents complete
- [ ] Test run on sample mission with mission-architect

---

## Phase 5: WebUI Adaptation ✅

**Goal**: Dashboard shows mission → phase → task hierarchy

### 5.1 Data Layer
- [x] Add API route `/api/missions` (list)
- [x] Add API route `/api/missions/[id]` (detail + phases)
- [x] Add API route `/api/phases/[id]` (tasks)
- [x] Update types in lib/api.ts for missions

### 5.2 Missions List Page
- [x] Create `/app/missions/page.tsx`
- [x] Mission cards with:
  - [x] Name, objective
  - [x] Status badge
  - [x] Progress bar (phase X of Y)
  - [x] Created date
- [x] Filter by status
- [x] Sort by date

### 5.3 Mission Detail Page
- [x] Create `/app/missions/[id]/page.tsx`
- [x] Header: mission name, objective, status
- [x] Phase timeline (vertical):
  - [x] Phase cards with status indicators
  - [x] Expandable to show tasks
  - [x] Duration per phase
- [x] Blockers panel (if any)
- [x] Agent badges showing agent name/type

### 5.4 Task Detail Enhancement
- [x] Add caller context display (AgentBadge component)
- [ ] Add breadcrumb: Mission → Phase → Task (deferred)
- [ ] Link back to parent phase/mission (deferred)

### 5.5 Real-time Updates
- [x] Add WebSocket listeners for mission events
- [x] Update UI on `mission:created`, `mission:updated`
- [x] Update UI on `phase:created`, `phase:updated`
- [x] Hook: useRealtimeMissions (list)
- [x] Hook: useRealtimeMission (detail)

### 5.6 Components
- [x] `MissionCard.tsx`
- [x] `PhaseTimeline.tsx`
- [x] `PhaseCard.tsx`
- [x] `AgentBadge.tsx` (shows agent name/type)
- [x] `BlockerAlert.tsx`
- [x] `MissionStatsCards.tsx`
- [x] `MissionStatusFilter.tsx`
- [x] `RealtimeMissionList.tsx`

**Completion Criteria**:
- [x] Missions list page functional
- [x] Mission detail with phases visible
- [x] Real-time updates working
- [x] Navigation links in header

---

## Phase 6: Setup Script ✅

**Goal**: One-command installation and verification

### 6.1 Prerequisites Check
- [x] Check Node.js version (20+)
- [x] Check pnpm installed
- [x] Check git installed
- [x] Provide install instructions if missing

### 6.2 Install Script (`setup.sh`)
- [x] Interactive mode (prompts) vs silent mode (flags)
- [x] Install dependencies (`pnpm install`)
- [x] Build project (`pnpm build:all`)
- [x] Run migrations (`pnpm db:migrate`)
- [x] Error handling with clear messages

### 6.3 Symlink Script (`symlink.sh`)
- [x] Create `~/.claude/docs/mission-system/` symlink
- [x] Create `~/.claude/agents/mission-architect.md` symlink
- [x] Handle existing symlinks (update vs skip)
- [x] Verify symlinks created correctly
- [x] Add --remove flag for cleanup

### 6.4 MCP Configuration
- [x] Generate `.mcp.json` for user's project
- [x] Interactive: ask for project path
- [x] Template with correct paths to mission-control
- [x] Validate JSON syntax

### 6.5 Verification Script (`verify-mcp.sh`)
- [x] Check MCP server binary exists
- [x] Check database file
- [x] Send initialize request to server
- [x] List registered tools
- [x] Report success/failure with debug info

### 6.6 Documentation
- [x] Update README with setup instructions
- [x] Add troubleshooting section
- [x] Add uninstall instructions
- [x] Add scripts reference table

**Completion Criteria**:
- [x] `./scripts/setup.sh` works end-to-end
- [x] Symlinks created correctly
- [x] MCP verified and working
- [x] Clear error messages on failure

---

## Phase 7: Documentation

**Goal**: All docs updated for new system

### 7.1 Project Documentation
- [x] Update root README.md (done in Phase 6)
  - [x] New project name and description
  - [x] Quick start guide
  - [x] Feature overview
- [x] Update `.claude/CLAUDE.md`
  - [x] New architecture description
  - [x] New tool references (9 tools)
  - [x] Updated workflow instructions

### 7.2 Technical Docs (`.claude/docs/`)
- [x] Update `architecture.md` for mission concepts
- [x] Update `mcp-protocol.md` with new tools (all 9 documented)
- [x] Update `database.md` with new models (Mission, Phase, CallerType)
- [x] Update `standards.md` if needed (no changes needed)
- [x] Update `tech-stack.md` if needed (no changes needed)

### 7.3 Mission System Docs
- [x] Update `mission-system/docs/architecture.md` (done in Phase 4)
  - [x] Remove memory.md references
  - [x] Add MCP tool usage
- [x] Update templates for MCP (done in Phase 4)
  - [x] `templates/mission.md`
  - [x] `templates/workflow.md`
  - [x] `templates/agent.md`
- [x] Update profiles with MCP instructions (done in Phase 4)

### 7.4 Agent Documentation
- [x] Document mission-architect agent usage (done in Phase 4)
- [x] Create external agent integration guide (done in Phase 4: agent-integration.md)
- [x] Document caller_type conventions (in mcp-protocol.md)

### 7.5 Clean Old Docs
- [x] Remove redundant `documentations/` folder (already removed)
- [x] Archive or delete obsolete docs (none remaining)
- [x] Update all internal doc links

**Completion Criteria**:
- [x] All docs reflect new system
- [x] No memory.md references
- [x] Quick start guide works
- [x] Agent docs complete

---

## Progress Tracking

### Current Status

```
Phase 1: Merge & Reorganize    [■■■■■■■■■■] 100%
Phase 2: Schema Extension      [■■■■■■■■■■] 100%
Phase 3: MCP Tools Extension   [■■■■■■■■■■] 100%
Phase 4: Agent Adaptation      [■■■■■■■■■■] 100%
Phase 5: WebUI Adaptation      [■■■■■■■■■■] 100%
Phase 6: Setup Script          [■■■■■■■■■■] 100%
Phase 7: Documentation         [■■■■■■■■■■] 100%

ALL PHASES COMPLETE ✓
```

### Session Log

| Date | Phase | Tasks Completed | Notes |
|------|-------|-----------------|-------|
| 2024-12-27 | 0 | Created VISION.md, ROADMAP.md | Initial planning |
| 2024-12-27 | 1 | Renamed to mission-control, imported mission-system, created scripts/ | documentations/ cleanup deferred to Phase 7 |
| 2024-12-27 | 2 | Added Mission, Phase models + CallerType context to Task | SQLite compatible (enums as TEXT) |
| 2024-12-27 | 3 | Implemented 9 MCP tools with mission/phase support | start_mission, complete_mission, get_context + extended start/complete_task |
| 2024-12-27 | 4 | Updated mission-architect + created 3 new guides | orchestrator-guide.md, agent-integration.md, mcp-instructions.md + updated all templates |
| 2024-12-27 | 5 | Created missions dashboard with real-time updates | API routes, components, pages, hooks for missions/phases |
| 2024-12-27 | 6 | Implemented setup scripts and updated README | setup.sh, symlink.sh, generate-mcp-config.sh, verify-mcp.sh |
| 2024-12-27 | 7 | Updated all documentation to reflect new architecture | CLAUDE.md, architecture.md, mcp-protocol.md (9 tools), database.md (Mission/Phase models) |

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

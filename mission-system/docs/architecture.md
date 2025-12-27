# Mission System Architecture

<system_overview>
Framework for orchestrated multi-agent workflows with MCP-based state tracking.
Location: `~/.claude/` (global) + `/project/.claude/missions/` (per-project)
</system_overview>

## Directory Structure

```
~/.claude/
├── agents/mission-architect.md     # Meta-agent: creates missions
├── docs/mission-system/
│   ├── architecture.md             # This file
│   ├── orchestrator-guide.md       # MCP orchestration patterns
│   ├── agent-integration.md        # External agent MCP guide
│   ├── mcp-instructions.md         # Reusable MCP templates
│   ├── templates/{mission,workflow,agent}.md
│   └── profiles/{simple,standard,complex}.md

/project/.claude/
├── CLAUDE.md                       # Project config (updated by architect)
└── missions/<name>/
    ├── mission.md                  # Objectives, scope, constraints + mission_id
    ├── workflow.md                 # Phases, agents, transitions + phase numbers
    ├── start.md                    # Executable prompt for MCP orchestrator
    └── agents/                     # Mission-specific agents (optional)
```

## Core Concepts

### MCP-Based State Tracking

**All state is managed via MCP tools** - no file-based memory.

| State Type | MCP Tool | Description |
|------------|----------|-------------|
| Mission lifecycle | `start_mission`, `complete_mission` | Create/finalize missions |
| Task lifecycle | `start_task`, `complete_task` | Track task execution |
| Decisions | `log_decision` | Architectural choices |
| Progress | `log_milestone` | Progress updates (with %) |
| Blockers | `log_issue` | Problems requiring attention |
| Context query | `get_context` | Read previous state |

### Orchestrator
- Main agent executing the workflow
- Reads mission.md + workflow.md at start
- Uses MCP tools for all state tracking
- Launches sub-agents per phase via Task tool
- NEVER delegates orchestration (no nested sub-agents)

### Sub-Agents
- Isolated context window per agent
- Return distilled summary to orchestrator
- Use MCP tools for state tracking
- Query previous phase decisions via `get_context`
- Single responsibility per agent

### Sub-Agent Type Rules
> **CRITICAL**: Agents that write files MUST use `subagent_type: "general-purpose"`

| Agent Purpose | subagent_type | Required Tools |
|---------------|---------------|----------------|
| Analysis + report | `general-purpose` | Read, Write, Grep, Glob |
| Implementation | `general-purpose` | Read, Write, Edit, Bash, Grep, Glob |
| Review + report | `general-purpose` | Read, Write, Grep, Glob, Bash |
| Read-only exploration | `Explore` | (built-in) |

**Why**: `Explore` agents are read-only. Any agent producing file outputs needs `general-purpose`.

## Workflow Execution

<execution_flow>
1. Orchestrator reads mission.md, workflow.md
2. FOR each phase in workflow:
   a. start_task({caller_type: "orchestrator", phase: N})
   b. Launch sub-agent(s) for phase via Task tool
   c. Receive summaries
   d. complete_task({phase_complete: true})
   e. get_context({include: ["blockers"]}) → check blockers
3. IF blocker with requiresHumanReview → STOP, request human help
4. complete_mission({status, summary})
</execution_flow>

### Parallel vs Sequential
```
parallel: true   → Multiple Task calls in single message
parallel: false  → One agent at a time (default)
```

### Context Management Rules
| Condition | Action |
|-----------|--------|
| Workflow > 5 phases | Consider /clear between major phases |
| After /clear | Re-read mission.md |
| Sub-agent needs context | Query via get_context with phase filter |

## Error Handling

<on_blocker>
1. Sub-agent calls log_issue with requiresHumanReview: true
2. Sub-agent returns error summary to orchestrator
3. Orchestrator detects via get_context({include: ["blockers"]})
4. Orchestrator STOPS workflow
5. Orchestrator requests human intervention with:
   - Blocker description
   - Attempted solutions
   - Suggested resolutions
</on_blocker>

## Document Standards

### Token Optimization Rules
- NO filler words, NO redundant explanations
- Tables > prose for structured data
- Bullet points > paragraphs
- Code blocks for examples
- Reference other docs, don't duplicate

### Git Conventions
When workflow involves code changes:
- **Language**: English only
- **Format**: Conventional commits (`type(scope): description`)
- **Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- **Forbidden**: NO mention of "Claude Code", "Claude", "AI", or "generated"
- **Frequency**: Commit after each logical group of changes

## MCP Tool Reference

### Lifecycle Tools

| Tool | Input | Output | When |
|------|-------|--------|------|
| `start_mission` | name, objective, profile | mission_id | Mission creation |
| `start_task` | mission_id, phase, caller_type, name, goal | task_id | Task start |
| `complete_task` | task_id, status, outcome, phase_complete | duration, files | Task end |
| `complete_mission` | mission_id, status, summary | total metrics | Mission end |

### Logging Tools

| Tool | Input | Output | When |
|------|-------|--------|------|
| `log_decision` | task_id, category, question, chosen | decision_id | Architectural choice |
| `log_milestone` | task_id, message, progress | milestone_id | Progress update |
| `log_issue` | task_id, type, description, severity | issue_id | Problem/blocker |

### Query Tools

| Tool | Input | Output | When |
|------|-------|--------|------|
| `get_context` | mission_id, include, filter | context data | Need previous state |

## Schema: workflow.md

```yaml
name: workflow-name
phases:
  - id: phase-id
    number: 1
    name: Human readable name
    agents:
      - type: agent-type
        subagent_type: "general-purpose"
        scope: what this agent handles
    parallel: false
    outputs:
      - log_decision: key choices
    completion: all agents return success

  - id: next-phase
    number: 2
    requires: 1
    checkpoint: human  # Optional: pause for approval
```

## Validation Rules

<validation>
- All referenced agents must exist
- No circular phase dependencies
- Scopes must not overlap within parallel agents
- Each phase must have completion criteria
- All file-writing agents must use subagent_type: "general-purpose"
- All phases must have explicit number field
</validation>

## Integration with CLAUDE.md

When mission-architect creates a mission, it adds to project CLAUDE.md:

```markdown
## Active Mission
Mission: <name>
Mission ID: `<mission_id>`
Path: .claude/missions/<name>/
Status: <phase>

### Quick Commands
- "continue mission" → Resume using get_context
- "mission status" → Query via get_context
- "abort mission" → Call complete_mission(failed)
```

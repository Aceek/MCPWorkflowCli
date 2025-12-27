# Mission System Architecture

<system_overview>
Framework for orchestrated multi-agent workflows with shared memory.
Location: `~/.claude/` (global) + `/project/.claude/missions/` (per-project)
</system_overview>

## Directory Structure

```
~/.claude/
├── agents/mission-architect.md     # Meta-agent: creates missions
├── docs/mission-system/
│   ├── architecture.md             # This file
│   ├── templates/{mission,workflow,agent}.md
│   └── profiles/{simple,standard,complex}.md

/project/.claude/
├── CLAUDE.md                       # Project config (updated by architect)
└── missions/<name>/
    ├── mission.md                  # Objectives, scope, constraints
    ├── workflow.md                 # Phases, agents, transitions
    ├── start.md                    # Executable prompt to launch orchestrator
    ├── memory.md                   # Shared state (created at runtime)
    └── agents/                     # Mission-specific agents (optional)
```

## Core Concepts

### Orchestrator
- Main agent executing the workflow
- Reads mission.md + workflow.md at start
- Launches sub-agents per phase
- Updates/reads memory.md between phases
- NEVER delegates orchestration (no nested sub-agents)

### Sub-Agents
- Isolated context window per agent
- Return distilled summary to orchestrator
- Read memory.md for context
- Write to memory.md for state updates
- Single responsibility per agent

### Sub-Agent Type Rules
> ⚠️ **CRITICAL**: Agents that write files MUST use `subagent_type: "general-purpose"`

| Agent Purpose | subagent_type | Required Tools |
|---------------|---------------|----------------|
| Analysis + report | `general-purpose` | Read, Write, Grep, Glob |
| Implementation | `general-purpose` | Read, Write, Edit, Bash, Grep, Glob |
| Review + report | `general-purpose` | Read, Write, Grep, Glob, Bash |
| Read-only exploration | `Explore` | (built-in) |

**Why**: `Explore` agents are read-only. Any agent producing file outputs needs `general-purpose`.

### Shared Memory (memory.md)
- Created at runtime by orchestrator (no static template)
- Structure adapted to mission needs
- Compact format, no redundancy
- Sections: Decisions | Progress | Blockers | Next-Agent-Context

## Workflow Execution

<execution_flow>
1. Orchestrator reads mission.md, workflow.md
2. FOR each phase in workflow:
   a. Read memory.md (if exists)
   b. Launch sub-agent(s) for phase
   c. Receive summaries
   d. Update memory.md
   e. Check phase completion criteria
3. IF blocker → write to memory.md, STOP, request human help
4. Final phase: generate summary report
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
| After /clear | Re-read mission.md + memory.md |
| Sub-agent scope | Only load relevant memory sections |

## Error Handling

<on_blocker>
1. Sub-agent writes to memory.md → Blockers section
2. Sub-agent returns error summary to orchestrator
3. Orchestrator adds context to Blockers
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
- **Documentation**: List commits in memory.md Progress section

### Analysis Report Requirements
No rigid template, but analysis outputs MUST include:

| Element | Purpose | Required |
|---------|---------|----------|
| Findings/Violations | What was discovered | ✅ |
| Severity levels | Prioritization (HIGH/MED/LOW) | ✅ |
| Action plan | What to do | ✅ |
| Dependencies | Execution order if applicable | If needed |
| Scope confirmation | What was covered | ✅ |
| Metrics targets | Before/after expectations | If applicable |

Format is flexible - adapt to mission needs.

### Memory.md Guidelines
No fixed template - structure adapts to mission. But follow these rules:

**Required Elements** (always include):
- Header with mission name, timestamp, current phase
- Decisions section (append-only log)
- Progress tracking
- Blockers if any

**Recommended Tracking** (when applicable):
| Metric | When to Track |
|--------|---------------|
| Commits | Code implementation missions |
| Files created/modified | Refactoring, restructuring |
| Violations fixed | Quality improvement missions |
| Test results | Any mission with tests |

**Format Rules**:
- Append-only for Decisions (never delete, only add)
- Update Progress in-place (current state)
- Compact - no prose, use tables/lists
- Each agent update adds timestamp

**Example Structure** (adapt as needed):
```markdown
# Memory: <mission_name>
Updated: <ISO-timestamp>
Phase: <current>/<total>

## Decisions
- [ts] Decision (rationale)

## Progress
| Component | Status | Notes |
|-----------|--------|-------|

## Metrics
| Metric | Count |
|--------|-------|

## Blockers
- [ ] Description → impact

## Context for Next Agent
<Minimal info needed for next phase>
```

## Schema: workflow.md

```yaml
name: workflow-name
phases:
  - id: phase-id
    name: Human readable name
    agents:
      - type: agent-type-or-path
        scope: what this agent handles
    parallel: false
    outputs:
      - memory.md#Progress
    completion: all agents return success

  - id: next-phase
    requires: phase-id
    checkpoint: human  # Optional: pause for approval
```

## Validation Rules

<validation>
- All referenced agents must exist
- No circular phase dependencies
- Scopes must not overlap within parallel agents
- Each phase must have completion criteria
- Outputs must be valid memory.md sections or file paths
</validation>

## Integration with CLAUDE.md

When mission-architect creates a mission, it adds to project CLAUDE.md:

```markdown
## Active Mission
Mission: <name>
Path: .claude/missions/<name>/
Status: <phase>

### Quick Commands
- "continue mission" → Resume from current phase
- "mission status" → Show progress from memory.md
- "abort mission" → Stop and document state
```

# Workflow: npm-distribution

**Workflow ID**: `cmjrsbohn0000fhythq59bjsh`
**Total Phases**: 5
**Profile**: complex

## Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW: npm-distribution                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐                                             │
│  │ Phase 1: Analysis   │  feature-analyzer                           │
│  │ Structure + Deps    │  ─────────────────                          │
│  └──────────┬──────────┘  Analyze current structure                 │
│             │              Identify dependencies                     │
│             │              Define migration order                    │
│             ▼                                                        │
│  ┌─────────────────────┐                                             │
│  │ Phase 2: Config     │  config-implementer                         │
│  │ Package             │  ───────────────────                        │
│  └──────────┬──────────┘  Create packages/config                     │
│             │              TOML + Zod validation                     │
│             │              Unit tests                                │
│             ▼                                                        │
│  ┌─────────────────────────────────────────────┐                     │
│  │ Phase 3: Migration (PARALLEL)               │                     │
│  ├──────────────────┬──────────────────────────┤                     │
│  │ mcp-migrator     │ ui-migrator              │                     │
│  │ packages/        │ packages/web-ui/         │                     │
│  │ mcp-server/      │                          │                     │
│  └──────────┬───────┴──────────┬───────────────┘                     │
│             │                  │                                     │
│             └────────┬─────────┘                                     │
│                      ▼                                               │
│  ┌─────────────────────┐                                             │
│  │ Phase 4: CLI        │  cli-implementer                            │
│  │ Package             │  ────────────────                           │
│  └──────────┬──────────┘  Create packages/cli                        │
│             │              Commands init/link/ui/doctor/config       │
│             │              Tests                                     │
│             ▼                                                        │
│  ┌─────────────────────────────────────────────┐                     │
│  │ Phase 5: Finalization (PARALLEL)            │                     │
│  ├──────────────────┬──────────────────────────┤                     │
│  │ docs-implementer │ test-implementer         │                     │
│  │ Documentation    │ Integration tests        │                     │
│  └──────────────────┴──────────────────────────┘                     │
│                      │                                               │
│                      ▼                                               │
│             [HUMAN CHECKPOINT]                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## MCP Access

**Subagents CAN call MCP tools directly.** Full access to all `mcp__mission-control__*` tools.

| Caller | MCP Access | Role |
|--------|------------|------|
| Orchestrator | ✅ Full | Coordinates phases, monitors progress, manages /compact |
| Subagent | ✅ Full | Manages own task lifecycle + logs progress |

## Phases

### Phase 1: Analysis and Structure

```yaml
phase:
  number: 1
  name: "Analysis and Structure"
  agents:
    - type: feature-analyzer
      subagent_type: "general-purpose"
      scope: "Entire project structure"
  parallel: false
  completion: "Analysis document complete with migration plan"
```

**Orchestrator Actions:**
```
1. start_phase({workflow_id, number: 1, name: "Analysis and Structure", is_parallel: false})
2. Launch feature-analyzer via Task tool (pass workflow_id + phase_id in prompt)
3. Monitor via get_context({workflow_id, include: ["tasks", "blockers"]})
4. Handle blockers if requires_human_review
5. Verify .claude/analysis/npm-migration-analysis.md exists
6. complete_phase({phase_id, status: "completed"})
7. /compact (context management)
```

**Agent Prompt:**

```markdown
# Task: Analyze Project Structure for NPM Distribution

**Workflow**: npm-distribution
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: 1

## Your Goal

Analyze the current Mission Control structure to prepare for NPM distribution migration:

1. **Inventory Current Config**: List all hardcoded paths, ports, env vars across packages
2. **Dependency Analysis**: Map dependencies between packages (config → mcp-server → web-ui → cli)
3. **Migration Order**: Define optimal sequence to avoid circular dependencies
4. **Risk Assessment**: Identify potential breaking changes and mitigation strategies
5. **File Manifest**: List all files that need creation/modification

## Scope

- packages/mcp-server/src/
- packages/web-ui/
- scripts/
- Root package.json, tsconfig.json

## Instructions

1. Read packages/mcp-server/src/index.ts - identify all env vars and hardcoded values
2. Read packages/web-ui/next.config.js and relevant files - same analysis
3. Read scripts/ - identify what needs updating
4. Create analysis document with:
   - Current config inventory (table format)
   - Dependency graph
   - Recommended migration order with rationale
   - Risk matrix (risk, impact, mitigation)
   - File creation/modification manifest

## Output

Create `.claude/analysis/npm-migration-analysis.md` with complete analysis.

## MCP Protocol

You have full access to MCP tools. Follow this protocol:

1. Start your task:
   ```
   start_task({
     workflow_id: "{workflow_id}",
     phase_id: "{phase_id}",
     name: "Analyze NPM Migration Structure",
     goal: "Complete analysis of current structure for NPM migration",
     caller_type: "subagent",
     agent_name: "feature-analyzer",
     areas: ["packages/mcp-server", "packages/web-ui", "scripts"]
   })
   ```

2. Log progress as you work:
   ```
   log_milestone({task_id, message: "Completed config inventory", progress: 0.3})
   log_decision({
     task_id,
     category: "architecture",
     question: "Should config package expose singleton or factory?",
     chosen: "Singleton with getConfig()",
     reasoning: "Simpler API, config is global"
   })
   ```

3. If blocked:
   ```
   log_issue({
     task_id,
     type: "blocker",
     description: "Found circular dependency between X and Y",
     requires_human_review: true
   })
   ```

4. Complete your task:
   ```
   complete_task({
     task_id,
     status: "success",
     outcome: {
       summary: "Analysis complete with migration plan",
       achievements: ["Config inventory", "Dependency graph", "Migration order"],
       limitations: [],
       next_steps: ["Proceed to Phase 2: Config Package implementation"]
     }
   })
   ```
```

---

### Phase 2: Config Package

```yaml
phase:
  number: 2
  name: "Config Package"
  requires: 1
  agents:
    - type: config-implementer
      subagent_type: "general-purpose"
      scope: "packages/config/"
  parallel: false
  completion: "Package @mission-control/config functional with tests"
```

**Orchestrator Actions:**
```
1. start_phase({workflow_id, number: 2, name: "Config Package", is_parallel: false})
2. Launch config-implementer via Task tool
3. Monitor progress
4. Verify pnpm build succeeds in packages/config
5. complete_phase({phase_id, status: "completed"})
6. /compact
```

**Agent Prompt:**

```markdown
# Task: Implement Config Package

**Workflow**: npm-distribution
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: 2

## Your Goal

Create the `@mission-control/config` package from scratch with TOML configuration system.

## Scope

packages/config/

## Instructions

1. **Create package structure**:
   ```
   packages/config/
   ├── src/
   │   ├── index.ts          # Main exports
   │   ├── schema.ts         # Zod schemas
   │   ├── defaults.ts       # Default values
   │   └── loader.ts         # TOML loading logic
   ├── tests/
   │   ├── config.test.ts
   │   └── fixtures/
   ├── package.json
   └── tsconfig.json
   ```

2. **Implement schema.ts**:
   - Zod schema matching plan section 3.4
   - ConfigSchema with paths, server, database, ui sections
   - Export type Config = z.infer<typeof ConfigSchema>

3. **Implement loader.ts**:
   - loadConfig() function with hierarchy: env > file > defaults
   - expandPath() to resolve ~ to home directory
   - initConfigFile() to create default config.toml

4. **Implement index.ts**:
   - Export loadConfig, getConfig (singleton), initConfigFile
   - Export convenience getters: config.databaseUrl, config.websocketPort, etc.

5. **Write package.json**:
   - name: "@mission-control/config"
   - version: "0.1.0"
   - type: "module"
   - dependencies: "@iarna/toml", "zod"
   - scripts: build, test

6. **Write tests**:
   - Test TOML parsing
   - Test env var override
   - Test path expansion
   - Test validation errors

7. **Build and verify**:
   - pnpm install
   - pnpm build
   - pnpm test

## Reference

See `.claude/plans/npm-distribution-plan.md` section 3.4 for complete implementation.

## MCP Protocol

1. Start: `start_task({workflow_id, phase_id, name: "Implement Config Package", ...})`
2. Log milestones for each major step
3. Log decisions (singleton vs factory, TOML vs JSON, etc.)
4. Complete: `complete_task({task_id, status: "success", ...})`
```

---

### Phase 3: Migrate Existing Packages (PARALLEL)

```yaml
phase:
  number: 3
  name: "Migrate Existing Packages"
  requires: 2
  agents:
    - type: mcp-migrator
      subagent_type: "general-purpose"
      scope: "packages/mcp-server/"
    - type: ui-migrator
      subagent_type: "general-purpose"
      scope: "packages/web-ui/"
  parallel: true
  completion: "Both mcp-server and web-ui use @mission-control/config"
```

**Orchestrator Actions:**
```
1. start_phase({workflow_id, number: 3, name: "Migrate Existing Packages", is_parallel: true})
2. Launch BOTH agents in parallel via Task tool
3. Monitor both: get_context({workflow_id, include: ["tasks"], filter: {phase: 3}})
4. Ensure BOTH complete before proceeding
5. complete_phase({phase_id, status: "completed"})
6. /compact
```

**Agent Prompt (mcp-migrator):**

```markdown
# Task: Migrate MCP Server to Config Package

**Workflow**: npm-distribution
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: 3

## Your Goal

Migrate packages/mcp-server to use @mission-control/config.

## Scope

packages/mcp-server/

## Instructions

1. **Update package.json**:
   - Add dependency: "@mission-control/config": "workspace:*"
   - Add bin entry: "mission-control-mcp": "./bin/mcp-server.js"
   - Update files: ["dist", "bin", "prisma"]

2. **Create bin/mcp-server.js**:
   ```javascript
   #!/usr/bin/env node
   import('../dist/index.js').catch(console.error);
   ```

3. **Update src/index.ts**:
   - Import { getConfig } from '@mission-control/config'
   - Replace process.env.DATABASE_URL with config.databaseUrl
   - Replace hardcoded ports with config.websocketPort
   - Replace CORS origins with config.corsOrigins

4. **Update WebSocket server setup**:
   - Use config.websocketPort with auto-increment on busy
   - Use config.server.max_port_attempts

5. **Test**:
   - pnpm build
   - Verify bin/mcp-server.js is executable
   - Test stdio mode: node packages/mcp-server/dist/index.js
   - Test WebSocket mode

## MCP Protocol

1. Start: `start_task({workflow_id, phase_id, name: "Migrate MCP Server", ...})`
2. Log each file modification
3. Log decision if changing port logic
4. Complete with git diff
```

**Agent Prompt (ui-migrator):**

```markdown
# Task: Migrate Web UI to Config Package

**Workflow**: npm-distribution
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: 3

## Your Goal

Migrate packages/web-ui to use @mission-control/config.

## Scope

packages/web-ui/

## Instructions

1. **Update package.json**:
   - Add dependency: "@mission-control/config": "workspace:*"

2. **Update next.config.js**:
   - Import { getConfig } from '@mission-control/config'
   - Use config.webuiPort for port
   - Use config.websocketPort for API proxy

3. **Update relevant components**:
   - Replace any hardcoded URLs/ports with config values
   - Ensure WebSocket client uses config.websocketPort

4. **Test**:
   - pnpm build
   - pnpm dev (verify port usage)
   - Verify WebSocket connection works

## MCP Protocol

Same as mcp-migrator.
```

---

### Phase 4: CLI Package

```yaml
phase:
  number: 4
  name: "CLI Package"
  requires: 3
  agents:
    - type: cli-implementer
      subagent_type: "general-purpose"
      scope: "packages/cli/"
  parallel: false
  completion: "CLI functional with all commands"
```

**Orchestrator Actions:**
```
1. start_phase({workflow_id, number: 4, name: "CLI Package", is_parallel: false})
2. Launch cli-implementer
3. Monitor progress
4. Test each command manually
5. complete_phase({phase_id, status: "completed"})
6. /compact
```

**Agent Prompt:**

```markdown
# Task: Implement CLI Package

**Workflow**: npm-distribution
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: 4

## Your Goal

Create the `@mission-control/cli` package with all commands.

## Scope

packages/cli/

## Instructions

1. **Create package structure**:
   ```
   packages/cli/
   ├── src/
   │   ├── index.ts              # Entry point with Commander.js
   │   ├── commands/
   │   │   ├── init.ts           # mission-control init
   │   │   ├── link.ts           # mission-control link
   │   │   ├── ui.ts             # mission-control ui
   │   │   ├── doctor.ts         # mission-control doctor
   │   │   └── config.ts         # mission-control config
   │   └── utils/
   │       ├── symlinks.ts
   │       └── prisma.ts
   ├── bin/
   │   └── mission-control.js    # #!/usr/bin/env node
   ├── tests/
   ├── package.json
   └── tsconfig.json
   ```

2. **Implement each command** per plan section 5:
   - init: config + DB + symlinks
   - link: generate .mcp.json
   - ui: launch web dashboard
   - doctor: health check
   - config: manage TOML config

3. **Dependencies**:
   - commander: CLI framework
   - chalk: colored output
   - ora: spinners
   - inquirer: interactive prompts (if needed)

4. **Write package.json**:
   - bin: "mission-control": "./bin/mission-control.js"
   - dependencies: @mission-control/config, @mission-control/mcp-server

5. **Write tests** for each command

6. **Build and verify**:
   - pnpm build
   - pnpm test
   - Test CLI: node packages/cli/bin/mission-control.js --help

## Reference

See `.claude/plans/npm-distribution-plan.md` section 5 for detailed command implementations.

## MCP Protocol

1. Start task
2. Log milestone for each command implemented
3. Log decisions (CLI framework choice, error handling strategy)
4. Complete with git diff
```

---

### Phase 5: Finalization (PARALLEL)

```yaml
phase:
  number: 5
  name: "Finalization"
  requires: 4
  agents:
    - type: docs-implementer
      subagent_type: "general-purpose"
      scope: "Documentation"
    - type: test-implementer
      subagent_type: "general-purpose"
      scope: "Integration tests"
  parallel: true
  checkpoint: human
  completion: "Documentation complete, integration tests pass, ready for review"
```

**Orchestrator Actions:**
```
1. start_phase({workflow_id, number: 5, name: "Finalization", is_parallel: true})
2. Launch BOTH agents in parallel
3. Monitor both tasks
4. Ensure both complete
5. complete_phase({phase_id, status: "completed"})
6. /compact
7. STOP - Human checkpoint required
8. Present summary for human review
9. After approval: complete_workflow({workflow_id, status: "success", ...})
```

**Agent Prompt (docs-implementer):**

```markdown
# Task: Update Documentation

**Workflow**: npm-distribution
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: 5

## Your Goal

Update all documentation for NPM distribution.

## Scope

- README.md
- .claude/docs/architecture.md
- CHANGELOG.md
- packages/*/README.md

## Instructions

1. **Update root README.md**:
   - Replace "clone and build" with npm install instructions
   - Add quickstart: npm install -g @mission-control/cli && mission-control init
   - Update architecture diagram
   - Add configuration section (TOML + env vars)

2. **Update architecture.md**:
   - Document new package structure
   - Add config hierarchy diagram
   - Document CLI commands

3. **Create CHANGELOG.md**:
   - Version 0.1.0
   - List all new features (config package, CLI, NPM distribution)
   - Migration guide from git clone to npm install

4. **Create package READMEs**:
   - packages/config/README.md
   - packages/cli/README.md

5. **Verify**:
   - All links work
   - Code examples are accurate
   - No references to old setup process

## MCP Protocol

Standard: start_task → log_milestone → complete_task
```

**Agent Prompt (test-implementer):**

```markdown
# Task: Integration Tests

**Workflow**: npm-distribution
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: 5

## Your Goal

Create integration tests for the complete NPM distribution flow.

## Scope

tests/integration/

## Instructions

1. **Create integration test suite**:
   ```
   tests/integration/
   ├── npm-install.test.ts     # Test npm install flow
   ├── cli-init.test.ts        # Test mission-control init
   ├── cli-link.test.ts        # Test mission-control link
   ├── mcp-connection.test.ts  # Test MCP server connection
   └── config-loading.test.ts  # Test config hierarchy
   ```

2. **Test scenarios**:
   - Fresh install: init → link → verify connection
   - Config override: env vars > file > defaults
   - CLI commands: all commands execute without error
   - Error handling: missing config, invalid TOML, port conflicts

3. **Setup test environment**:
   - Use temporary directories
   - Clean up after tests
   - Mock Claude Code connection if needed

4. **Run tests**:
   - pnpm test:integration
   - All tests pass

## MCP Protocol

Standard: start_task → log_milestone → complete_task
```

---

## Human Checkpoint Protocol

After Phase 5 completes, orchestrator MUST:

1. Call `get_context({workflow_id, include: ["phase_summary", "tasks"]})`
2. Generate summary report:
   ```
   Workflow: npm-distribution
   Status: Awaiting human review

   Completed Phases:
   ✓ Phase 1: Analysis (feature-analyzer)
   ✓ Phase 2: Config Package (config-implementer)
   ✓ Phase 3: Migration (mcp-migrator + ui-migrator)
   ✓ Phase 4: CLI Package (cli-implementer)
   ✓ Phase 5: Finalization (docs-implementer + test-implementer)

   Key Achievements:
   - [List from task outcomes]

   Files Created/Modified:
   - [Git diff summary from all tasks]

   Tests Status:
   - Unit tests: [pass/fail count]
   - Integration tests: [pass/fail count]

   Ready for Review:
   - [ ] Code quality
   - [ ] Documentation completeness
   - [ ] Test coverage
   - [ ] NPM publication checklist
   ```

3. STOP and request human approval
4. If approved → `complete_workflow({workflow_id, status: "success"})`
5. If feedback → create new tasks to address issues

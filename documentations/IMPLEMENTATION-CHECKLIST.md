# Implementation Checklist - Phase 1 (MCP Server)

## 🐳 Alternative Docker (Recommandé)

**Pour un setup rapide avec Docker**, une documentation Docker complète sera disponible.
Le Docker Compose inclura PostgreSQL + MCP Server pré-configurés.

**Pour l'instant**, suivez le setup manuel ci-dessous pour Phase 1.

---

## Setup Projet Manuel (30min)

### 1. Initialiser le monorepo

```bash
cd /home/ilan/code/mcpAgentTracker

# Init pnpm workspace
pnpm init

# Créer la structure
mkdir -p packages/{mcp-server,web-ui,shared}/src
```

### 2. Configurer pnpm workspace

**Fichier : `pnpm-workspace.yaml`**
```yaml
packages:
  - 'packages/*'
```

**Fichier : `package.json` (root)**
```json
{
  "name": "mcp-workflow-tracker",
  "private": true,
  "scripts": {
    "dev:mcp": "pnpm --filter mcp-server dev",
    "dev:ui": "pnpm --filter web-ui dev",
    "db:migrate": "pnpm --filter shared prisma:migrate",
    "db:generate": "pnpm --filter shared prisma:generate"
  }
}
```

### 3. Setup package shared (Prisma)

```bash
cd packages/shared

pnpm init
pnpm add -D prisma typescript
pnpm add @prisma/client

# Créer la structure
mkdir -p prisma src
```

**Fichier : `packages/shared/package.json`**
```json
{
  "name": "@mcp-tracker/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "scripts": {
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x"
  }
}
```

**Copier le schema** :
Extraire le schema Prisma de `/.claude/docs/database.md` → `packages/shared/prisma/schema.prisma`

**Configurer la base de données** :

Choisissez votre base de données (PostgreSQL recommandé pour Phase 1) :

#### Option A : PostgreSQL (Recommandé)

```bash
# Créer .env dans packages/shared/
cat > packages/shared/.env << EOF
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:password@localhost:5432/mcp_tracker?schema=public"
EOF
```

**Prérequis** : PostgreSQL doit être installé et lancé.

**Installation rapide avec Docker** (si pas déjà installé) :
```bash
docker run --name mcp-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
docker exec -it mcp-postgres psql -U postgres -c "CREATE DATABASE mcp_tracker;"
```

#### Option B : SQLite (Alternatif - pour dev sans serveur DB)

```bash
# Créer .env dans packages/shared/
cat > packages/shared/.env << EOF
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"
EOF
```

**Note** : SQLite fonctionne sans installation, mais a des limitations (voir `/.claude/docs/database.md`).

---

**Lancer la migration** :
```bash
cd packages/shared
pnpm prisma:migrate
pnpm prisma:generate
```

✅ **Vérifier** : `node_modules/@prisma/client` contient les types générés avec tous les enums

---

## MCP Server - Core (2h)

### 4. Setup package mcp-server

```bash
cd packages/mcp-server

pnpm init
pnpm add @modelcontextprotocol/sdk simple-git glob
pnpm add @mcp-tracker/shared
pnpm add -D typescript @types/node tsx
```

**Fichier : `packages/mcp-server/package.json`**
```json
{
  "name": "@mcp-tracker/mcp-server",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "@mcp-tracker/shared": "workspace:*",
    "simple-git": "^3.x",
    "glob": "^10.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "tsx": "^4.x"
  }
}
```

**Fichier : `packages/mcp-server/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### 5. Implémenter le MCP Server

**Structure des fichiers** :
```
packages/mcp-server/src/
├── index.ts              # Point d'entrée MCP
├── tools/
│   ├── start-workflow.ts
│   ├── start-task.ts
│   ├── log-decision.ts
│   ├── log-issue.ts
│   ├── log-milestone.ts
│   └── complete-task.ts
├── utils/
│   ├── git-snapshot.ts   # Logique Git robuste
│   ├── checksum.ts       # Fallback checksums
│   └── scope-verify.ts   # Vérification scope
└── db.ts                 # Prisma client singleton
```

**Fichier : `packages/mcp-server/src/db.ts`**
```typescript
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
```

**Fichier : `packages/mcp-server/src/index.ts`**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { startWorkflowTool, handleStartWorkflow } from './tools/start-workflow.js'
import { startTaskTool, handleStartTask } from './tools/start-task.js'
import { logDecisionTool, handleLogDecision } from './tools/log-decision.js'
import { logIssueTool, handleLogIssue } from './tools/log-issue.js'
import { logMilestoneTool, handleLogMilestone } from './tools/log-milestone.js'
import { completeTaskTool, handleCompleteTask } from './tools/complete-task.js'

const server = new Server(
  {
    name: 'mcp-workflow-tracker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Liste des tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    startWorkflowTool,
    startTaskTool,
    logDecisionTool,
    logIssueTool,
    logMilestoneTool,
    completeTaskTool,
  ],
}))

// Appels des tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case 'start_workflow':
      return handleStartWorkflow(args)
    case 'start_task':
      return handleStartTask(args)
    case 'log_decision':
      return handleLogDecision(args)
    case 'log_issue':
      return handleLogIssue(args)
    case 'log_milestone':
      return handleLogMilestone(args)
    case 'complete_task':
      return handleCompleteTask(args)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

// Démarrer le serveur
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('MCP Workflow Tracker server running on stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
```

### 6. Implémenter les tools (voir `/.claude/docs/mcp-protocol.md`)

Pour chaque tool, créer un fichier dans `tools/` avec :
1. La définition du tool (schema)
2. Le handler (logique métier)

**Exemple : `packages/mcp-server/src/tools/start-workflow.ts`**
```typescript
import { prisma } from '../db.js'
import { WorkflowStatus } from '@prisma/client'

export const startWorkflowTool = {
  name: 'start_workflow',
  description: 'Initialize a new workflow tracking session',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Short workflow name',
      },
      description: {
        type: 'string',
        description: 'Detailed description',
      },
      plan: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            step: { type: 'string' },
            goal: { type: 'string' },
          },
        },
      },
    },
    required: ['name'],
  },
}

export async function handleStartWorkflow(args: any) {
  const workflow = await prisma.workflow.create({
    data: {
      name: args.name,
      description: args.description,
      plan: args.plan,
      status: WorkflowStatus.IN_PROGRESS,
    },
  })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          workflow_id: workflow.id,
          created_at: workflow.createdAt,
        }, null, 2),
      },
    ],
  }
}
```

**Répéter pour les 5 autres tools** (voir `/.claude/docs/mcp-protocol.md` pour les implémentations détaillées).

### 7. Implémenter la logique Git robuste

**Fichier : `packages/mcp-server/src/utils/git-snapshot.ts`**

Copier l'implémentation de `/.claude/docs/mcp-protocol.md` section "complete_task" :
- Fonction `createGitSnapshot()`
- Fonction `computeGitDiff(startHash)`
- Fonction `parseDiffOutput()`
- Fonction `verifyScope()`

---

## Tests (1h)

### 8. Tester le MCP Server manuellement

**Créer un script de test** : `packages/mcp-server/test-manual.ts`

```typescript
import { spawn } from 'child_process'
import readline from 'readline'

const server = spawn('tsx', ['src/index.ts'])

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

server.stdout.on('data', (data) => {
  console.log('Server:', data.toString())
})

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString())
})

// Envoyer une requête test
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'start_workflow',
    arguments: {
      name: 'Test workflow',
      description: 'Testing the MCP server',
    },
  },
}

server.stdin.write(JSON.stringify(testRequest) + '\n')
```

**Lancer** :
```bash
pnpm dev:mcp
```

### 9. Tester avec Claude Code

**Ajouter le MCP dans la config Claude** : `.claude/mcp.json`

```json
{
  "mcpServers": {
    "workflow-tracker": {
      "command": "tsx",
      "args": ["/home/ilan/code/mcpAgentTracker/packages/mcp-server/src/index.ts"]
    }
  }
}
```

**Test manuel dans Claude** :
```
User: Utilise le MCP workflow-tracker pour démarrer un workflow de test
Claude: [Appelle start_workflow via MCP]
```

✅ Vérifier dans la DB que le workflow a été créé :
```bash
pnpm --filter shared prisma:studio
```

---

## Checklist finale

- [ ] Monorepo setup avec pnpm workspaces
- [ ] Package `shared` avec Prisma + migration OK
- [ ] Package `mcp-server` avec les 6 tools implémentés
- [ ] Logique Git robuste (union commits + working tree)
- [ ] Fallback checksums si pas de Git
- [ ] Enums TypeScript utilisés partout
- [ ] Test manuel avec script fonctionne
- [ ] Test avec Claude Code fonctionne
- [ ] Vérification DB (workflows/tasks créés correctement)

---

## Prochaines étapes (Phase 2)

Après validation du MCP Server :
1. Web UI setup (Next.js)
2. API routes + WebSocket
3. Vue Hiérarchique
4. Vue Vérification (diff viewer)
5. Vue Timeline

**Durée estimée Phase 2** : 4-5h

---

**Note** : Cette checklist est conçue pour être suivie par un agent IA (vibecoding). Chaque étape est claire, séquentielle et vérifiable.

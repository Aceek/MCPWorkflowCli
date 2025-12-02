# Architecture

## Principe Fondamental : Clean Architecture + Feature-Based

Le projet suit une architecture **monorepo modulaire** avec séparation stricte des responsabilités (SOC) et isolation des features.

### Pourquoi cette architecture ?

**Optimisé pour développement moderne :**
- ✅ Séparation stricte des responsabilités (shared, mcp-server, web-ui)
- ✅ Réutilisation du code (types Prisma partagés)
- ✅ Développement parallèle (packages indépendants)
- ✅ Scalabilité (ajout de nouveaux packages facile)

---

## Structure Monorepo

```
mcp-workflow-tracker/
├── packages/
│   ├── shared/            # Types partagés + Prisma Schema
│   ├── mcp-server/        # MCP Server (stdio protocol)
│   └── web-ui/            # Next.js UI (Phase 2)
├── documentations/        # Documentation générale
├── pnpm-workspace.yaml    # Config monorepo pnpm
└── package.json           # Scripts workspace
```

### Principe MCP Protocol

Le **Model Context Protocol (MCP)** est un protocole de communication entre agents AI et tools via **stdio** (standard input/output).

```
Agent AI (Claude Code)
        ↓
    MCP Client
        ↓ stdio
    MCP Server ←→ SQLite (local file)
```

**Caractéristiques :**
- Communication JSON-RPC via stdin/stdout
- Pas de serveur HTTP (pas de port à ouvrir)
- Lancé automatiquement par l'agent
- Synchrone (request → response)

---

## Package : shared

**Rôle :** Types communs + Schéma Prisma centralisé

```
packages/shared/
├── prisma/
│   ├── schema.prisma      # Schéma DB unique
│   └── migrations/        # Migrations SQL
├── src/
│   └── index.ts           # Export types Prisma
├── package.json
├── tsconfig.json
└── .env                   # DATABASE_URL
```

**Responsabilités :**
- ✅ Définir le schéma de base de données (Prisma)
- ✅ Générer le client Prisma typé
- ✅ Exporter types pour autres packages
- ❌ Pas de logique métier

**Principe d'isolation :**
- Ce package NE contient QUE des types et le schéma DB
- Tous les autres packages l'importent : `import { PrismaClient, TaskStatus } from '@prisma/client'`

---

## Package : mcp-server

**Rôle :** Serveur MCP exposant 6 tools pour tracker workflows

```
packages/mcp-server/
├── src/
│   ├── index.ts               # Point d'entrée MCP (stdio)
│   ├── db.ts                  # Prisma client singleton
│   ├── tools/
│   │   ├── start-workflow.ts  # Tool 1
│   │   ├── start-task.ts      # Tool 2 (+ Git snapshot)
│   │   ├── log-decision.ts    # Tool 3
│   │   ├── log-issue.ts       # Tool 4
│   │   ├── log-milestone.ts   # Tool 5
│   │   └── complete-task.ts   # Tool 6 (+ Git diff)
│   └── utils/
│       ├── git-snapshot.ts    # Logique Git robuste
│       ├── checksum.ts        # Fallback sans Git
│       └── scope-verify.ts    # Vérification scope
├── package.json
├── tsconfig.json
└── Dockerfile (futur)
```

**Responsabilités :**
- ✅ Implémenter les 6 tools MCP (voir mcp-protocol.md)
- ✅ Gérer snapshots Git (union commits + working tree)
- ✅ Calculer fichiers modifiés automatiquement
- ✅ Valider scope déclaré vs réalité
- ✅ Écrire en base de données (Prisma)
- ❌ Pas d'interface utilisateur
- ❌ Pas de serveur HTTP

**Architecture interne :**

```typescript
// index.ts : Point d'entrée MCP
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

const server = new Server(
  { name: 'mcp-workflow-tracker', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// Enregistrement des tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'start_workflow', inputSchema: { ... } },
    { name: 'start_task', inputSchema: { ... } },
    // ... 4 autres tools
  ]
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case 'start_workflow':
      return await handleStartWorkflow(args)
    case 'start_task':
      return await handleStartTask(args)
    // ...
  }
})

// Lancement stdio
const transport = new StdioServerTransport()
await server.connect(transport)
```

**Principe DRY :**
- Chaque tool = 1 fichier
- Utils réutilisables (git-snapshot.ts, scope-verify.ts)
- Pas de duplication de logique

---

## Package : web-ui (Phase 2)

**Rôle :** Interface Next.js pour visualiser workflows en temps réel

```
packages/web-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Liste workflows
│   │   └── workflow/[id]/
│   │       └── page.tsx             # Détails workflow
│   ├── components/
│   │   ├── TreeView.tsx             # Vue hiérarchique
│   │   ├── DiffViewer.tsx           # Affichage diffs
│   │   ├── Timeline.tsx             # Timeline milestones
│   │   └── DecisionCard.tsx
│   ├── lib/
│   │   ├── prisma.ts                # Prisma client
│   │   └── websocket.ts             # Socket.io client
│   └── api/
│       ├── workflows/route.ts       # GET /api/workflows
│       └── workflow/[id]/route.ts   # GET /api/workflow/:id
├── package.json
├── next.config.js
└── Dockerfile (futur)
```

**Responsabilités :**
- ✅ Lire la base de données (via API routes)
- ✅ Afficher workflows hiérarchiques
- ✅ Visualiser diffs de fichiers
- ✅ Updates temps réel (WebSocket)
- ❌ Pas d'écriture en DB (read-only)
- ❌ Pas de modification de workflows

**Communication temps réel :**
```
MCP Server                Web UI
     │                       │
     │  DB Write (Prisma)    │
     ├─────────────→ SQLite (local file)
     │                       │
     │  Emit WebSocket       │
     ├───────────────────────→│
     │                       │
     │                   Update UI
```

---

## Règles d'Isolation

### Shared Package

**✅ Peut contenir :**
- Schéma Prisma
- Types générés par Prisma
- Enums TypeScript

**❌ Ne peut PAS contenir :**
- Logique métier
- Appels API
- Code spécifique MCP/UI

### MCP Server Package

**✅ Peut :**
- Importer depuis `@prisma/client` (shared)
- Importer depuis `simple-git`, `glob`, etc.
- Écrire en DB via Prisma

**❌ Ne peut PAS :**
- Avoir du code UI
- Exposer des endpoints HTTP
- Importer depuis web-ui

### Web UI Package

**✅ Peut :**
- Importer depuis `@prisma/client` (shared)
- Lire la DB via Prisma
- Exposer API routes Next.js

**❌ Ne peut PAS :**
- Écrire en DB (workflows créés uniquement via MCP)
- Importer depuis mcp-server
- Appeler tools MCP directement

---

## Flow de Données

### Création Workflow

```
1. Agent AI appelle start_workflow via MCP
   ↓
2. MCP Server valide arguments
   ↓
3. MCP Server écrit en DB (Prisma)
   ↓
4. MCP Server émet WebSocket (optionnel)
   ↓
5. Web UI reçoit update temps réel
   ↓
6. Web UI affiche nouveau workflow
```

### Completion Task (CRITIQUE)

```
1. Agent AI appelle complete_task via MCP
   ↓
2. MCP Server :
   a) Calcule durée (completedAt - startedAt)
   b) Lance Git diff (commits + working tree)
   c) Parse fichiers Added/Modified/Deleted
   d) Vérifie scope (areas vs fichiers réels)
   e) Génère warnings si hors scope
   ↓
3. MCP Server update DB avec TOUTES les données
   ↓
4. Web UI affiche :
   - Fichiers modifiés (avec diff viewer)
   - Warnings de scope
   - Durée de la task
   - Achievements/Limitations
```

---

## Patterns Architecturaux

### 1. Singleton Prisma Client

Éviter les multiples instances de Prisma (épuise les connexions DB).

```typescript
// mcp-server/src/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 2. Git Snapshot Robuste (Union Commits + Working Tree)

**Problème :** Capturer TOUS les changements (committés ET non committés).

**Solution :**
```typescript
// Au start_task : Stocke hash actuel
const startHash = await git.revparse(['HEAD']) // → "abc123"

// Au complete_task : Union de 2 diffs
const committedDiff = await git.diff([startHash, 'HEAD', '--name-status'])
const workingTreeDiff = await git.diff(['HEAD', '--name-status'])

// Union = vérité absolue
const allChanges = merge(committedDiff, workingTreeDiff)
```

### 3. Validation à la Frontière

Toutes les entrées MCP sont validées AVANT la logique métier.

```typescript
// tools/start-workflow.ts
export async function handleStartWorkflow(args: unknown) {
  // 1. Validation Zod
  const validated = startWorkflowSchema.parse(args)

  // 2. Logique métier
  const workflow = await prisma.workflow.create({
    data: validated
  })

  return { workflow_id: workflow.id }
}
```

### 4. Feature Isolation

Chaque tool MCP est isolé dans son propre fichier.

```
tools/
├── start-workflow.ts      # Feature : Init workflow
├── start-task.ts          # Feature : Init task + snapshot
├── complete-task.ts       # Feature : Finalize + diff
└── ...
```

---

## Sécurité

### 1. Pas de Secrets Hardcodés

```typescript
// ❌ MAUVAIS
const DATABASE_URL = 'postgresql://user:pass@localhost/db'

// ✅ BON
const DATABASE_URL = process.env.DATABASE_URL!
if (!DATABASE_URL) throw new Error('DATABASE_URL required')
```

### 2. Validation Stricte

Toutes les entrées MCP passent par des schémas Zod.

### 3. Isolation Filesystem

Le MCP server NE peut accéder qu'au répertoire Git du projet (via simple-git).

### 4. Read-Only UI

L'interface web NE peut PAS modifier les workflows (immutabilité des données).

---

## Performance

### Database Indexes

```prisma
model Task {
  @@index([workflowId])      // Requêtes par workflow
  @@index([status])          // Filtrage par status
  @@index([startedAt])       // Tri chronologique
}
```

### Cascade Deletions

Suppression automatique des données liées :
```prisma
model Task {
  workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
}
```

Quand un Workflow est supprimé → TOUTES ses Tasks/Decisions/Issues/Milestones sont supprimées.

---

## Exemple Concret : Flow Complete

```
10:00 → Agent : start_workflow("Migration NextAuth")
        MCP   : CREATE workflow in DB
        MCP   : RETURN workflow_id="clx123"

10:05 → Agent : start_task(workflow_id, "Setup routes")
        MCP   : Git snapshot (hash="abc123")
        MCP   : CREATE task in DB
        MCP   : RETURN task_id="clx456"

10:10 → Agent : log_decision(task_id, "LIBRARY_CHOICE", "NextAuth v5")
        MCP   : CREATE decision in DB

10:15 → Agent : log_milestone(task_id, "Installing dependencies...")
        MCP   : CREATE milestone + WebSocket emit
        UI    : Affiche "Installing dependencies..." en temps réel

10:20 → Agent : Modifie auth.ts, database.ts
        Agent : Commit → hash="def456"
        Agent : Modifie config.ts (non commité)

10:25 → Agent : complete_task(task_id, status="success", outcome={...})
        MCP   : Git diff abc123..def456 → auth.ts, database.ts
        MCP   : Git diff def456..HEAD   → config.ts
        MCP   : Union → [auth.ts, database.ts, config.ts]
        MCP   : UPDATE task in DB
        MCP   : RETURN files_changed + verification
        UI    : Affiche task terminée avec diffs
```

---

**Ce document définit l'architecture globale.**
Pour détails spécifiques, voir :
- [MCP Protocol](./mcp-protocol.md) : Spécifications des 6 tools
- [Database](./database.md) : Schéma Prisma complet
- [Standards](./standards.md) : Conventions de code
- [Tech Stack](./tech-stack.md) : Technologies utilisées

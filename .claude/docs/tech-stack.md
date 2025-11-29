# Stack Technique

## Vue d'Ensemble

| Catégorie | Technologie | Version | Justification |
|-----------|-------------|---------|---------------|
| **Runtime** | Node.js | 20 LTS | Stabilité, support long terme |
| **Language** | TypeScript | 5.x | Type-safety obligatoire, mode strict |
| **Monorepo** | pnpm | 8.x | Performance, gestion workspace |
| **Database** | PostgreSQL | 16.x | Robuste, relationnel, enums natifs |
| **ORM** | Prisma | 5.x | Type-safe, migrations auto, multi-DB |
| **MCP SDK** | @modelcontextprotocol/sdk | Latest | Protocole MCP officiel |
| **Git** | simple-git | 3.x | Interface Git pour Node.js |
| **UI** | Next.js 14 | 14.x | SSR, API routes, React Server Components |
| **WebSocket** | Socket.io | 4.x | Temps réel bidirectionnel |
| **Containerization** | Docker | 24.x | Dev + Prod isolation |

---

## Node.js + TypeScript

### Node.js 20 LTS

**Pourquoi Node.js ?**
- Runtime JavaScript serveur mature
- Ecosystem npm/pnpm massif
- Async I/O natif (parfait pour MCP stdio)
- Support long terme (LTS jusqu'en 2026)

**Pourquoi version 20 ?**
- Version LTS la plus récente
- Performance optimisée (V8 latest)
- Fetch API native (pas besoin de polyfill)
- Support ESM natif

### TypeScript 5.x

**Pourquoi TypeScript ?**
- **Type-safety obligatoire** : Catch errors à la compilation
- Inférence Prisma : Types générés automatiquement
- Meilleure DX (autocomplete, refactoring)
- Standard de l'industrie pour projets complexes

**Configuration stricte :**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

---

## Monorepo : pnpm

### Pourquoi pnpm ?

**Performance :**
- Stockage content-addressable (pas de duplication)
- Installation 2-3x plus rapide que npm
- Espace disque réduit (symlinks)

**Workspaces :**
- Gestion multi-packages native
- `workspace:*` protocol pour dépendances locales
- Scripts parallèles (`pnpm -r`)

**vs npm/yarn :**
| Feature | pnpm | npm | Yarn |
|---------|------|-----|------|
| Vitesse install | ⚡⚡⚡ | ⚡ | ⚡⚡ |
| Espace disque | ✅ Min | ❌ Max | ⚡ Moyen |
| Workspaces | ✅ | ✅ | ✅ |
| Strict deps | ✅ | ❌ | ⚡ |

### Structure Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

```json
// package.json (root)
{
  "name": "mcp-workflow-tracker",
  "private": true,
  "scripts": {
    "dev:mcp": "pnpm --filter mcp-server dev",
    "dev:ui": "pnpm --filter web-ui dev",
    "build:all": "pnpm -r build"
  }
}
```

---

## Database : PostgreSQL + Prisma

### PostgreSQL 16.x

**Pourquoi PostgreSQL ?**
- **Enums natifs** : Type-safety au niveau DB
- **Transactions ACID** : Robustesse garantie
- **Relations complexes** : Foreign keys, cascade delete
- **Performance** : Indexes avancés, JSON queries
- **Standard** : Utilisé par 90% des apps production

**vs SQLite :**
| Feature | PostgreSQL | SQLite |
|---------|------------|--------|
| Enums natifs | ✅ | ❌ (émulés) |
| Concurrent writes | ✅ | ❌ Limited |
| Performance (scale) | ⚡⚡⚡ | ⚡ |
| Setup | Serveur requis | Fichier unique |
| Use case | Production | Dev/Embedded |

**Configuration Docker :**
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mcp_tracker
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Prisma 5.x

**Pourquoi Prisma ?**
- **Type-safe queries** : Client TypeScript généré
- **Multi-DB support** : PostgreSQL, SQLite, MySQL sans code change
- **Migrations auto** : Schema → SQL automatique
- **Relations gérées** : Include/select intuitif
- **Developer Experience** : Prisma Studio, formatting

**Architecture :**
```
schema.prisma (packages/shared)
      ↓
  prisma generate
      ↓
@prisma/client (node_modules)
      ↓
mcp-server, web-ui (import)
```

**Exemple type-safety :**
```typescript
// ✅ Type-safe (autocomplete + validation)
const task = await prisma.task.create({
  data: {
    status: TaskStatus.IN_PROGRESS,  // Enum Prisma
    workflowId: 'clx123'
  }
})

// task.status → TaskStatus (type inféré)
```

**vs Autres ORM :**
| Feature | Prisma | TypeORM | Sequelize |
|---------|--------|---------|-----------|
| Type-safety | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Migrations | Auto | Manual | Auto |
| DX | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Multi-DB | ✅ | ✅ | ✅ |

---

## MCP Protocol : @modelcontextprotocol/sdk

### Pourquoi le SDK officiel ?

**Standard MCP :**
- Protocole développé par Anthropic
- Interopérabilité avec tous agents MCP-compatible
- Maintenance assurée

**Features :**
- Gestion stdio automatique
- JSON-RPC transport
- Type-safe tool definitions
- Error handling standardisé

**Architecture MCP :**
```
Agent AI (Claude Code)
      ↓
  MCP Client (intégré)
      ↓ stdio (stdin/stdout)
  MCP Server (@modelcontextprotocol/sdk)
      ↓
  Business Logic (nos tools)
      ↓
  PostgreSQL (Prisma)
```

**Exemple usage :**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server(
  { name: 'mcp-workflow-tracker', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'start_workflow', inputSchema: { ... } }
  ]
}))

const transport = new StdioServerTransport()
await server.connect(transport)
```

---

## Git Integration : simple-git

### Pourquoi simple-git ?

**Robustesse :**
- Wrapper Node.js pour Git CLI
- Support toutes commandes Git
- Async/await natif
- Error handling clair

**vs Alternatives :**
| Library | Pros | Cons |
|---------|------|------|
| simple-git | ✅ Complet, stable | Dépend de Git installé |
| isomorphic-git | ✅ Pure JS, no Git | ⚡ Performance, features limitées |
| nodegit | ✅ Bindings natifs | ❌ Compilation complexe |

**Usage Critique (Snapshot + Diff) :**
```typescript
import simpleGit from 'simple-git'

const git = simpleGit()

// Snapshot au start_task
const hash = await git.revparse(['HEAD'])  // → "abc123"

// Diff au complete_task
const committedDiff = await git.diff(['abc123', 'HEAD', '--name-status'])
const workingTreeDiff = await git.diff(['HEAD', '--name-status'])

// Union = vérité absolue
const allChanges = merge(committedDiff, workingTreeDiff)
```

**Pourquoi critique ?**
- Capture TOUS les changements (commits + working tree)
- Fonctionne même si agent ne commit pas
- Fournit la vérité absolue sur le travail

---

## UI : Next.js 14 (Phase 2)

### Pourquoi Next.js 14 ?

**Features utilisées :**
- **App Router** : Routing file-based moderne
- **Server Components** : Render serveur par défaut (performance)
- **API Routes** : Backend endpoints intégrés
- **TypeScript natif** : Support first-class

**Architecture UI :**
```
packages/web-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx              # GET /
│   │   └── workflow/[id]/
│   │       └── page.tsx          # GET /workflow/:id
│   └── components/
│       ├── TreeView.tsx          # Hiérarchie workflow
│       ├── DiffViewer.tsx        # Affichage diffs
│       └── Timeline.tsx          # Milestones
```

**vs Alternatives :**
| Framework | Pros | Cons |
|-----------|------|------|
| Next.js 14 | ✅ SSR, API routes, full-stack | Learning curve |
| Vite + React | ✅ Simple, rapide | Pas de SSR natif |
| Remix | ✅ SSR, routing | Ecosystem plus petit |

---

## WebSocket : Socket.io (Phase 2)

### Pourquoi Socket.io ?

**Temps réel bidirectionnel :**
- Updates UI instantanés (milestones, task completed)
- Fallback automatique (WebSocket → polling)
- Namespaces/rooms (multi-workflows)

**Architecture :**
```
MCP Server (complete_task)
      ↓
  DB Write (Prisma)
      ↓
  Emit WebSocket (io.emit)
      ↓
  Web UI (socket.on)
      ↓
  Update UI (React state)
```

**Exemple :**
```typescript
// MCP Server
import { Server } from 'socket.io'

const io = new Server(3001)

await prisma.task.update({ ... })
io.emit('task:completed', task)

// Web UI
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')
socket.on('task:completed', (task) => {
  // Update UI
})
```

**vs Alternatives :**
| Tech | Pros | Cons |
|------|------|------|
| Socket.io | ✅ Fallbacks, rooms | Bundle size |
| WS (native) | ✅ Léger | Pas de fallback |
| SSE | ✅ Simple, HTTP | Unidirectionnel |

---

## Containerization : Docker

### Pourquoi Docker ?

**Dev Environment :**
- PostgreSQL sans installation locale
- Environnement reproductible
- Isolation (pas de conflits)

**Production (futur) :**
- Déploiement standardisé
- Scalabilité (Kubernetes)
- Rollback facile

**Docker Compose (dev) :**
```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mcp-server:
    build: ./packages/mcp-server
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mcp_tracker

  web-ui:
    build: ./packages/web-ui
    ports:
      - "3000:3000"
    depends_on:
      - db
```

---

## Dépendances Principales

### packages/shared

```json
{
  "dependencies": {
    "@prisma/client": "^5.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x"
  }
}
```

### packages/mcp-server

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "@prisma/client": "^5.x",
    "simple-git": "^3.x",
    "glob": "^10.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "tsx": "^4.x"
  }
}
```

### packages/web-ui (Phase 2)

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@prisma/client": "^5.x",
    "socket.io": "^4.x",
    "socket.io-client": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^18.x",
    "@types/node": "^20.x"
  }
}
```

---

## Justifications Détaillées

### Pourquoi pnpm (vs npm/yarn) ?

**Performance :**
```bash
# Installation initiale (projet vide → full install)
npm install     → 45s
yarn install    → 35s
pnpm install    → 22s  ✅

# Espace disque (3 packages × 200 deps)
npm    → 600 MB (duplication totale)
yarn   → 450 MB (hoisting)
pnpm   → 150 MB (content-addressable) ✅
```

**Strict Dependencies :**
- pnpm ne permet PAS d'importer des deps non déclarées
- Évite les bugs "ça marche sur ma machine"

### Pourquoi PostgreSQL (vs SQLite) ?

**Phase 1 (Dev + Prod) :**
- Enums natifs → Type-safety DB (critical)
- Concurrent writes → Multiples agents simultanés
- Performance → Index optimisés pour requêtes complexes

**Phase 2 (Distribution standalone - SQLite) :**
- Fichier unique portable
- Pas de serveur à installer
- Parfait pour distribution npm/binaire

**Décision :** PostgreSQL Phase 1, SQLite ajouté Phase 2 (multi-DB via Prisma)

### Pourquoi Prisma (vs TypeORM/Sequelize) ?

**Type-safety :**
```typescript
// Prisma : Autocomplete + validation
const task = await prisma.task.findUnique({
  where: { id: 'clx123' },
  include: { decisions: true }  // ✅ Autocomplete
})
// task.decisions → Decision[] (inféré)

// TypeORM : Partial type-safety
const task = await taskRepository.findOne({
  where: { id: 'clx123' },
  relations: ['decisions']  // ⚡ String (pas d'autocomplete)
})
// task.decisions → any[] (cast nécessaire)
```

**Migrations :**
- Prisma : `prisma migrate dev` → SQL généré automatiquement
- TypeORM : Écriture manuelle ou génération partielle

**DX :**
- Prisma Studio : Interface DB visuelle intégrée
- Format automatique schema.prisma

### Pourquoi simple-git (vs isomorphic-git/nodegit) ?

**Robustesse :**
- simple-git wrappe Git CLI → Toutes features Git disponibles
- isomorphic-git : Pure JS mais features limitées (pas de diff --name-status natif)
- nodegit : Bindings natifs mais compilation complexe (problèmes multi-OS)

**Décision :** simple-git pour robustesse + simplicité

### Pourquoi Next.js (vs Vite+React/Remix) ?

**Phase 2 besoins :**
- Server-side rendering (SEO, performance)
- API routes (pas besoin serveur Express séparé)
- React Server Components (fetch data serveur)

**Vite+React :** CSR uniquement, besoin backend séparé
**Remix :** Bon choix alternatif, mais ecosystem Next.js plus large

**Décision :** Next.js 14 pour full-stack intégré

---

## Versions Importantes

**LTS & Stabilité :**
- **Node.js 20 LTS** : Support jusqu'en 2026
- **PostgreSQL 16** : Version stable actuelle
- **TypeScript 5** : Version stable avec toutes features modernes

**Pas de versions Beta :**
- Toutes les dépendances sont en versions stables
- Priorité : Robustesse > Bleeding edge

---

## Alternatives Considérées

### MCP Server

**Option 1 : Python + FastAPI**
- ✅ Pros : FastAPI mature, async natif
- ❌ Cons : Ecosystem Python moins riche pour Git, DB ORM moins type-safe

**Option 2 : Rust + Tokio**
- ✅ Pros : Performance max, type-safety ultime
- ❌ Cons : Complexité élevée, ecosystem plus petit

**✅ Choix : Node.js + TypeScript**
- Balance performance/DX/ecosystem
- simple-git excellent pour Git operations
- Prisma meilleur ORM type-safe

### Database

**Option 1 : SQLite uniquement**
- ✅ Pros : Simple, portable, fichier unique
- ❌ Cons : Pas d'enums natifs, concurrent writes limitées

**Option 2 : MongoDB**
- ✅ Pros : Schema flexible, JSON natif
- ❌ Cons : Pas de relations, pas d'enums, type-safety moindre

**✅ Choix : PostgreSQL (+ SQLite Phase 2)**
- Type-safety critique (enums)
- Relations complexes (Workflow → Tasks → Decisions)
- Multi-DB via Prisma pour flexibilité future

---

## Budget Estimé (Production Future)

| Service | Coût Mensuel |
|---------|--------------|
| VPS (2 vCPU, 4GB RAM) | 10-20€ |
| PostgreSQL (managed) | 0€ (Supabase free) - 25€ (Neon/Supabase Pro) |
| Docker Registry | 0€ (Docker Hub free) |
| **TOTAL MVP** | **~10-20€/mois** |
| **TOTAL Scale (1000+ workflows)** | **~40-50€/mois** |

**Note :** MCP Server = stdio, pas besoin de serveur web public

---

**Ce document liste les technologies et leurs justifications.**
Pour l'architecture globale, voir :
- [Architecture](./architecture.md) : Structure du projet
- [MCP Protocol](./mcp-protocol.md) : Spécifications MCP
- [Database](./database.md) : Schéma Prisma
- [Standards](./standards.md) : Conventions de code

# Project Structure Reference

**Note** : Pour les détails techniques complets de l'architecture, consultez [.claude/docs/architecture.md](../.claude/docs/architecture.md)

Ce fichier fournit une vue d'ensemble high-level de la structure du projet.

---

## Arborescence complète (Post-implémentation)

```
mcp-workflow-tracker/
├── documentations/
│   ├── README.md                      # Vue d'ensemble + Cas d'usage
│   ├── IMPLEMENTATION-CHECKLIST.md    # Checklist étape par étape
│   ├── PROJECT-STRUCTURE.md           # Ce fichier
│   └── INDEX.md                       # Index de navigation
│
├── packages/
│   ├── shared/                        # Types partagés + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Schéma DB (voir /.claude/docs/database.md)
│   │   │   └── migrations/            # Migrations SQL auto-générées
│   │   ├── src/
│   │   │   └── index.ts               # Exports types Prisma
│   │   ├── package.json
│   │   └── .env                       # DATABASE_PROVIDER + DATABASE_URL
│   │
│   ├── mcp-server/                    # Serveur MCP (Phase 1)
│   │   ├── src/
│   │   │   ├── index.ts               # Point d'entrée MCP (stdio)
│   │   │   ├── db.ts                  # Prisma client singleton
│   │   │   ├── tools/
│   │   │   │   ├── start-workflow.ts
│   │   │   │   ├── start-task.ts
│   │   │   │   ├── log-decision.ts
│   │   │   │   ├── log-issue.ts
│   │   │   │   ├── log-milestone.ts
│   │   │   │   └── complete-task.ts
│   │   │   └── utils/
│   │   │       ├── git-snapshot.ts    # Logique Git robuste
│   │   │       ├── checksum.ts        # Fallback checksums
│   │   │       └── scope-verify.ts    # Vérification scope
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile                 # Docker image (à venir)
│   │
│   └── web-ui/                        # UI Next.js (Phase 2)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx           # Liste des workflows
│       │   │   └── workflow/[id]/
│       │   │       └── page.tsx       # Détails workflow
│       │   ├── components/
│       │   │   ├── TreeView.tsx       # Vue hiérarchique
│       │   │   ├── DiffViewer.tsx     # Affichage diffs
│       │   │   └── Timeline.tsx       # Timeline milestones
│       │   └── lib/
│       │       ├── prisma.ts          # Prisma client
│       │       └── websocket.ts       # Socket.io client
│       ├── package.json
│       ├── next.config.js
│       └── Dockerfile                 # Docker image (à venir)
│
├── docker-compose.yml                 # Orchestration Docker (à venir)
├── .dockerignore                      # Fichiers ignorés par Docker
├── package.json                       # Workspace root
├── pnpm-workspace.yaml                # Config pnpm
├── pnpm-lock.yaml
└── README.md                          # README principal du projet
```

---

## Dépendances par package

### shared
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

### mcp-server
```json
{
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

### web-ui (Phase 2)
```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@mcp-tracker/shared": "workspace:*",
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

## Scripts npm principaux

**À la racine du monorepo** :

```bash
# Développement
pnpm dev:mcp          # Lance le MCP server (Phase 1)
pnpm dev:ui           # Lance l'UI Next.js (Phase 2)

# Base de données
pnpm db:migrate       # Lance les migrations Prisma
pnpm db:generate      # Génère le client Prisma
pnpm db:studio        # Ouvre Prisma Studio

# Build
pnpm build:mcp        # Build le MCP server
pnpm build:ui         # Build l'UI
```

---

## Ports utilisés

| Service | Port | Usage |
|---------|------|-------|
| PostgreSQL | 5432 | Base de données |
| MCP Server | stdio | Communication via stdio (pas de port HTTP) |
| Web UI | 3000 | Interface Next.js |
| WebSocket | 3001 | Socket.io pour temps réel |

---

## Variables d'environnement

### packages/shared/.env

**Option A : PostgreSQL (Recommandé)**
```bash
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:password@localhost:5432/mcp_tracker?schema=public"
```

**Option B : SQLite (Alternatif)**
```bash
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"
```

**Note** : Voir `/.claude/docs/database.md` pour plus de détails sur le choix de la DB.

---

### packages/web-ui/.env (Phase 2)
```bash
# Utiliser la même configuration que shared/.env
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:password@localhost:5432/mcp_tracker?schema=public"

# WebSocket URL pour le temps réel
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

---

## Points d'entrée

| Composant | Fichier | Commande |
|-----------|---------|----------|
| MCP Server | `packages/mcp-server/src/index.ts` | `pnpm dev:mcp` |
| Web UI | `packages/web-ui/src/app/page.tsx` | `pnpm dev:ui` |
| Migrations DB | `packages/shared/prisma/schema.prisma` | `pnpm db:migrate` |

---

## Workflow typique de développement

### Modification du schéma DB
```bash
# 1. Éditer packages/shared/prisma/schema.prisma
# 2. Créer la migration
pnpm db:migrate
# 3. Régénérer le client
pnpm db:generate
# 4. Redémarrer les services
pnpm dev:mcp
```

### Ajout d'un nouveau tool MCP
```bash
# 1. Créer packages/mcp-server/src/tools/new-tool.ts
# 2. Définir le schema + handler
# 3. Enregistrer dans src/index.ts (ListToolsRequestSchema + CallToolRequestSchema)
# 4. Tester
pnpm dev:mcp
```

---

## Configuration Claude Code

**Fichier : `.claude/mcp.json`**
```json
{
  "mcpServers": {
    "workflow-tracker": {
      "command": "tsx",
      "args": ["/home/ilan/code/mcpAgentTracker/packages/mcp-server/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/mcp_tracker"
      }
    }
  }
}
```

**Fichier : `.claude/prompts/system.md` (à créer)**

Ajouter les instructions d'utilisation du MCP (voir `/.claude/docs/mcp-protocol.md` section "Prompts système suggérés").

---

## Ressources utiles

- [MCP SDK Docs](https://modelcontextprotocol.io)
- [Prisma Docs](https://www.prisma.io/docs)
- [simple-git Docs](https://github.com/steveukx/git-js)
- [Next.js Docs](https://nextjs.org/docs)
- [Socket.io Docs](https://socket.io/docs)

---

**Cette structure est optimisée pour** :
- ✅ Séparation claire des responsabilités (monorepo)
- ✅ Partage de types TypeScript via workspace
- ✅ Développement parallèle (MCP Server + Web UI indépendants)
- ✅ Scalabilité (facile d'ajouter de nouveaux packages)

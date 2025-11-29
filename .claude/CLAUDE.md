---
model: sonnet-4.5
---

# MCP Workflow Tracker - Système d'Observabilité pour Workflows Agentiques

## Description

Système d'observabilité capturant l'INTENTION, le RAISONNEMENT et les MODIFICATIONS de code des workflows agentiques multi-agents (Claude Code, Cline, etc.).

**Objectif** : "Boîte noire" complète traçant :
- 🌳 Structure hiérarchique (workflow → tasks → subtasks)
- 🧠 Décisions architecturales avec raisonnement
- ⚠️ Problèmes rencontrés et résolutions
- 📁 Fichiers modifiés (diffs Git automatiques)
- ⏱️ Métriques temporelles et coûts

**Type** : Monorepo (pnpm) avec MCP Server (Node.js) + Web UI (Next.js) + Shared (Prisma)

**Phase actuelle** : Phase 1 - MCP Server Backend

---

## Standards Non-Négociables

### Architecture

- **OBLIGATOIRE** : Monorepo pnpm avec isolation stricte des packages
- **OBLIGATOIRE** : Clean Architecture (business logic séparée de l'infrastructure)
- **OBLIGATOIRE** : SOC (Separation of Concerns) - shared = types, mcp-server = logic, web-ui = presentation
- **INTERDIT** : Couplage entre packages (sauf via shared)

**Packages** :
```
packages/
├── shared/        # Prisma schema + types (source of truth)
├── mcp-server/    # MCP Server (stdio protocol)
└── web-ui/        # Next.js UI + WebSocket (Phase 2)
```

### TypeScript

- **Mode strict activé** : `strict: true`
- **INTERDIT** : `any` (utiliser `unknown` si nécessaire)
- **OBLIGATOIRE** : Types explicites pour fonctions publiques
- **OBLIGATOIRE** : Enums Prisma pour tous les status/categories (type safety DB + app)

### MCP Protocol

- **OBLIGATOIRE** : Respect strict du protocole MCP (stdio, JSON-RPC 2.0)
- **OBLIGATOIRE** : Structured reporting (JSON schemas validés)
- **OBLIGATOIRE** : Git snapshot robuste (union commits + working tree) dans `complete_task`
- **INTERDIT** : Flood de contexte (max 3-6 appels MCP par task)

### Database

- **OBLIGATOIRE** : Prisma ORM uniquement (pas de raw SQL)
- **OBLIGATOIRE** : Support multi-DB via `DATABASE_PROVIDER` env var
- **Phase 1** : PostgreSQL (développement local + Docker)
- **Phase 2** : SQLite (distribution standalone npm)
- **OBLIGATOIRE** : Migrations via Prisma (pas de sync())

### Git

- **Convention** : Conventional Commits (`type(scope): description`)
- **Types** : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- **INTERDIT** : Commits non conventional

---

## 📚 Documentation de Référence

**Les agents DOIVENT consulter ces documents pour le contexte complet :**

- **Architecture** : `.claude/docs/architecture.md`
  _(Monorepo, MCP protocol, Clean Architecture, patterns)_

- **MCP Protocol** : `.claude/docs/mcp-protocol.md`
  _(Spécifications des 6 tools, Git snapshot robuste, exemples)_

- **Database** : `.claude/docs/database.md`
  _(Schéma Prisma complet, multi-DB, enums, explications modèles)_

- **Standards de Code** : `.claude/docs/standards.md`
  _(Conventions détaillées, TypeScript, validation, sécurité)_

- **Stack Technique** : `.claude/docs/tech-stack.md`
  _(Technologies, justifications, comparaisons alternatives)_

---

## Workflow Recommandé

### Pour Features Simples (< 30 min, < 3 fichiers modifiés)
→ Utilise le **main chat** directement (il a accès à ce CLAUDE.md)

### Pour Features Complexes (nouveau tool MCP, UI complète)

**Étapes recommandées :**

1. **Brainstorm** (Main chat)
   - Discussion stratégique sur l'approche
   - Clarification des exigences
   - Décisions d'architecture si ambiguës

2. **Plan**
   - Génère un plan d'implémentation structuré
   - Document sauvegardé dans `.claude/plans/`

3. **Implémentation**
   - Implémente étape par étape
   - Suit l'architecture monorepo strictement
   - Consulte `.claude/docs/` pour les specs

4. **Review**
   - Vérifie : architecture, standards, sécurité, Git snapshot logic
   - Valide les enums type-safe

### Commits

**IMPORTANT** : Ne committer QUE quand demandé explicitement par l'utilisateur.

Format Conventional Commits :
```bash
git add .
git commit -m "feat(mcp-server): add complete_task tool with Git diff union"
```

---

## Structure Projet (Résumé)

```
mcp-workflow-tracker/
├── packages/
│   ├── shared/                  # Source of truth (Prisma + types)
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Avec enums type-safe
│   │   │   └── migrations/
│   │   └── .env                 # DATABASE_PROVIDER + DATABASE_URL
│   │
│   ├── mcp-server/              # MCP Server (Phase 1)
│   │   └── src/
│   │       ├── index.ts         # Entry point (stdio)
│   │       ├── db.ts            # Prisma singleton
│   │       ├── tools/           # 6 MCP tools handlers
│   │       │   ├── start-workflow.ts
│   │       │   ├── start-task.ts
│   │       │   ├── log-decision.ts
│   │       │   ├── log-issue.ts
│   │       │   ├── log-milestone.ts
│   │       │   └── complete-task.ts
│   │       └── utils/
│   │           ├── git-snapshot.ts    # Git logic robuste
│   │           ├── checksum.ts
│   │           └── scope-verify.ts
│   │
│   └── web-ui/                  # Next.js UI (Phase 2)
│       └── src/
│           ├── app/
│           ├── components/
│           └── lib/
│
├── documentations/              # Documentation générale du projet
├── .claude/                     # Config Claude Code
│   ├── CLAUDE.md               # Ce fichier
│   └── docs/                   # Documentation technique
├── docker-compose.yml          # Dev local (PostgreSQL)
└── package.json                # Workspace root
```

---

## Principes Clés

### 1. Monorepo = Isolation Stricte

```
✅ BON : shared expose types, mcp-server import depuis shared
packages/mcp-server/src/tools/start-workflow.ts
import { PrismaClient, WorkflowStatus } from '@prisma/client'

❌ MAUVAIS : mcp-server importe directement depuis web-ui
import { TreeView } from '../../../web-ui/src/components/TreeView'
```

### 2. Git Snapshot Robuste (CRITIQUE)

**Dans `complete_task`, on capture TOUT le travail de l'agent :**

```typescript
// DIFF 1 : Commits effectués pendant la task
git diff <start_hash> HEAD --name-status

// DIFF 2 : Working tree non commité
git diff HEAD --name-status

// UNION = Vérité absolue sur le travail de l'agent
```

**Pourquoi** : Si l'agent commit pendant sa task, un simple `git diff HEAD` raterait son travail.

### 3. Enums Type-Safe Partout

```typescript
// ✅ BON : Enums Prisma
import { TaskStatus } from '@prisma/client'
await prisma.task.create({
  data: { status: TaskStatus.IN_PROGRESS }
})

// ❌ MAUVAIS : Strings magiques
await prisma.task.create({
  data: { status: 'in_progress' }  // Erreur TypeScript
})
```

### 4. Smart Capture (3 niveaux)

**Obligatoire** : `start_workflow`, `start_task`, `complete_task`
**Optionnel** : `log_decision`, `log_issue` (seulement si valeur ajoutée)
**Automatique** : Durée, fichiers modifiés (via Git diff)

**Total : 3-6 appels MCP par task (pas de flood de contexte)**

### 5. Validation Frontière (Backend)

```typescript
// OBLIGATOIRE : Validation Zod de TOUTES les entrées
import { z } from 'zod'

const StartTaskSchema = z.object({
  workflow_id: z.string().cuid(),
  name: z.string().min(1),
  goal: z.string().min(10)
})

// Dans le handler
export async function handleStartTask(args: unknown) {
  const validatedArgs = StartTaskSchema.parse(args)  // Throw si invalide
  // ...
}
```

### 6. Pas de Secrets dans le Code

- Toutes les clés dans `.env`
- Jamais commit `.env`
- `.env.example` avec placeholders

---

## Contexte Métier Important

### MCP Protocol (Model Context Protocol)

Le MCP est un **protocole standard** pour que les LLMs interagissent avec des outils externes :
- Communication via **stdio** (stdin/stdout)
- Format **JSON-RPC 2.0**
- Tools = fonctions exposées par le serveur MCP
- Resources = données exposées (optionnel, pas utilisé en Phase 1)

**Notre implémentation** :
- 6 tools pour tracker un workflow agentique
- Capture structurée (JSON schemas strict)
- Pas de flood de contexte (appels minimaux)

### Philosophie "Smart Capture"

**Problème résolu** : Git capture les fichiers, mais pas les décisions, compromis et contexte.

**Solution** :
- **MCP gère la vérité "Fichiers"** (via Git diff automatique)
- **Agent gère la vérité "Logique"** (via structured reporting)

**Exemple** :
```
Agent dit : "J'ai choisi Zod pour la validation"
MCP détecte : package.json modifié (zod ajouté)
Résultat : Décision + preuve technique = audit complet
```

### Multi-DB Support

**PostgreSQL** (Phase 1) :
- Développement local + Docker
- Enums natifs DB
- Performance optimale

**SQLite** (Phase 2) :
- Distribution standalone npm
- Pas de serveur DB à installer
- Parfait pour package npm global

**Code identique** : Prisma gère la conversion automatiquement.

---

## Exemples de Commandes

### Implémenter un nouveau tool MCP

```
"Implémente le tool log_decision en respectant les specs
dans .claude/docs/mcp-protocol.md"
```

### Créer une migration Prisma

```
"Ajoute un champ 'retryCount' au modèle Task pour tracker
les retries automatiques"
```

### Debug Git snapshot

```
"Le complete_task ne détecte pas les fichiers commités,
vérifie la logique Git dans utils/git-snapshot.ts"
```

---

## Notes pour les Agents

### Quand lire les docs complètes

- **architecture.md** : Quand vous créez/modifiez la structure monorepo
- **mcp-protocol.md** : Quand vous implémentez/modifiez un tool MCP
- **database.md** : Quand vous créez/modifiez le schéma Prisma
- **standards.md** : TOUJOURS (pour chaque feature)
- **tech-stack.md** : Quand vous ajoutez une dépendance

### Points Critiques à Ne JAMAIS Oublier

1. **Git Snapshot** : Union de 2 diffs (commits + working tree) dans `complete_task`
2. **Enums** : Utiliser les enums Prisma, JAMAIS de strings magiques
3. **Validation** : Zod pour TOUTES les entrées utilisateur
4. **Isolation** : Packages ne se parlent QUE via shared
5. **Type Safety** : `strict: true`, pas de `any`

### En Cas de Doute

- **Architecture** : Monorepo strict, packages isolés
- **MCP Protocol** : Stdio, JSON-RPC 2.0, schemas validés
- **Database** : Prisma uniquement, enums type-safe
- **Git** : Conventional Commits TOUJOURS

---

## Checklist Avant Commit (Mental)

- [ ] Code dans le bon package (shared/mcp-server/web-ui)
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Enums Prisma utilisés (pas de strings magiques)
- [ ] Validation Zod (si inputs utilisateur)
- [ ] Git snapshot logic respectée (si complete_task)
- [ ] Pas de secrets hardcodés
- [ ] Conventional commit message
- [ ] Documentation technique consultée

---

**Version** : 1.0
**Dernière mise à jour** : 29 Novembre 2024

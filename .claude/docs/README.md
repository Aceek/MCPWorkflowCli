# Documentation Technique - MCP Workflow Tracker

Cette documentation technique couvre l'architecture, le protocole MCP, la base de données, les standards de code et la stack technique du projet.

---

## Structure de la Documentation

### [1. Architecture](./architecture.md)
Vue d'ensemble de l'architecture du projet :
- Principe Clean Architecture + Feature-Based
- Structure Monorepo (shared, mcp-server, web-ui)
- Protocole MCP (stdio communication)
- Règles d'isolation des packages
- Patterns architecturaux (Singleton Prisma, Git Snapshot robuste, etc.)
- Flow de données complet

**À lire en premier** pour comprendre la structure globale.

---

### [2. MCP Protocol](./mcp-protocol.md)
Spécifications complètes des 6 tools MCP :
- `start_workflow` : Initialiser un workflow
- `start_task` : Démarrer une task + snapshot Git
- `log_decision` : Logger une décision architecturale
- `log_issue` : Logger un problème rencontré
- `log_milestone` : Update temps réel pour l'UI
- `complete_task` : Finaliser task + calcul diffs Git (CRITIQUE)

**À lire** pour implémenter le MCP Server.

---

### [3. Database](./database.md)
Schéma Prisma complet avec explications :
- Support multi-DB (PostgreSQL recommandé, SQLite pour distribution)
- 5 modèles : Workflow, Task, Decision, Issue, Milestone
- Enums type-safe (WorkflowStatus, TaskStatus, DecisionCategory, etc.)
- Indexes et optimisations
- Cascade deletions
- Exemples de requêtes

**À lire** pour comprendre le modèle de données.

---

### [4. Standards](./standards.md)
Conventions de code et best practices :
- Conventions de nommage (camelCase, PascalCase, SCREAMING_SNAKE_CASE)
- TypeScript strict mode
- Git Conventional Commits
- Structure des fichiers
- Validation Zod
- Gestion d'erreurs
- Tests (Phase 2)
- Sécurité

**À lire** avant d'écrire du code.

---

### [5. Tech Stack](./tech-stack.md)
Technologies utilisées et justifications détaillées :
- Node.js 20 LTS + TypeScript 5.x
- Monorepo pnpm (pourquoi vs npm/yarn)
- PostgreSQL 16.x + Prisma 5.x (pourquoi vs SQLite/MongoDB)
- @modelcontextprotocol/sdk (protocole MCP officiel)
- simple-git (pourquoi vs isomorphic-git/nodegit)
- Next.js 14 + Socket.io (Phase 2)
- Docker Compose

**À lire** pour comprendre les choix techniques.

---

## Navigation Rapide

### Pour Démarrer
1. Lire [Architecture](./architecture.md) → Vue d'ensemble
2. Lire [MCP Protocol](./mcp-protocol.md) → Comprendre les tools
3. Lire [Database](./database.md) → Comprendre le modèle de données

### Pour Implémenter
1. Consulter [Standards](./standards.md) → Conventions de code
2. Consulter [MCP Protocol](./mcp-protocol.md) → Spécifications détaillées des tools
3. Consulter [Database](./database.md) → Requêtes Prisma

### Pour Comprendre les Choix Techniques
1. Lire [Tech Stack](./tech-stack.md) → Justifications détaillées
2. Lire [Architecture](./architecture.md) → Patterns architecturaux

---

## Points Critiques à Retenir

### 1. Git Snapshot Robuste (CRITIQUE)

Le calcul des fichiers modifiés utilise **l'union de 2 diffs** :

```typescript
// Diff 1 : Commits effectués
git diff <start_hash> HEAD --name-status

// Diff 2 : Working tree non commité
git diff HEAD --name-status

// Union = vérité absolue
```

**Pourquoi ?** Capture TOUS les changements (committés + non committés).

Voir [MCP Protocol - complete_task](./mcp-protocol.md#6-complete_task-le-plus-critique) pour détails.

---

### 2. Enums Type-Safe (CRITIQUE)

Tous les enums sont définis dans Prisma et validés strictement :

```typescript
// ✅ BON
status: TaskStatus.SUCCESS

// ❌ ERREUR TypeScript
status: "success"
```

Voir [Database - Enums](./database.md#enums-type-safety) pour la liste complète.

---

### 3. Isolation des Packages (Clean Architecture)

**Règles strictes :**
- ✅ `shared` : Types Prisma uniquement
- ✅ `mcp-server` : Business logic MCP
- ✅ `web-ui` : Presentation (read-only DB)
- ❌ Pas d'imports entre mcp-server ↔ web-ui

Voir [Architecture - Règles d'Isolation](./architecture.md#règles-disolation) pour détails.

---

### 4. Principe DRY (Don't Repeat Yourself)

**Exemple :** Logique Git snapshot centralisée dans `utils/git-snapshot.ts` :
- Utilisée par `start_task` (snapshot initial)
- Utilisée par `complete_task` (diff)
- Pas de duplication de code

Voir [Standards - Structure de Fichiers](./standards.md#structure-de-fichiers) pour exemples.

---

## Documentation Complémentaire

Cette documentation technique est complémentaire à la documentation générale située dans `/documentations/` :

- `/documentations/README.md` : Vue d'ensemble générale
- `/documentations/MCP-SPECS.md` : Spécifications MCP (même contenu que mcp-protocol.md)
- `/documentations/DATABASE.md` : Schéma DB (même contenu que database.md)
- `/documentations/PROJECT-STRUCTURE.md` : Structure du projet
- `/documentations/IMPLEMENTATION-CHECKLIST.md` : Checklist d'implémentation

---

## Contribution

**Avant de modifier cette documentation :**
1. Lire [Standards](./standards.md) pour les conventions
2. Maintenir la cohérence entre les 5 fichiers
3. Ajouter des exemples de code TypeScript
4. Mettre en évidence les points critiques (CRITIQUE)

---

**Cette documentation est la référence technique unique du projet.**
Consultez-la régulièrement pendant le développement.

# MCP Workflow Tracker

> Système d'observabilité pour workflows agentiques - Capture l'INTENTION, le RAISONNEMENT et les MODIFICATIONS de code.

## 🎯 Objectif

Transformer les workflows complexes multi-agents en "boîtes noires" traçables, documentant :
- 🌳 **Structure hiérarchique** (workflow → tasks → subtasks)
- 🧠 **Décisions architecturales** avec raisonnement
- ⚠️ **Problèmes rencontrés** et résolutions
- 📁 **Fichiers modifiés** (diffs Git automatiques)
- ⏱️ **Métriques temporelles** et coûts

## 📚 Documentation

Toute la documentation technique se trouve dans `/documentations/` :

### Démarrage rapide
1. **[INDEX.md](documentations/INDEX.md)** - Guide de navigation
2. **[README.md](documentations/README.md)** - Vue d'ensemble du projet
3. **[IMPLEMENTATION-CHECKLIST.md](documentations/IMPLEMENTATION-CHECKLIST.md)** - Guide étape par étape

### Références techniques
- **[DATABASE.md](documentations/DATABASE.md)** - Schéma Prisma complet
- **[MCP-SPECS.md](documentations/MCP-SPECS.md)** - Spécifications des tools MCP
- **[PROJECT-STRUCTURE.md](documentations/PROJECT-STRUCTURE.md)** - Structure du projet

## 🚀 Quick Start

### Setup recommandé (avec Docker)

**Documentation Docker complète disponible prochainement** dans `documentations/DOCKER.md`.

Le setup Docker inclura :
- PostgreSQL containerisé (pré-configuré)
- MCP Server prêt à l'emploi
- Pas de configuration manuelle requise

### Setup manuel

```bash
# 1. Consulter la documentation
cat documentations/INDEX.md

# 2. Lire la vue d'ensemble
cat documentations/README.md

# 3. Suivre la checklist d'implémentation
cat documentations/IMPLEMENTATION-CHECKLIST.md
```

**Note** : Le setup manuel supporte PostgreSQL ou SQLite (voir `DATABASE.md`).

## 🏗️ Architecture

**Monorepo Structure** (pnpm workspaces)
```
mcp-workflow-tracker/
├── documentations/        # Documentation technique
├── packages/
│   ├── mcp-server/       # MCP Server (Phase 1 - EN COURS)
│   ├── web-ui/           # Next.js UI (Phase 2)
│   └── shared/           # Prisma schema + Types
└── README.md             # Ce fichier
```

## 📊 Stack Technique

- **MCP Server** : Node.js + TypeScript + @modelcontextprotocol/sdk
- **Database** : PostgreSQL (recommandé) ou SQLite (distribution standalone)
- **ORM** : Prisma (support multi-DB avec enums TypeScript)
- **Web UI** : Next.js 14 + Socket.io (temps réel)
- **Git Integration** : simple-git (snapshots/diffs robustes)
- **Deployment** : Docker Compose (PostgreSQL + services containerisés)

## 🎯 Phase actuelle : Phase 1 (MCP Server Backend)

**Objectif** : Implémenter le serveur MCP avec les 6 tools de tracking.

**Prochaines étapes** :
1. Setup monorepo pnpm
2. Configuration Prisma + PostgreSQL
3. Implémentation des 6 tools MCP
4. Tests avec Claude Code

**Durée estimée** : 2-3h

---

**Pour commencer l'implémentation** → Lire `documentations/IMPLEMENTATION-CHECKLIST.md`

**Pour comprendre l'architecture** → Lire `documentations/README.md`

**Pour les specs techniques** → Lire `documentations/MCP-SPECS.md`

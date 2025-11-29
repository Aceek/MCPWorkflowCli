# MCP Workflow Tracker - Vue d'Ensemble

## Description

Système d'observabilité pour workflows agentiques (Claude Code, Cline, etc.) capturant l'INTENTION, le RAISONNEMENT et les MODIFICATIONS de code.

**Problème résolu** : Les workflows complexes avec multiples sub-agents manquent de traçabilité. Git capture les fichiers, mais pas les décisions, compromis et contexte.

---

## Objectifs Business

**"Boîte noire" complète** pour workflows agentiques enregistrant :
- 🌳 Structure hiérarchique (workflow → tasks → subtasks)
- 🧠 Décisions architecturales avec raisonnement
- ⚠️ Problèmes rencontrés et résolutions
- 📁 Fichiers modifiés (avec diffs Git automatiques)
- ⏱️ Métriques temporelles et coûts

**Valeur ajoutée** :
- Audit complet des décisions techniques
- Détection de side effects involontaires
- Traçabilité pour debug post-mortem
- Documentation automatique du travail agent

---

## Cas d'Usage

### 1. Développement Solo avec Agent AI
```
Contexte : Tu développes avec Claude Code, l'agent effectue plusieurs tâches en parallèle
Besoin : Comprendre POURQUOI chaque décision a été prise
Solution : Le MCP log automatiquement les décisions avec raisonnement
```

### 2. Workflow Multi-Agents
```
Contexte : Agent A setup l'auth, Agent B configure la DB, Agent C crée l'UI
Besoin : Tracer quel agent a modifié quoi et pourquoi
Solution : Chaque agent log ses tasks avec scope + Git diff automatique
```

### 3. Debug Post-Mortem
```
Contexte : L'app crash en production, tu ne te souviens pas quelle task a introduit le bug
Besoin : Retrouver l'historique exact des modifications
Solution : Timeline complète avec fichiers modifiés, décisions et issues logged
```

### 4. Onboarding Nouveaux Devs
```
Contexte : Nouveau dev rejoint le projet
Besoin : Comprendre l'historique des choix techniques
Solution : Export Markdown du workflow avec décisions architecturales
```

---

## Architecture High-Level

**Stack** : Monorepo pnpm avec 3 packages isolés

```
packages/
├── shared/        # Types partagés + Prisma Schema (source of truth)
├── mcp-server/    # MCP Server (stdio protocol) - Phase 1
└── web-ui/        # Next.js UI (WebSocket real-time) - Phase 2
```

**Technologies** :
- MCP Server : Node.js + TypeScript + @modelcontextprotocol/sdk
- Database : PostgreSQL (dev) / SQLite (distribution standalone)
- Web UI : Next.js 14 + Socket.io

---

## Documentation Technique

Pour les détails techniques (architecture, specs MCP, database), consultez **`.claude/docs/`** :

| Documentation | Contenu |
|---------------|---------|
| **[.claude/docs/architecture.md](./.claude/docs/architecture.md)** | Architecture monorepo, MCP protocol, patterns |
| **[.claude/docs/mcp-protocol.md](./.claude/docs/mcp-protocol.md)** | Spécifications des 6 tools MCP, Git snapshot robuste |
| **[.claude/docs/database.md](./.claude/docs/database.md)** | Schéma Prisma complet, enums, multi-DB |
| **[.claude/docs/standards.md](./.claude/docs/standards.md)** | Conventions de code, TypeScript, sécurité |
| **[.claude/docs/tech-stack.md](./.claude/docs/tech-stack.md)** | Technologies utilisées et justifications |

---

## Onboarding Développeurs

### Quick Start

1. **Lire la vision** : Ce fichier (README.md)
2. **Comprendre l'architecture** : `.claude/docs/architecture.md`
3. **Suivre le guide d'implémentation** : `IMPLEMENTATION-CHECKLIST.md`

### Guide d'Implémentation Complet

**→ [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)**

Ce guide step-by-step couvre :
- Setup monorepo pnpm
- Installation Prisma + PostgreSQL/SQLite
- Implémentation des 6 tools MCP
- Logique Git snapshot robuste
- Tests et validation

**Durée estimée Phase 1** : 3h (MCP Server backend complet)

---

## Philosophie "Smart Capture"

**Promesse** : Max 3-6 appels MCP par task → pas de flood de contexte

**3 niveaux de capture** :

| Niveau | Méthode | Exemples |
|--------|---------|----------|
| **Obligatoire** | Appels MCP explicites | `start_task`, `complete_task` |
| **Optionnel** | Appels MCP si valeur ajoutée | `log_decision`, `log_issue` |
| **Automatique** | Calculé par le MCP | Durée, fichiers modifiés (Git diff) |

**Principe** :
> "Le MCP gère la vérité 'Fichiers' (via Git), l'Agent gère la vérité 'Logique' (via structured reporting)."

---

## Roadmap

### Phase 1 : MCP Server (Backend First) - 3h
- ✅ Setup monorepo pnpm
- ✅ Prisma + PostgreSQL
- ✅ Implémentation des 6 tools MCP
- ✅ Git snapshot robuste (union commits + working tree)
- ✅ Tests avec Claude Code

### Phase 2 : Web UI (Après validation backend) - 4-5h
- Interface Next.js pour visualiser workflows
- WebSocket pour updates temps réel
- Diff viewer avec syntax highlighting
- Timeline des milestones

### Phase 3 : Polish - 2h
- Export Markdown/JSON
- Rapport HTML
- Docker Compose complet

---

## Navigation Documentation

**Index complet** : [INDEX.md](./INDEX.md)

**Pour démarrer** :
```
README.md (ce fichier)
  ↓
IMPLEMENTATION-CHECKLIST.md (guide pratique)
  ↓
.claude/docs/architecture.md (architecture technique)
  ↓
.claude/docs/mcp-protocol.md (specs MCP détaillées)
```

---

## Contact & Support

**Type de projet** : Open Source (à définir)
**Phase actuelle** : Phase 1 - MCP Server Backend
**Status** : En développement actif

Pour questions techniques, consulter :
- `.claude/docs/` pour documentation technique complète
- `IMPLEMENTATION-CHECKLIST.md` pour guide pratique
- `PROJECT-STRUCTURE.md` pour structure détaillée

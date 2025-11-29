# Documentation Index - MCP Workflow Tracker

## 📚 Organisation de la Documentation

### Documentation Générale (`/documentations/`)

**Pour utilisateurs et onboarding** :

1. **[README.md](README.md)** - COMMENCER ICI
   - Vue d'ensemble du projet
   - Objectifs business
   - Cas d'usage concrets
   - Roadmap et navigation

2. **[IMPLEMENTATION-CHECKLIST.md](IMPLEMENTATION-CHECKLIST.md)** - GUIDE PRATIQUE
   - Setup monorepo step-by-step
   - Installation des dépendances
   - Scripts de test
   - Checklist de validation

3. **[PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md)** - RÉFÉRENCE RAPIDE
   - Arborescence du projet
   - Scripts npm
   - Configuration Claude Code
   - Variables d'environnement

4. **[INDEX.md](INDEX.md)** - Ce fichier
   - Navigation documentation
   - Clarification des rôles

### Documentation Technique (`/.claude/docs/`)

**Pour développeurs et agents IA** :

5. **[.claude/docs/architecture.md](../.claude/docs/architecture.md)** - ARCHITECTURE COMPLÈTE
   - Monorepo structure détaillée
   - MCP protocol expliqué
   - Patterns architecturaux
   - Flow de données

6. **[.claude/docs/mcp-protocol.md](../.claude/docs/mcp-protocol.md)** - CRITIQUE
   - Spécifications des 6 tools MCP
   - Logique Git robuste (commits + working tree)
   - Exemples de code complets
   - Prompts système suggérés

7. **[.claude/docs/database.md](../.claude/docs/database.md)** - SCHÉMA DB
   - Schéma Prisma complet avec enums
   - Explications de chaque modèle
   - Support multi-DB (PostgreSQL/SQLite)
   - Exemples d'utilisation

8. **[.claude/docs/standards.md](../.claude/docs/standards.md)** - CONVENTIONS
   - TypeScript strict mode
   - Validation Zod
   - Sécurité
   - Best practices

9. **[.claude/docs/tech-stack.md](../.claude/docs/tech-stack.md)** - TECHNOLOGIES
   - Stack technique complet
   - Justifications des choix
   - Alternatives évaluées

---

## 🎯 Ordre de lecture recommandé

### Pour un utilisateur / nouveau développeur
```
/documentations/README.md
  → /documentations/IMPLEMENTATION-CHECKLIST.md
  → /.claude/docs/architecture.md
```

### Pour un agent d'implémentation
```
/.claude/docs/architecture.md
  → /.claude/docs/mcp-protocol.md
  → /.claude/docs/database.md
  → /documentations/IMPLEMENTATION-CHECKLIST.md
```

### Pour comprendre une feature spécifique
```
/.claude/docs/mcp-protocol.md (section du tool)
  → /.claude/docs/database.md (modèle correspondant)
```

---

## ⚡ Accès rapide

| Besoin | Fichier | Section |
|--------|---------|---------|
| **Vision du projet** | `/documentations/README.md` | Vue d'ensemble |
| **Commencer l'implémentation** | `/documentations/IMPLEMENTATION-CHECKLIST.md` | Setup Projet |
| **Architecture complète** | `/.claude/docs/architecture.md` | Monorepo + MCP |
| **Voir le schéma DB** | `/.claude/docs/database.md` | Schéma complet |
| **Implémenter start_task** | `/.claude/docs/mcp-protocol.md` | Tool #2 |
| **Logique Git (CRITIQUE)** | `/.claude/docs/mcp-protocol.md` | Tool #6 (complete_task) |
| **Conventions de code** | `/.claude/docs/standards.md` | TypeScript + Validation |
| **Structure des dossiers** | `/documentations/PROJECT-STRUCTURE.md` | Arborescence |
| **Config Claude Code** | `/documentations/PROJECT-STRUCTURE.md` | Configuration Claude Code |
| **Choix DB (PostgreSQL/SQLite)** | `/.claude/docs/database.md` | Support Multi-DB |

---

## 📋 Points critiques à ne pas manquer

1. **Logique Git robuste** (`/.claude/docs/mcp-protocol.md`, section complete_task)
   - Union de 2 diffs (commits + working tree)
   - C'est LA partie critique du projet

2. **Enums TypeScript** (`/.claude/docs/database.md`)
   - Pas de strings magiques
   - Type safety partout

3. **Tableaux vides acceptés** (`/.claude/docs/mcp-protocol.md`)
   - `achievements: []` et `limitations: []` sont OK
   - Pas de remplissage bullshit

4. **Max 3-6 appels MCP par task** (`/documentations/README.md`)
   - Pas de flood de contexte
   - Capture "smart" à 3 niveaux

---

## 🚀 Quick Start

```bash
# 1. Lire la vision du projet
cat /home/ilan/code/mcpAgentTracker/documentations/README.md

# 2. Comprendre l'architecture
cat /home/ilan/code/mcpAgentTracker/.claude/docs/architecture.md

# 3. Suivre le guide d'implémentation
cat /home/ilan/code/mcpAgentTracker/documentations/IMPLEMENTATION-CHECKLIST.md

# 4. Référencer les specs MCP pendant l'implémentation
cat /home/ilan/code/mcpAgentTracker/.claude/docs/mcp-protocol.md
```

---

## 🎯 Séparation des Responsabilités

**`/documentations/`** = Documentation GÉNÉRALE
- Vue d'ensemble projet
- Onboarding développeurs
- Guides pratiques (IMPLEMENTATION-CHECKLIST)
- Cas d'usage business

**`/.claude/docs/`** = Documentation TECHNIQUE
- Architecture détaillée
- Spécifications MCP complètes
- Schéma database
- Standards de code
- Tech stack

**Aucun doublon** : Les docs techniques sont dans `.claude/docs/`, les docs générales référencent `.claude/docs/` pour les détails.

---

**Prochaine étape** : Ouvrir `/documentations/README.md` pour la vision, puis `/documentations/IMPLEMENTATION-CHECKLIST.md` pour commencer.

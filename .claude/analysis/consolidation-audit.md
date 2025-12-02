# Audit de Consolidation - MCP Workflow Tracker

**Date** : 2025-12-02
**Version analysée** : 96ed9a5a95901d626ff6224def8cc9937547b3fc
**Auditeurs** : 3 agents spécialisés (shared, mcp-server, web-ui)

---

## Résumé Exécutif

| Package | Score | État |
|---------|-------|------|
| **shared** | 6.5/10 | 🔴 Critique - Duplications enums, 2 schémas Prisma |
| **mcp-server** | 7.5/10 | 🟠 Important - Strings magiques, catch silencieux |
| **web-ui** | 7.5/10 | 🟠 Important - DRY violations, validation manquante |
| **Global** | **7.2/10** | 🟠 Consolidation nécessaire avant nouvelles features |

### Points Clés

**Forces du projet :**
- ✅ Architecture monorepo bien structurée
- ✅ Git diff robuste (union commits + working tree) correctement implémenté
- ✅ TypeScript strict activé partout
- ✅ Next.js 14 moderne avec Server Components
- ✅ WebSocket temps réel fonctionnel
- ✅ Validation Zod présente sur les inputs MCP

**Faiblesses critiques :**
- ❌ Enums dupliqués entre shared et mcp-server (violation DRY majeure)
- ❌ Strings magiques au lieu des enums Prisma TypeScript
- ❌ 2 schémas Prisma créant confusion
- ❌ Fonctions utilitaires dupliquées dans web-ui (4x formatDate)
- ❌ Catch silencieux masquant des bugs dans git-snapshot.ts
- ❌ Pas de logging production structuré

---

## Findings par Catégorie

### 1. Qualité Code

| Sévérité | Package | Fichier:Ligne | Problème | Recommandation |
|----------|---------|---------------|----------|----------------|
| 🟠 | web-ui | WorkflowCard.tsx:20-32 | formatDate() dupliquée 4x | Créer lib/date-utils.ts |
| 🟠 | web-ui | WorkflowCard.tsx:34-42 | formatDuration() dupliquée 3x | Même fichier utilitaire |
| 🟠 | mcp-server | websocket/server.ts:155 | Placeholders inutilisés | Risque fuite mémoire |
| 🟡 | shared | src/index.ts:1-6 | JSDoc incomplet | Améliorer documentation |
| 🟡 | web-ui | ThemeToggle.tsx:79-161 | Dead code (ThemeDropdown) | Supprimer |

### 2. DRY (Don't Repeat Yourself)

| Sévérité | Package | Fichier:Ligne | Problème | Recommandation |
|----------|---------|---------------|----------|----------------|
| 🔴 | shared | src/index.ts:22-56 | **Enums manuels dupliquent Prisma** | Supprimer, utiliser enums Prisma |
| 🔴 | mcp-server | Tous tools/*.ts | **Enums locaux dans CHAQUE tool** | Créer types/enums.ts centralisé |
| 🔴 | mcp-server | Tous tools/*.ts | Maps conversion répétées | Créer utils/enum-mappers.ts |
| 🔴 | web-ui | 4 composants | formatDate/Duration/Tokens 4x | Créer lib/date-utils.ts |
| 🟠 | mcp-server | tools/*.ts | Pattern "task exists" répété 5x | Créer utils/validators.ts |

### 3. SOC (Separation of Concerns)

| Sévérité | Package | Fichier:Ligne | Problème | Recommandation |
|----------|---------|---------------|----------|----------------|
| 🟠 | shared | src/index.ts:22-56 | Logique dans package types-only | Supprimer constantes |
| 🟠 | mcp-server | complete-task.ts:314-373 | Logique métier dans handler | Extraire dans service |
| 🟠 | web-ui | components/ | 26 composants sans organisation | Créer sous-dossiers |
| 🟡 | shared | prisma/schema.prisma:9 | Provider hardcodé | Utiliser env var |

### 4. State of the Art

| Sévérité | Package | Fichier:Ligne | Problème | Recommandation |
|----------|---------|---------------|----------|----------------|
| 🔴 | shared | src/index.ts:22-56 | **Réinvention enums Prisma** | Supprimer, import @prisma/client |
| 🔴 | mcp-server | Tous tools/*.ts | **Strings au lieu enums Prisma** | import { TaskStatus } from '@prisma/client' |
| 🟠 | mcp-server | git-snapshot.ts:62-64 | Try/catch silencieux | Ajouter logging |
| 🟡 | web-ui | useWebSocket.ts | useEffect au lieu useSyncExternalStore | Moderniser |

### 5. Architecture

| Sévérité | Package | Fichier:Ligne | Problème | Recommandation |
|----------|---------|---------------|----------|----------------|
| 🔴 | shared | prisma/ | **2 schémas Prisma** | Supprimer schema.postgresql.prisma |
| ✅ | mcp-server | git-snapshot.ts:112-137 | Git diff robuste conforme | RAS |
| ✅ | web-ui | Structure | App Router Next.js 14 correct | RAS |
| 🟠 | web-ui | components/ | Manque sous-dossiers | Organiser workflow/, task/, shared/ |

### 6. Sécurité

| Sévérité | Package | Fichier:Ligne | Problème | Recommandation |
|----------|---------|---------------|----------|----------------|
| 🔴 | mcp-server | log-milestone.ts:75 | **Casting unsafe** | Valider avec type guard |
| 🔴 | web-ui | RealtimeWorkflowDetail.tsx:172 | **JSON non validé** | Valider avec Zod |
| 🟠 | mcp-server | complete-task.ts:203 | Type assertion dangereux | Utiliser type guard |
| 🟡 | shared | .env.example:5 | Password exemple faible | Ajouter warning |

### 7. Gestion d'Erreurs

| Sévérité | Package | Fichier:Ligne | Problème | Recommandation |
|----------|---------|---------------|----------|----------------|
| 🔴 | mcp-server | git-snapshot.ts:62-64 | **Catch silencieux** | Logger l'erreur |
| 🔴 | mcp-server | git-snapshot.ts:95-97 | **Catch silencieux** | Logger fichiers échoués |
| 🔴 | mcp-server | git-snapshot.ts:156-159 | **Catch silencieux** | Logger raison échec |
| 🔴 | web-ui | api/workflows/route.ts:64 | **console.error() uniquement** | Intégrer Sentry |

---

## Plan de Consolidation Priorisé

### Priority 1 - Critiques (à traiter IMMÉDIATEMENT)

**Effort estimé : 8-10 heures**

| # | Issue | Package | Action | Effort |
|---|-------|---------|--------|--------|
| 1 | 2 schémas Prisma | shared | `rm prisma/schema.postgresql.prisma` | 5min |
| 2 | Provider hardcodé | shared | Ligne 9: `provider = env("DATABASE_PROVIDER")` | 5min |
| 3 | Enums manuels | shared | Supprimer lignes 22-56 de index.ts | 30min |
| 4 | Strings magiques | mcp-server | Remplacer par `import { TaskStatus } from '@prisma/client'` dans 5 tools | 2-3h |
| 5 | Enums dupliqués | mcp-server | Créer `src/types/enums.ts` centralisé | 1h |
| 6 | Catch silencieux | mcp-server | Ajouter logging dans git-snapshot.ts (3 locations) | 30min |
| 7 | Casting unsafe | mcp-server | log-milestone.ts:75 - Ajouter type guard | 15min |
| 8 | DRY fonctions | web-ui | Créer lib/date-utils.ts et lib/format-utils.ts | 2h |
| 9 | JSON non validé | web-ui | Valider parseJsonArray() avec Zod | 1h |

### Priority 2 - Importants (sprint suivant)

**Effort estimé : 12-15 heures**

| # | Issue | Package | Action | Effort |
|---|-------|---------|--------|--------|
| 10 | Maps dupliquées | mcp-server | Créer `src/utils/enum-mappers.ts` | 1h |
| 11 | Validators répétés | mcp-server | Créer `src/utils/validators.ts` | 1h |
| 12 | SOC complete-task | mcp-server | Extraire dans `services/workflow-service.ts` | 2h |
| 13 | Logging production | web-ui | Intégrer Sentry/Datadog | 4h |
| 14 | Organisation components | web-ui | Créer sous-dossiers workflow/, task/, shared/ | 2h |
| 15 | Config dupliquées | web-ui | Créer lib/config-utils.ts | 1h |
| 16 | Types répétés | web-ui | Créer lib/types.ts | 1h |
| 17 | useWebSocket | web-ui | Moderniser avec useSyncExternalStore | 2h |
| 18 | Champs métriques | shared | Ajouter tokensInput/Output au schéma | 1h |

### Priority 3 - Améliorations (backlog)

**Effort estimé : 4-6 heures**

| # | Issue | Package | Action | Effort |
|---|-------|---------|--------|--------|
| 19 | Dead code | web-ui | Supprimer ThemeDropdown() | 15min |
| 20 | JSDoc incomplet | shared | Améliorer documentation index.ts | 30min |
| 21 | Constants | mcp-server | Créer src/constants.ts | 30min |
| 22 | Success response | mcp-server | Créer createSuccessResponse() | 30min |
| 23 | Env vars liens | web-ui | Externaliser liens GitHub | 15min |
| 24 | Timeout fetch | web-ui | Ajouter AbortController | 30min |
| 25 | Status validation | web-ui | Valider contre enum Prisma | 30min |

---

## Ordre d'Exécution Recommandé

```
Phase 1 : Fondations (Jour 1)
├── 1. Supprimer schema.postgresql.prisma
├── 2. Corriger provider env var
├── 3. Supprimer enums manuels shared
└── 4. Régénérer Prisma client

Phase 2 : MCP Server (Jour 1-2)
├── 5. Créer types/enums.ts centralisé
├── 6. Refactorer 5 tools pour enums Prisma
├── 7. Ajouter logging catch silencieux
└── 8. Corriger casting unsafe

Phase 3 : Web UI (Jour 2-3)
├── 9. Créer lib/date-utils.ts
├── 10. Créer lib/format-utils.ts
├── 11. Refactorer composants
└── 12. Valider JSON parsing

Phase 4 : Tests & Validation
├── 13. pnpm build:all
├── 14. pnpm exec tsc --noEmit
└── 15. Test manuel MCP tools
```

---

## Métriques Recommandées

### KPIs à suivre post-consolidation

| Métrique | Valeur Actuelle | Cible | Comment Mesurer |
|----------|-----------------|-------|-----------------|
| Duplications code | ~30 lignes enums + ~50 lignes utils | 0 | ESLint no-duplicate-imports |
| Catch silencieux | 3 | 0 | Grep "catch {" ou "catch { }" |
| Type assertions unsafe | 2 | 0 | Grep "as string", "as Record" |
| Console.error prod | 3+ | 0 | Grep console.error dans routes |
| Couverture tests | 0% | >60% | Vitest coverage |
| Build time | ~15s | <10s | pnpm build:all |
| TypeScript errors | 0 | 0 | pnpm exec tsc --noEmit |

### Sanity Checks Post-Correction

```bash
# 1. Compilation TypeScript
pnpm exec tsc --noEmit

# 2. Build tous les packages
pnpm build:all

# 3. Vérifier enums Prisma générés
cat packages/shared/node_modules/.prisma/client/index.d.ts | grep "export enum"

# 4. Vérifier imports centralisés
grep -r "TaskStatus\|WorkflowStatus" packages/mcp-server/src/tools/

# 5. Vérifier catch silencieux restants
grep -r "catch {" packages/mcp-server/src/

# 6. Tester MCP manuellement
cd packages/mcp-server && pnpm dev
```

---

## Conclusion

Le projet MCP Workflow Tracker a une **base architecturale solide** mais souffre de **dette technique accumulée** principalement autour de la gestion des enums et des duplications de code.

**Impact business si non corrigé :**
- Bugs subtils en production (enums incohérents)
- Maintenance coûteuse (3 sources de vérité)
- Debugging impossible (catch silencieux)
- Observabilité nulle (pas de logging production)

**Recommandation finale :**
Bloquer toute nouvelle feature jusqu'à correction des P1 (8-10h d'effort).

---

**Généré le** : 2025-12-02
**Workflow ID** : cmio46ywc0000pg0bmxb1hxdv
**Outils utilisés** : MCP Workflow Tracker (dogfooding)

# Audit Package: mcp-server

**Date** : 2025-12-02
**Fichiers analysés** :
- index.ts (209 lignes)
- db.ts (16 lignes)
- utils/errors.ts (35 lignes)
- utils/git-snapshot.ts (335 lignes)
- utils/json-fields.ts (189 lignes)
- tools/start-workflow.ts (102 lignes)
- tools/start-task.ts (149 lignes)
- tools/log-decision.ts (153 lignes)
- tools/log-issue.ts (135 lignes)
- tools/log-milestone.ts (98 lignes)
- tools/complete-task.ts (398 lignes)
- websocket/index.ts (28 lignes)
- websocket/server.ts (175 lignes)
- websocket/events.ts (209 lignes)

## Score Global : 7.5/10

Le package mcp-server est **globalement solide** avec une architecture propre et un Git diff robuste bien implémenté. Cependant, il présente des **problèmes critiques** liés aux enums (strings magiques au lieu des enums Prisma TypeScript), des duplications significatives, et des catch silencieux.

---

## Findings

### 1. Qualité Code

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟡 | index.ts:45-46 | Constantes définies localement | Créer `src/constants.ts` |
| 🟡 | websocket/server.ts:11-12 | Magic numbers pour port | Extraire dans constantes |
| 🟡 | git-snapshot.ts:85-88 | Pattern glob hardcodé | Extraire dans configuration |
| 🟠 | websocket/server.ts:155-156 | Placeholders inutilisés | Risque fuite mémoire |

**Score : 7/10**

### 2. DRY

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | Tous les tools/* | **Duplication massive** : Enums locaux dans CHAQUE tool | Créer `src/types/enums.ts` centralisé |
| 🔴 | Tous les tools/* | Maps de conversion répétées (categoryMap, statusMap, etc.) | Créer `src/utils/enum-mappers.ts` |
| 🟠 | tools/* | Pattern vérification "task exists" répété 5 fois | Créer `src/utils/validators.ts` |
| 🟠 | tools/* | Pattern retour JSON identique | Créer fonction `createSuccessResponse(data)` |

**Score : 4/10** - Duplications critiques

### 3. SOC

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟠 | complete-task.ts:314-373 | Logique métier complexe dans handler | Extraire dans `src/services/workflow-service.ts` |
| 🟡 | websocket/server.ts:27-66 | Config + handlers mélangés | Extraire handlers |

**Score : 7.5/10**

### 4. State of the Art

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | **Tous les tools/** | **VIOLATION CRITIQUE** : Strings magiques au lieu des enums Prisma TypeScript | `import { TaskStatus } from '@prisma/client'` |
| 🟠 | git-snapshot.ts:62-64 | Try/catch silencieux | Ajouter logging |
| 🟠 | complete-task.ts:203 | Casting `as string` au lieu de type guard | Créer fonction `isGitSnapshotData()` |

**Score : 5/10** - PROBLÈME MAJEUR avec les enums

### 5. Architecture

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| ✅ | git-snapshot.ts:112-137 | **Git diff robuste** : Union commits + working tree | Conforme aux specs |
| 🟠 | index.ts:179-185 | WebSocket sans gestion d'erreur si échec | Wrap dans try/catch |

**Score : 8/10** - Architecture solide

### 6. Sécurité

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | log-milestone.ts:75 | **Casting unsafe** sans validation | Valider `metadata` avec Zod |
| 🟠 | complete-task.ts:203 | Type assertion dangereux | Utiliser type guard |
| 🟡 | db.ts | Pas de validation DATABASE_URL au démarrage | Ajouter check |

**Score : 7/10**

### 7. Gestion d'Erreurs

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | git-snapshot.ts:62-64 | **Catch silencieux** | Logger l'erreur |
| 🔴 | git-snapshot.ts:95-97 | **Catch silencieux** | Logger les fichiers qui échouent |
| 🔴 | git-snapshot.ts:156-159 | **Catch silencieux** | Logger la raison de l'échec |
| 🟠 | complete-task.ts:314 | Fonction async sans try/catch | Entourer de try/catch |

**Score : 5.5/10** - Trop de catch silencieux

---

## Priorités de Correction

### P1 - Critiques (IMMÉDIAT)

- [ ] **Enums Prisma** : Remplacer TOUS les objets const locaux par `import { TaskStatus, WorkflowStatus, ... } from '@prisma/client'`
  - Fichiers : start-workflow.ts, start-task.ts, log-decision.ts, log-issue.ts, complete-task.ts
  - Effort : 2-3h

- [ ] **Duplication enums** : Créer `src/types/enums.ts` centralisé
  - Supprime 30+ lignes dupliquées
  - Effort : 1h

- [ ] **Catch silencieux** : Ajouter logging dans TOUS les catch vides
  - git-snapshot.ts (3 locations)
  - Effort : 30min

- [ ] **Casting unsafe** : log-milestone.ts ligne 75
  - Remplacer par type guard
  - Effort : 15min

### P2 - Importants (2 semaines)

- [ ] Créer `src/utils/enum-mappers.ts` (maps de conversion)
- [ ] Créer `src/utils/validators.ts` (ensureTaskExists, ensureWorkflowExists)
- [ ] Extraire `checkAndUpdateWorkflowStatus` dans service
- [ ] Refactorer singleton pattern WebSocket

### P3 - Mineurs

- [ ] Extraire constantes dans `src/constants.ts`
- [ ] Ajouter fonction `createSuccessResponse(data)`
- [ ] Ajouter commentaires dans `computeWorkflowMetrics`

---

## Points Forts

1. **Git Diff Union** parfaitement implémenté (git-snapshot.ts:112-137)
2. **Isolation packages** respectée
3. **Validation Zod** présente partout
4. **WebSocket architecture** propre avec retry automatique
5. **TypeScript strict** activé
6. **Custom error classes** bien définies

---

## Conclusion

Le package mcp-server est **architecturalement solide** avec un Git diff robuste. Problèmes critiques :

1. **Enums** : Strings au lieu des enums Prisma (violation standards)
2. **DRY** : Duplications massives (enums, maps, validators)
3. **Error Handling** : Catch silencieux masquant des bugs

**Recommandation** : Corriger P1 avant toute nouvelle feature.

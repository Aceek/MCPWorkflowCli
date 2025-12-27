# Legacy Cleanup Analysis Report

**Date**: 2025-12-27
**Branch**: feature/merge-mission-system
**Score Global**: 62/100

---

## Executive Summary

Le projet a fusionner deux systemes:
- **Legacy**: Workflow -> Task (simple tracking)
- **Nouveau**: Mission -> Phase -> Task (orchestration multi-agents)

L'analyse revele que la separation legacy/nouveau est **incomplete**. Le legacy est conserve mais pas correctement isole comme alias du nouveau systeme. Des duplications de code et des problemes architecturaux sont presents.

---

## 1. MCP Server Analysis

### 1.1 start_workflow - NON CONFORME

| Critere | Status | Detail |
|---------|--------|--------|
| Alias de start_mission | FAIL | Code completement separe |
| Pas de duplication | FAIL | Logique dupliquee |
| workflowId optionnel | OK | Gere dans start_task |

**Probleme majeur**: `start_workflow` (`packages/mcp-server/src/tools/start-workflow.ts`) n'est PAS un alias de `start_mission`. C'est une implementation completement separee qui:

1. Cree un `Workflow` au lieu d'une `Mission`
2. A sa propre logique Prisma
3. Emet ses propres events WebSocket (`emitWorkflowCreated`)

**Code actuel** (lignes 61-78):
```typescript
export async function handleStartWorkflow(args: unknown): Promise<CallToolResult> {
  const validated = startWorkflowSchema.parse(args)
  const workflow = await prisma.workflow.create({
    data: {
      name: validated.name,
      description: validated.description,
      plan: workflowPlanToJson(validated.plan),
      status: WorkflowStatus.IN_PROGRESS,
    },
  })
  emitWorkflowCreated(workflow)
  // ...
}
```

**Attendu**:
```typescript
export async function handleStartWorkflow(args: unknown): Promise<CallToolResult> {
  console.warn('start_workflow is deprecated, use start_mission instead')
  return handleStartMission(args) // Simple delegation
}
```

### 1.2 start_task - OK avec reserves

| Critere | Status | Detail |
|---------|--------|--------|
| workflow_id optionnel | OK | Schema Zod correct |
| mission_id optionnel | OK | Schema Zod correct |
| Mode dual | OK | Logique branch correcte |
| Placeholder workflowId | WARN | `'mission-task'` magic string |

**Probleme mineur** (ligne 214):
```typescript
workflowId: workflowId || 'mission-task', // Required field, use placeholder for mission mode
```

Le champ `workflowId` est requis dans le schema Task mais utilise un placeholder magic string en mode mission. Cela devrait etre `null` ou un champ optionnel dans le schema.

### 1.3 Tools Registration - OK

L'enregistrement des tools dans `src/index.ts` est correct:
- `startWorkflowTool` est liste comme "Legacy workflow tools"
- `startMissionTool` est liste comme "Mission system tools"
- Les deux sont exposes, permettant la retrocompatibilite

---

## 2. WebUI Analysis

### 2.1 Routes Structure - OK

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Workflows list | OK - Legacy |
| `/workflow/[id]` | Workflow detail | OK - Legacy |
| `/missions` | Missions list | OK - New |
| `/missions/[id]` | Mission detail | OK - New |
| `/api/workflows` | Workflows API | OK - Legacy |
| `/api/missions` | Missions API | OK - New |

La separation des routes est claire entre legacy et nouveau.

### 2.2 Components - DUPLICATION

| Component | Package | Issue |
|-----------|---------|-------|
| `WorkflowCard` | workflow/ | OK |
| `MissionCard` | mission/ | OK |
| `RealtimeWorkflowList` | workflow/ | Duplique MissionList |
| `RealtimeMissionList` | mission/ | Duplique WorkflowList |
| `useRealtimeWorkflows` | hooks/ | Duplique mission hook |
| `useRealtimeMissions` | hooks/ | Duplique workflow hook |
| `WorkflowCardSkeleton` | shared/ | Usage mixte |

**Duplication identifiee**:
Les hooks `useRealtimeWorkflows` et `useRealtimeMissions` sont quasi-identiques avec ~200 lignes chacun. Ils pourraient etre factorisees en un seul hook generique.

### 2.3 API Routes - OK avec reserves

`/api/workflows/route.ts` et `/api/missions/route.ts` sont separees et fonctionnelles.

**Probleme potentiel**: Pas de redirection de `/api/workflows` vers `/api/missions` pour migration progressive.

### 2.4 Navigation - OK

Le layout (`layout.tsx`) expose les deux:
- Lien "Workflows" vers `/`
- Lien "Missions" vers `/missions`

---

## 3. Database Schema Analysis

### 3.1 Models - OK

| Model | Purpose | Legacy | New |
|-------|---------|--------|-----|
| Workflow | Container legacy | Yes | No |
| Task | Unite de travail | Yes | Yes |
| Mission | Container nouveau | No | Yes |
| Phase | Etape mission | No | Yes |

### 3.2 Task Relations - PROBLEME

```prisma
model Task {
  workflowId   String    // REQUIRED - legacy
  phaseId      String?   // OPTIONAL - new
  // ...
}
```

**Probleme**: `workflowId` est **obligatoire** meme pour les tasks mission-based. Cela force l'utilisation du placeholder `'mission-task'` dans le code.

**Correction suggeree**:
```prisma
model Task {
  workflowId   String?   // OPTIONAL - legacy
  phaseId      String?   // OPTIONAL - new mission
  // Add constraint: workflowId OR phaseId must be set
}
```

### 3.3 Migrations - OK

Pas de migration cassante identifiee. Les deux modeles coexistent.

---

## 4. Dead Code Analysis

### 4.1 Fichiers orphelins - AUCUN

Tous les fichiers du projet sont utilises ou references.

### 4.2 Imports non utilises - VERIFICATION REQUISE

| Fichier | Import potentiellement inutile |
|---------|-------------------------------|
| `useRealtimeWorkflow.ts` | Types Task, Decision, etc. - OK (utilises) |
| `api.ts` | `Workflow` type - OK (utilise) |

### 4.3 Features workflow dupliquees dans mission - OUI

| Feature | Workflow | Mission | Duplication |
|---------|----------|---------|-------------|
| Create | `handleStartWorkflow` | `handleStartMission` | YES |
| WebSocket events | `emitWorkflowCreated` | `emitMissionCreated` | Partielle |
| Real-time hooks | `useRealtimeWorkflows` | `useRealtimeMissions` | YES |
| API routes | `/api/workflows` | `/api/missions` | Partielle |

---

## 5. Documentation Analysis

### 5.1 Deprecation Notices - INSUFFISANT

| Document | Mentions deprecated | Status |
|----------|---------------------|--------|
| `.claude/CLAUDE.md` | "Legacy" in table | PARTIAL |
| `README.md` | None | FAIL |
| `docs/mcp-tools.md` | "For legacy mode" comment | PARTIAL |
| `.claude/plans/VISION.md` | "deprecated" 1x | OK |

**Probleme**: Le `README.md` principal ne mentionne PAS que `start_workflow` est deprecated.

### 5.2 memory.md References - OK

Les references a `memory.md` sont uniquement dans les fichiers de planification (`.claude/plans/`) et sont marquees comme historiques ou "removed". Aucune reference dans le code source.

---

## 6. Risques de Retrocompatibilite

### 6.1 Risques CRITIQUES

| Risque | Impact | Probabilite |
|--------|--------|-------------|
| `workflowId` required brise les tasks mission | HIGH | LOW (contourne avec placeholder) |
| Deux systemes non synchronises | MEDIUM | MEDIUM |
| Events WebSocket differents | LOW | LOW |

### 6.2 Risques MODERES

| Risque | Impact | Probabilite |
|--------|--------|-------------|
| Duplication de code = maintenance double | MEDIUM | HIGH |
| Confusion utilisateur Workflow vs Mission | MEDIUM | MEDIUM |
| Stats separees (pas de vue unifiee) | LOW | HIGH |

---

## 7. Recommandations

### 7.1 CRITIQUE - Transformer start_workflow en alias

```typescript
// packages/mcp-server/src/tools/start-workflow.ts
export async function handleStartWorkflow(args: unknown): Promise<CallToolResult> {
  createLogger('start_workflow').warn('DEPRECATED: Use start_mission instead')

  // Convert workflow args to mission args
  const validated = startWorkflowSchema.parse(args)
  const missionArgs = {
    name: validated.name,
    objective: validated.description || validated.name,
    description: validated.description,
    profile: 'simple',
  }

  return handleStartMission(missionArgs)
}
```

### 7.2 HAUTE - Rendre workflowId optionnel dans Task

```prisma
model Task {
  workflowId   String?   // Now optional
  phaseId      String?

  workflow   Workflow?   @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  // Add index for orphan detection
  @@index([workflowId, phaseId])
}
```

### 7.3 MOYENNE - Factoriser les hooks realtime

Creer un hook generique `useRealtimeList<T>` qui prend en parametres:
- Le type d'entite (Workflow | Mission)
- L'endpoint API
- Les events WebSocket

### 7.4 BASSE - Ajouter deprecation au README

```markdown
## Deprecation Notice

The `start_workflow` tool is deprecated. Please use `start_mission` instead.
Workflows will continue to work but will be converted to simple missions internally.
```

### 7.5 BASSE - Supprimer le placeholder 'mission-task'

Migrer vers `workflowId: null` pour les tasks de mission.

---

## 8. Score Breakdown

| Categorie | Score | Max | Details |
|-----------|-------|-----|---------|
| MCP Server | 10 | 25 | start_workflow n'est pas un alias |
| WebUI | 18 | 25 | Separation OK mais duplication |
| Database | 15 | 20 | workflowId required = probleme |
| Dead Code | 10 | 10 | Pas de code mort |
| Documentation | 5 | 10 | Deprecation insuffisante |
| Retrocompat | 4 | 10 | Risques moderes |
| **TOTAL** | **62** | **100** | |

---

## 9. Actions Prioritaires

1. **P0**: Transformer `start_workflow` en alias de `start_mission`
2. **P1**: Rendre `workflowId` optionnel dans le schema Task
3. **P2**: Ajouter notice de deprecation dans README
4. **P3**: Factoriser les hooks realtime (refactoring)
5. **P3**: Considerer une vue unifiee Workflows+Missions dans le dashboard

---

## Annexe: Fichiers Analyses

| Fichier | Lignes | Purpose |
|---------|--------|---------|
| `packages/mcp-server/src/tools/start-workflow.ts` | 96 | Legacy workflow creation |
| `packages/mcp-server/src/tools/start-mission.ts` | 129 | Mission creation |
| `packages/mcp-server/src/tools/start-task.ts` | 262 | Task creation (dual mode) |
| `packages/mcp-server/src/index.ts` | 262 | Tools registration |
| `packages/web-ui/src/app/api/workflows/route.ts` | 75 | Workflows API |
| `packages/web-ui/src/app/api/missions/route.ts` | 87 | Missions API |
| `packages/web-ui/src/hooks/useRealtimeWorkflows.ts` | 206 | Workflows realtime |
| `packages/web-ui/src/hooks/useRealtimeMissions.ts` | 234 | Missions realtime |
| `packages/shared/prisma/schema.prisma` | 227 | Database schema |

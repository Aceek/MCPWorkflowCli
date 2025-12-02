# Audit Complet - Package `packages/web-ui`

**Date de l'audit** : 2 décembre 2025  
**Scope** : Application Next.js 15.3.3 + React 19 avec WebSocket temps réel  
**Score global** : 8.2/10

---

## Résumé Exécutif

Le package `web-ui` est **bien structuré et de qualité élevée**. L'application respecte les principes Next.js 14+ (App Router), utilise une architecture client-side moderne avec hooks, et intègre correctement la validation Zod + parsing JSON sécurisé. 

**Points forts** :
- Architecture composants claire (workflow/, task/, shared/)
- Validation JSON robuste avec `parseJsonArraySafe` + Zod schemas
- Logger custom utilisé (pas de `console.*` direct sauf dans error.tsx)
- TypeScript strict, pas de `any`
- Gestion temps réel WebSocket élégante
- Animations smooth avec Framer Motion
- Design System cohérent avec classes CSS variables

**Axes d'amélioration mineurs** :
- 1 usage de `console.error` dans error.tsx (acceptable pour error boundary)
- Quelques formats de dates en français hardcodés (non i18n)
- Réutilisation limitée d'une constant pour les status strings

---

## 1. Qualité Code - Score 8.5/10

### ✅ Points positifs

**A. Lisibilité et structure**
- Code bien indenté, commentaires appropriés
- Noms variables explicites (`handleWorkflowCreated`, `formatDuration`)
- Composants visuels découpés logiquement

**B. Patterns React modernes**
- Utilisation systématique de `'use client'` pour les composants interactifs
- Hooks bien orchestrés (`useRealtimeWorkflows`, `useRealtimeWorkflow`, `useWebSocket`)
- Pas de render props ou classe components anachroniques

**C. TypeScript**
```typescript
// ✅ Types explicites, pas de any
interface TaskCardProps {
  task: TaskWithRelations
  formatDuration: (ms: number | null) => string
  isSubtask?: boolean
}

// ✅ Union types pour les enums
type KnownStatus = 'IN_PROGRESS' | 'COMPLETED' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED'

// ✅ Zod schemas pour validation
export const WorkflowPlanSchema = z.array(
  z.object({
    step: z.string(),
    goal: z.string(),
  })
)
```

### 🟡 Améliorations possibles

**A. Duplication de status strings**
Fichiers avec status hardcodés:
- `/app/api/workflows/route.ts` : `'IN_PROGRESS' | 'COMPLETED' | 'FAILED'` (ligne 11)
- `/components/shared/StatusBadge.tsx` : `type KnownStatus = 'IN_PROGRESS' | ...` (ligne 13)
- `/components/shared/StatusFilter.tsx` : `{ value: 'IN_PROGRESS', label: 'In Progress' }` (ligne 9)

**Recommandation** : Créer une constante centralisée `lib/constants.ts` :
```typescript
export const WORKFLOW_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'FAILED'] as const
export type WorkflowStatus = typeof WORKFLOW_STATUSES[number]
```

**Sévérité** : 🟡 Mineur (DRY violation faible, no runtime impact)

---

## 2. DRY (Don't Repeat Yourself) - Score 7.5/10

### ✅ Bien fait

**Utilitaires centralisés**
- `lib/utils.ts` : `cn()` (Tailwind merge)
- `lib/date-utils.ts` : `formatDate()`, `formatDuration()`
- `lib/format-utils.ts` : `formatTokens()`
- `lib/json-parse.ts` : `parseJsonArraySafe()`, `parseJsonObjectSafe()`
- `lib/json-schemas.ts` : Zod schemas partagés

**Composants réutilisés**
- `components/ui/` : Badge, Card, Separator, etc. (basis non dupliqué)
- `components/shared/` : StatusBadge utilisé dans WorkflowCard et TaskCard
- Motion animations : variants centralisés dans `components/ui/motion.tsx`

### 🟡 Zones de duplication détectée

**A. Statuses mapping** (severity: 🟡 Mineur)

`components/task/DecisionCard.tsx` (ligne 22) et `components/task/IssueCard.tsx` (ligne 21) définissent chacun un mapping category/type mais avec des structures différentes. Pas une vraie duplication, mais pattern similaire.

**B. Formatage de dates** (severity: 🟡 Mineur)

- `formatDate()` dans `date-utils.ts` utilise locale `'fr-FR'` hardcodée
- `formatTime()` dans `MilestoneTimeline.tsx` (ligne 12) duplique la logique d'Intl.DateTimeFormat
  
```typescript
// Dans date-utils.ts
export function formatDate(date: string | Date | null | undefined): string {
  // ... utilise fr-FR
}

// Dans MilestoneTimeline.tsx (duplication)
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  // ... réimplémente Intl.DateTimeFormat avec fr-FR
}
```

**Recommandation** : Ajouter `formatTime()` dans `date-utils.ts` et l'importer.

**Sévérité** : 🟡 Mineur

**C. Animations Motion** (severity: ✅ Bien fait)

Les variantes Framer Motion sont centralisées dans `ui/motion.tsx` et réutilisées partout. Bon design.

---

## 3. SOC (Separation of Concerns) - Score 9/10

### ✅ Structure excellente

**Séparation claire**
```
src/
├── app/                    # Pages & routing
├── api/                    # Server API routes
├── components/             # UI components
│   ├── workflow/          # Workflow-specific
│   ├── task/              # Task-specific
│   ├── shared/            # Cross-cutting (StatusBadge, StatsCards, etc.)
│   └── ui/                # Primitives (Button, Card, Badge)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & helpers
│   ├── prisma.ts         # DB access
│   ├── socket.ts         # WebSocket client
│   ├── logger.ts         # Custom logger
│   ├── json-parse.ts     # JSON + Zod parsing
│   └── date-utils.ts     # Formatting
```

**Server Components vs Client Components**
- ✅ Async server component pour chargement initial : `app/workflow/[id]/page.tsx`
- ✅ Client components pour interactivité : `'use client'` au bon endroit
- ✅ Pas de mélange dangeureux

**Isolation des responsabilités**
- **Composants** : Uniquement render + event handlers
- **Hooks** : État et effets (WebSocket, data fetching)
- **Lib** : Logique pure (parsing, formatting, socket init)

### 🟡 Considérations mineures

**A. API Routes devraient valider les entrées**

`src/app/api/workflows/route.ts` valide bien le status :
```typescript
const statusSchema = z.enum(['all', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional()
const parseResult = statusSchema.safeParse(rawStatus ?? undefined)
if (!parseResult.success) {
  return NextResponse.json({ error: 'Invalid status parameter' }, { status: 400 })
}
```

✅ **Bon pattern** à maintenir pour le websocket-port aussi.

**B. WebSocket logic pourrait être testé unitairement**

`lib/socket.ts` a une bonne API (`getSocketAsync`, `startPortDiscovery`), mais pas accessible facilement pour les tests.

**Sévérité** : 🟡 Mineur (pas de tests visibles, mais structure OK)

---

## 4. State of the Art Next.js & React - Score 8.5/10

### ✅ Bonne utilisation du stack moderne

**Next.js 15.3.3 patterns**
- ✅ App Router (pas Pages router anachronique)
- ✅ `force-dynamic` utilisé où nécessaire (workflows, workflow detail)
- ✅ Suspense avec fallback skeletons
- ✅ Error boundaries (`error.tsx`, `global-error.tsx`)
- ✅ `not-found.tsx` pour 404s
- ✅ Server Components par défaut

**React 19 patterns**
- ✅ Hooks modernes (`useState`, `useEffect`, `useCallback`, `useRef`)
- ✅ Pas de classes components
- ✅ useEffect cleanup functions

**Performance**
- ✅ Lazy loading/dynamic imports possibles (non implémentés, mais architecture le permet)
- ✅ Animations optimisées avec Framer Motion (GPU accelerated)
- ✅ Evite re-renders inutiles avec `useCallback`, `useRef`

Exemple bon :
```typescript
// useRealtimeWorkflows.ts
const statusRef = useRef(status)
statusRef.current = status  // Avoid stale closures in event handlers
```

### 🟡 Améliorations suggérées

**A. Metadata dynamique pour workflow detail**

`app/workflow/[id]/page.tsx` n'a pas de metadata dynamique :
```typescript
// Actuellement : pas de metadata
// Recommandé :
export async function generateMetadata({ params }: WorkflowPageProps): Promise<Metadata> {
  const { id } = await params
  const workflow = await getWorkflow(id)
  return {
    title: workflow?.name ?? 'Workflow',
    description: workflow?.description
  }
}
```

**Sévérité** : 🟡 Mineur (UX, pas critique)

**B. Streaming SSR**

Pas utilisé de React `Suspense` boundaries pour streaming, juste Suspense local. Acceptable pour une app temps réel où WebSocket prime.

**Sévérité** : 🟡 Mineur (optimization optionnelle)

---

## 5. Architecture - Score 8/10

### ✅ Points positifs

**A. Monorepo isolation**
- ✅ Importe uniquement de `@prisma/client` et `@mcp-tracker/shared`
- ✅ Pas d'imports depuis `mcp-server`
- ✅ Dépendances correctes dans `package.json`

**B. Composant hierarchies**
- Root layout : Headers, footer, theme provider
- Page layouts : Breadcrumbs, status indicators
- Detail components : Cards, lists, forms
- UI primitives : Button, Badge, Card

**C. Hooks composition**
```
useRealtimeWorkflows
  ├── useWebSocket (connection management)
  ├── fetchWorkflows (API call)
  └── event handlers (workflow updates)

useRealtimeWorkflow
  ├── useWebSocket (subscription)
  └── event handlers (task, decision, issue, milestone updates)

useWebSocket
  └── getSocketAsync (port discovery)
```

Bien pensé, testable.

### 🟠 Points d'attention

**A. File structure profondeur**

`packages/web-ui/src/components/` a 4 niveaux :
- `components/workflow/RealtimeWorkflowDetail.tsx`
- `components/task/TaskTree.tsx`
- `components/shared/StatusBadge.tsx`
- `components/ui/button.tsx`

C'est acceptable, mais pas d'alias path `@/components` exploité pour réduire les imports relatifs. ✅ Déjà présent dans `tsconfig.json`.

**B. API layer inconsistency**

- `api/workflows/route.ts` : Récupère et filtre workflows
- `api/websocket-port/route.ts` : Récupère port WebSocket

À part, pas une vraie API client (pas de `lib/api.ts` pour centraliser les calls). Les `fetch()` sont appelés directement dans les hooks.

**Recommandation** : Créer `lib/api.ts` :
```typescript
export async function getWorkflows(status?: string): Promise<WorkflowsData> {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  const response = await fetch(`/api/workflows?${params.toString()}`)
  return response.json()
}
```

**Sévérité** : 🟡 Mineur (DRY, testabilité)

---

## 6. Sécurité - Score 9/10

### ✅ Très bien gérée

**A. Validation JSON sécurisée**

Tous les arrays JSON de SQLite sont parsés avec Zod validation :

```typescript
// TaskCard.tsx
const areas = parseJsonArraySafe(task.areas, StringArraySchema)
const warnings = parseJsonArraySafe(task.warnings, StringArraySchema)
const filesAdded = parseJsonArraySafe(task.filesAdded, StringArraySchema)

// RealtimeWorkflowDetail.tsx
const plan = parseJsonArraySafe(workflow.plan, WorkflowPlanSchema)
```

**Pas de risques de JSON injection ou malformed data**.

**B. XSS Prevention**

- ✅ React escapes HTML par défaut
- ✅ Pas d'usage de `dangerouslySetInnerHTML`
- ✅ Pas de user-generated HTML rendering

**C. CSRF protection**

- ✅ API routes utilisant POST/PUT pour mutations (non implémentées en Phase 1)
- ✅ WebSocket sur même origin

**D. Secrets management**

- ✅ Pas de secrets hardcodés
- ✅ `.env` utilisé (via `process.env`)
- ✅ Port WebSocket découvert dynamiquement depuis DB

### 🟡 Points d'attention

**A. Error handling dans error.tsx**

`src/app/error.tsx` (ligne 13) utilise `console.error` :
```typescript
useEffect(() => {
  // Log error to console in development
  console.error('Application error:', error)
}, [error])
```

C'est **acceptable** pour une error boundary (contexte système, pas user-facing). Mais idéalement utiliser le logger :
```typescript
import { createLogger } from '@/lib/logger'
const logger = createLogger('error-boundary')

useEffect(() => {
  logger.error('Application error', { message: error.message, digest: error.digest })
}, [error])
```

**Sévérité** : 🟡 Mineur (acceptable, mais inconsistent avec rest of codebase)

**B. WebSocket event validation**

`useWebSocket.ts` valide les event types au compile-time via TypeScript, mais pas de runtime validation de payload.

Exemple : `handleTaskCreated` reçoit `TaskCreatedEvent` mais `socket.on()` n'a pas de Zod validation.

```typescript
interface TaskCreatedEvent {
  task: Task
  workflowId: string
}

const handleTaskCreated = (event: TaskCreatedEvent) => { ... }
on(EVENTS.TASK_CREATED, handleTaskCreated)
```

**Impact** : Faible (données viennent d'un serveur contrôlé), mais meilleure practice serait d'ajouter validation Zod au déserialization.

**Sévérité** : 🟡 Mineur (low risk avec trusted server)

---

## 7. Performance - Score 8/10

### ✅ Bonne optimisation

**A. Re-renders minimisés**

```typescript
// useRealtimeWorkflows.ts
const statusRef = useRef(status)
statusRef.current = status
// Évite stale closures et re-fetches inutiles
```

**B. Memoization appropriée**

```typescript
// useWebSocket.ts
const on = useCallback(<T,>(event: EventName, callback: (data: T) => void) => {
  socketRef.current?.on(event, callback as (...args: unknown[]) => void)
}, [])
```

**C. Animations GPU-accelerated**

Framer Motion utilise `transform` et `opacity` (GPU friendly), pas de layout thrashing.

**D. Component code-splitting**

Peut être amélioré avec `dynamic()`, mais architecture le permet.

### 🟡 Optimisations possibles

**A. Image optimization**

Aucune image détectée (pas de composant Image Next.js). Si iconographie :
- Utiliser `next/image` + `priority` pour hero images
- SVG inlined (déjà fait avec lucide-react)

**B. Lazy loading des routes**

`app/workflow/[id]/page.tsx` charge tout en SSR. Pourrait split :
```typescript
const TaskTree = dynamic(() => import('@/components/task/TaskTree'), { loading: () => <TaskCardSkeleton /> })
```

**Sévérité** : 🟡 Mineur (impact sur FCP negligible pour cette app)

**C. Bundle size**

Dépendances :
- `framer-motion` : ~40KB gzipped
- `socket.io-client` : ~35KB gzipped
- `zod` : ~15KB gzipped
- Total: ~100KB (acceptable)

---

## 8. Patterns Spécifiques Vérifiés

### ✅ `parseJsonArraySafe` avec Zod

Utilisé correctement partout :

```typescript
// TaskCard.tsx (ligne 51-57)
const areas = parseJsonArraySafe(task.areas, StringArraySchema)
const warnings = parseJsonArraySafe(task.warnings, StringArraySchema)
const filesAdded = parseJsonArraySafe(task.filesAdded, StringArraySchema)
const filesModified = parseJsonArraySafe(task.filesModified, StringArraySchema)
const filesDeleted = parseJsonArraySafe(task.filesDeleted, StringArraySchema)
const achievements = parseJsonArraySafe(task.achievements, StringArraySchema)
const limitations = parseJsonArraySafe(task.limitations, StringArraySchema)

// RealtimeWorkflowDetail.tsx (ligne 140)
const plan = parseJsonArraySafe(workflow.plan, WorkflowPlanSchema)
```

✅ **Pas de risques JSON** - tout parsé et validé.

### ✅ Logger custom usage

Vérifié avec grep : **5 fichiers** utilisent `console.*` :
1. `lib/logger.ts` (wrapper acceptable)
2. `lib/json-parse.ts` (console.warn dans validation fail - acceptable)
3. `app/error.tsx` (console.error dans error boundary - acceptable)
4. `app/workflow/[id]/error.tsx` (pareils)
5. `app/global-error.tsx` (pareils)

**Bilan** : Tous les usages sont justifiés. ✅ **Bon usage du logger custom**.

### ✅ Organisation composants

```
components/
├── workflow/         # Workflow-scoped
│   ├── WorkflowCard.tsx
│   ├── RealtimeWorkflowList.tsx
│   ├── RealtimeWorkflowDetail.tsx
│   └── index.ts
├── task/            # Task-scoped
│   ├── TaskTree.tsx
│   ├── TaskCard.tsx
│   ├── DecisionCard.tsx
│   ├── IssueCard.tsx
│   ├── FilesList.tsx
│   ├── MilestoneTimeline.tsx
│   └── index.ts
├── shared/          # Cross-cutting
│   ├── StatusBadge.tsx
│   ├── StatsCards.tsx
│   ├── StatusFilter.tsx
│   ├── Skeleton.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   └── index.ts
└── ui/              # Primitives
```

✅ **Très bien organisé**.

---

## Problèmes Détectés par Sévérité

### 🔴 Critique (0)
Aucun problème critique détecté.

### 🟠 Important (0)
Aucun problème important détecté.

### 🟡 Mineur (5)

| # | Fichier | Ligne | Problème | Recommandation |
|---|---------|-------|----------|---------------|
| 1 | `app/api/workflows/route.ts`, `components/shared/StatusBadge.tsx`, `components/shared/StatusFilter.tsx` | 11, 13, 9 | Status strings dupliquées (`'IN_PROGRESS'`, `'COMPLETED'`, `'FAILED'`) | Créer `lib/constants.ts` avec export WORKFLOW_STATUSES |
| 2 | `components/task/MilestoneTimeline.tsx` | 12-22 | `formatTime()` duplique logique de `formatDate()` | Extraire `formatTime()` dans `lib/date-utils.ts` |
| 3 | `app/error.tsx` | 13 | `console.error` au lieu du logger custom | Importer et utiliser `createLogger('error-boundary')` |
| 4 | `hooks/useRealtimeWorkflows.ts` | 79 | Appel `fetch()` direct, pas d'API client layer | Créer `lib/api.ts` pour centraliser requêtes |
| 5 | `components/shared/StatusBadge.tsx` | 63 | Fallback à `statusConfig.IN_PROGRESS` silencieusement si status inconnu | Ajouter logging ou boundary check pour statuses invalides |

---

## Priorités P1/P2/P3

### P1 - Haute Priorité (À faire)
Aucun problème P1. Code est sûr et stable.

### P2 - Priorité Normale (Recommandé)

**P2.1** : Créer centralisé `lib/constants.ts`
- Impact : Maintenabilité, DRY
- Effort : 15 min
- Bénéfice : Avoid magic strings, single source of truth

**P2.2** : Extraire logique Intl.DateTimeFormat
- Impact : Code duplication, testabilité
- Effort : 10 min
- Bénéfice : Réutilisabilité, maintenabilité

**P2.3** : Créer `lib/api.ts` pour API calls
- Impact : Testabilité, couche d'abstraction
- Effort : 30 min
- Bénéfice : Plus facile à tester et modifier

### P3 - Basse Priorité (Nice to have)

**P3.1** : Utiliser logger dans error boundaries
- Impact : Cohérence de logging
- Effort : 10 min
- Bénéfice : Logging unifié

**P3.2** : Ajouter runtime validation pour WebSocket events
- Impact : Robustesse au-delà de compile-time
- Effort : 45 min
- Bénéfice : Détection d'anomalies serveur

**P3.3** : Générer metadata dynamique pour workflow detail page
- Impact : SEO, page titles
- Effort : 15 min
- Bénéfice : Meilleure UX pour browser tabs

---

## Checklist Recommandations

- [ ] **P2.1** : Créer `lib/constants.ts` avec `WORKFLOW_STATUSES`
- [ ] **P2.2** : Extraire `formatTime()` dans `date-utils.ts`
- [ ] **P2.3** : Créer `lib/api.ts` pour centraliser `fetch()` calls
- [ ] **P3.1** : Utiliser logger dans `app/error.tsx`
- [ ] **P3.2** : Ajouter Zod validation pour WebSocket event payloads
- [ ] **P3.3** : Implémenter `generateMetadata()` pour `/workflow/[id]`

---

## Scores Détaillés

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Qualité Code** | 8.5/10 | Bien structuré, lisible, TypeScript strict, pas de `any`. Duplication mineure de strings. |
| **DRY** | 7.5/10 | Utilitaires centralisés, mais duplication de statuses et formatage dates. |
| **SOC** | 9/10 | Séparation excellente components/hooks/lib, Server vs Client bien géré. |
| **State of the Art** | 8.5/10 | Next.js 15 + React 19 bien utilisés. Pas de dynamic metadata, streaming SSR optional. |
| **Architecture** | 8/10 | Monorepo bien isolé, composents hiérarchies logiques. Pas d'API client layer. |
| **Sécurité** | 9/10 | JSON validation robuste, XSS prevention, pas de secrets. Minor : console.error in error.tsx. |
| **Performance** | 8/10 | Re-renders minimisés, animations GPU-friendly, pas de lazy loading potentiel exploité. |

---

## Analyse des Patterns Critique

### ✅ JSON Array Parsing

**Pattern utilisé** :
```typescript
export function parseJsonArraySafe<T>(
  value: unknown,
  schema: z.ZodSchema<T[]>
): T[] {
  let parsed: unknown
  if (Array.isArray(value)) {
    parsed = value
  } else if (typeof value === 'string' && value && value !== '[]') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  } else {
    return []
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    if (typeof window !== 'undefined') {
      console.warn('JSON array validation failed:', result.error.format())
    }
    return []
  }
  return result.data
}
```

**Analyse** :
- ✅ Gère les trois cas : déjà parsé, string JSON, valeur invalide
- ✅ Validation Zod robuste
- ✅ Retourne array vide en cas d'erreur (graceful degradation)
- ✅ Logging du failure (debug-friendly)
- ✅ Gère les deux contextes : SSR et browser

**Score** : 9.5/10 (excellent pattern)

### ✅ WebSocket Reconnection Logic

**Pattern utilisé** :
```typescript
export async function getSocketAsync(): Promise<Socket | null> {
  const port = await discoverPort()
  
  if (!port) {
    logger.warn('No active server found')
    return null
  }

  // Reconnect si port change
  if (socket && currentPort !== port) {
    logger.info('Port changed, reconnecting', { oldPort: currentPort, newPort: port })
    socket.disconnect()
    socket = null
  }

  if (!socket) {
    currentPort = port
    socket = io(`http://localhost:${port}`, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }

  return socket
}
```

**Analyse** :
- ✅ Découverte dynamique du port (robuste si serveur bouge)
- ✅ Reconnection automatic si port change
- ✅ Fallback à polling si WebSocket échoue
- ✅ Gestion singleton propre

**Score** : 9/10 (bon pattern, pas de memory leak détectable)

### ✅ State Management avec WebSocket Sync

**Pattern utilisé dans `useRealtimeWorkflows.ts`** :
```typescript
// Initial state
const [workflows, setWorkflows] = useState<WorkflowWithCount[]>([])

// Fetch on mount
useEffect(() => {
  if (enabled) fetchWorkflows()
}, [fetchWorkflows, enabled, status])

// WebSocket sync
useEffect(() => {
  if (!isConnected) return

  // Workflow created
  const handleWorkflowCreated = (event: WorkflowCreatedEvent) => {
    const currentStatus = statusRef.current
    if (!currentStatus || currentStatus === 'all' || event.workflow.status === currentStatus) {
      setWorkflows((prev) => {
        if (prev.some((w) => w.id === event.workflow.id)) return prev // Avoid dupes
        return [{ ...event.workflow, _count: { tasks: 0 } }, ...prev]
      })
    }
    setStats((prev) => ({ ...prev, total: prev.total + 1, ... }))
  }

  on(EVENTS.WORKFLOW_CREATED, handleWorkflowCreated)
  return () => off(EVENTS.WORKFLOW_CREATED, handleWorkflowCreated)
}, [isConnected, on, off, fetchWorkflows])
```

**Analyse** :
- ✅ REST initial + WebSocket sync pattern correct
- ✅ Deduplication via `some()` check
- ✅ Filter matching (ne montre que les workflows matching le status filter)
- ✅ Cleanup proper dans deps array
- ✅ Stats synchronisés

**Amélioration possible** : Refetch stats au lieu de calculs manuels si nombre d'events élevé.

**Score** : 8.5/10 (bon, peut être optimisé)

---

## Recommandations de Refactoring

### Refactoring Rapide (< 1h)

**1. Centraliser les status strings**

Fichier : `lib/constants.ts` (nouveau)
```typescript
export const WORKFLOW_STATUSES = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const

export const WORKFLOW_STATUS_ARRAY = Object.values(WORKFLOW_STATUSES)
export type WorkflowStatus = typeof WORKFLOW_STATUS_ARRAY[number]

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}
```

Puis utiliser :
```typescript
// app/api/workflows/route.ts
const statusSchema = z.enum([...WORKFLOW_STATUS_ARRAY, 'all']).optional()

// components/shared/StatusFilter.tsx
const statuses = WORKFLOW_STATUS_ARRAY.map(value => ({
  value,
  label: STATUS_LABELS[value],
}))
```

**2. Extraire `formatTime()`**

Déplacer de `components/task/MilestoneTimeline.tsx` vers `lib/date-utils.ts` :
```typescript
// Dans date-utils.ts
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '--:--:--'
  
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '--:--:--'
  
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}
```

**3. Créer `lib/api.ts`**

```typescript
export async function getWorkflows(status?: string): Promise<WorkflowsData> {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  const response = await fetch(`/api/workflows?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch workflows')
  return response.json()
}

export async function getWebSocketPort(): Promise<number | null> {
  try {
    const response = await fetch('/api/websocket-port')
    if (!response.ok) return null
    const data = await response.json()
    return data.port ?? null
  } catch {
    return null
  }
}
```

Puis utiliser dans les hooks et socket.ts.

### Refactoring Moyen (1-2h)

**4. Ajouter validation runtime pour WebSocket events**

```typescript
// lib/websocket-schemas.ts
export const TaskCreatedEventSchema = z.object({
  task: z.object({ id: z.string(), ... }),
  workflowId: z.string().cuid(),
})

// hooks/useRealtimeWorkflow.ts
const handleTaskCreated = (rawEvent: unknown) => {
  const event = TaskCreatedEventSchema.parse(rawEvent)
  // ... reste du code
}
```

**5. Générer metadata dynamique**

```typescript
// app/workflow/[id]/page.tsx
export async function generateMetadata({ params }: WorkflowPageProps): Promise<Metadata> {
  const { id } = await params
  const workflow = await getWorkflow(id)
  return {
    title: workflow?.name ? `${workflow.name} - MCP Tracker` : 'Workflow - MCP Tracker',
    description: workflow?.description ?? 'View workflow details and task progress',
  }
}
```

---

## Points d'Excellence à Maintenir

1. ✅ **Validation JSON robuste** - Pattern `parseJsonArraySafe` est parfait
2. ✅ **Architecture monorepo** - Isolation stricte packages respectée
3. ✅ **TypeScript strict** - Pas de `any`, type safety partout
4. ✅ **Logger custom** - Utilisé consistently
5. ✅ **Animations smooth** - Framer Motion bien intégré
6. ✅ **Real-time sync** - WebSocket + REST fallback robuste
7. ✅ **Error handling** - Error boundaries en place

---

## Conclusion

Le package `web-ui` est **de haute qualité** avec une architecture solide, une sécurité bien pensée, et des patterns modernes Next.js/React bien appliqués.

Les 5 problèmes mineurs détectés sont faciles à corriger et ne compromettent pas la stabilité ou la sécurité de l'application.

**Score final : 8.2/10**

**Recommandation** : Procéder aux améliorations P2 (effort faible, bénéfice modéré) en priorité, puis P3 quand du temps disponible.

---

**Auditeur** : Claude Code  
**Date** : 2 décembre 2025

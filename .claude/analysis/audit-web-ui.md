# Audit Package: web-ui

**Date** : 2025-12-02
**Fichiers analysés** : 43 fichiers TypeScript/React dans packages/web-ui/src/

## Score Global : 7.5/10

Le package web-ui présente une architecture moderne Next.js 14 avec App Router, une implémentation temps-réel WebSocket solide, et une bonne séparation des responsabilités. Cependant, des violations DRY critiques et des manques de validation posent des risques.

---

## Findings

### 1. Qualité Code

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟠 | WorkflowCard.tsx:20-32 | formatDate() dupliquée dans 4 composants | Extraire dans lib/date-utils.ts |
| 🟠 | WorkflowCard.tsx:34-42 | formatDuration() dupliquée dans 3 composants | Extraire dans lib/date-utils.ts |
| 🟠 | WorkflowCard.tsx:44-53 | formatTokens() dupliquée dans 2 composants | Extraire dans lib/format-utils.ts |
| 🟠 | StatusBadge.tsx:63 | Fallback sans logging | Logger les status inconnus |
| 🟡 | ThemeToggle.tsx:79-161 | ThemeDropdown() non utilisé (dead code) | Supprimer |

**Score : 7/10**

### 2. DRY

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | WorkflowCard, RealtimeWorkflowDetail, TaskCard | **formatDate() dupliquée 4 fois** | Créer lib/date-utils.ts |
| 🔴 | WorkflowCard, RealtimeWorkflowDetail, TaskCard | **formatDuration() dupliquée 3 fois** | Même fichier utilitaire |
| 🔴 | WorkflowCard, TaskCard | **formatTokens() dupliquée 2 fois** | Même fichier utilitaire |
| 🟠 | DecisionCard, IssueCard, FilesList | Pattern config répété | Créer lib/config-utils.ts |
| 🟠 | RealtimeWorkflowList, RealtimeWorkflowDetail | Pattern AnimatePresence répété | Extraire composant EmptyStateAnimated |

**Score : 5/10** - CRITIQUE

### 3. SOC

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟢 | Tous les composants | Séparation présentation/logique respectée | Excellent |
| 🟢 | lib/prisma.ts | Singleton Prisma bien isolé, read-only | Excellent |
| 🟢 | lib/socket.ts | Client WebSocket bien isolé | Excellent |
| 🟡 | StatusBadge.tsx:22-55 | Config dans composant | Déplacer dans lib/ |

**Score : 9/10**

### 4. State of the Art

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟢 | app/page.tsx:5 | `export const dynamic = 'force-dynamic'` | Excellent |
| 🟢 | app/page.tsx, workflow/[id]/page.tsx | Server Components pour SSR | Excellent |
| 🟢 | Composants 'use client' | Directive utilisée correctement | Excellent |
| 🟠 | app/page.tsx:36-42 | Suspense inline au lieu de loading.tsx | Utiliser loading.tsx |
| 🟡 | useWebSocket.ts:34-80 | useEffect au lieu de useSyncExternalStore | Moderniser |

**Score : 8/10**

### 5. Architecture

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟢 | Structure générale | App Router Next.js 14 bien structuré | Excellent |
| 🟢 | Isolation packages | Aucun import direct de mcp-server | Excellent |
| 🟠 | components/ | 26 composants à la racine sans organisation | Créer sous-dossiers workflow/, task/, shared/ |
| 🟠 | app/api/ | Manque endpoint /api/workflow/[id] | Ajouter pour separation data fetching |
| 🟡 | lib/ | Types répétés (TaskWithRelations) | Créer lib/types.ts |

**Score : 8/10**

### 6. Sécurité

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟢 | lib/prisma.ts | Singleton Prisma, pas d'exposition directe | Bon |
| 🟢 | app/api/workflows/route.ts | Validation Zod du paramètre status | Excellent |
| 🔴 | RealtimeWorkflowDetail.tsx:172 | **parseJsonArray() sans validation du contenu** | Valider structure {step, goal} |
| 🟠 | StatusBadge.tsx:16 | Accepte any string sans whitelist | Valider contre enum Prisma |
| 🟠 | useRealtimeWorkflows.ts:79-83 | fetch() sans timeout | Ajouter AbortController |

**Score : 6/10**

### 7. Gestion d'Erreurs

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟢 | app/error.tsx, global-error.tsx | Error boundaries présents | Bon |
| 🔴 | app/api/workflows/route.ts:64-69 | **console.error() sans logging structuré** | Intégrer Sentry/Datadog |
| 🟠 | useRealtimeWorkflows.ts:90-92 | Pas de retry automatique | Ajouter retry logic |
| 🟠 | RealtimeWorkflowList.tsx:43-64 | Error UI sans détails | Afficher error.message |

**Score : 7/10**

---

## Priorités de Correction

### P1 - Critiques (IMMÉDIAT)

- [ ] **DRY : Extraire fonctions dupliquées**
  - Créer lib/date-utils.ts et lib/format-utils.ts
  - Refactoriser WorkflowCard, RealtimeWorkflowDetail, TaskCard
  - Effort : 2h

- [ ] **Sécurité : Valider parseJsonArray() results**
  - RealtimeWorkflowDetail.tsx:172
  - Créer schema Zod pour plan, areas, warnings
  - Effort : 3h

- [ ] **Logging Production : Remplacer console.error()**
  - Intégrer Sentry, Datadog, ou équivalent
  - Effort : 4h

### P2 - Importants (1-2 semaines)

- [ ] Réorganiser components/ en sous-dossiers
- [ ] Moderniser useWebSocket avec useSyncExternalStore
- [ ] Extraire config objects dans lib/config-utils.ts
- [ ] Ajouter endpoint /api/workflow/[id]
- [ ] Améliorer error messages avec retry

### P3 - Mineurs

- [ ] Supprimer ThemeDropdown() (dead code)
- [ ] Externaliser liens GitHub dans env vars
- [ ] Valider status contre enum Prisma
- [ ] Ajouter timeout sur fetch()

---

## Points Forts

1. **Next.js 14 App Router** : Utilisation correcte Server/Client Components
2. **Real-time WebSocket** : Implémentation solide avec reconnexion auto
3. **Clean Architecture** : Séparation hooks/composants/lib
4. **TypeScript strict** : Actif avec noUncheckedIndexedAccess
5. **UX Excellence** : Framer Motion, Skeletons, Error Boundaries, Dark Mode

---

## Risques Identifiés

1. **Maintenance** : Code dupliqué va diverger
2. **Sécurité** : SQLite JSON strings non validés
3. **Observabilité** : Aucun logging structuré en production
4. **Scalabilité** : Singleton Socket.io limite multi-tabs

---

## Conclusion

Le package web-ui est **techniquement solide** avec une architecture moderne. Problèmes critiques :

1. **DRY** : 4 duplications exactes de formatDate/Duration/Tokens
2. **Sécurité** : Validation JSON manquante
3. **Logging** : Pas de logging production structuré

**Estimation effort total P1+P2** : 16-20h

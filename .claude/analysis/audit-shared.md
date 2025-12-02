# Audit Technique - Package `packages/shared`

**Date:** 2 Décembre 2025  
**Auditeur:** Claude Code  
**Statut:** Audit Complet Terminé  
**Score Global:** 7.5/10

---

## 1. RÉSUMÉ EXÉCUTIF

Le package `packages/shared` sert de **source of truth** pour les types et le schéma de base de données du système MCP Workflow Tracker. 

### État Général
- ✅ Architecture TypeScript stricte (strict: true)
- ✅ Schéma Prisma bien structuré avec relations appropriées
- ✅ Indexes optimisés pour requêtes courantes
- ❌ **CRITIQUE:** Incohérence schema.prisma vs réalité SQLite
- ❌ **GRAVE:** Logger métier dans shared (violation SOC)
- ❌ **GRAVE:** Migration SQL utilise PostgreSQL pour base SQLite

### Conclusion
Le package contient une **contradiction fondamentale non-bloquante pour l'instant** mais qui empêchera les migrations SQLite de fonctionner correctement. La présence de logique métier (logger) viole le principe de séparation des responsabilités.

---

## 2. PROBLÈMES DÉTECTÉS

### 🔴 CRITIQUES (P1 - Bloquant)

#### 2.1 Incohérence Schéma Prisma ↔ Réalité SQLite

**Sévérité:** 🔴 Critique  
**Fichiers concernés:**
- `/packages/shared/prisma/schema.prisma` (lignes 23, 43, 103, 120)
- `/packages/shared/prisma/migrations/20251129060307_init/migration.sql` (lignes 2, 5, 8, 11, 14)
- `/packages/shared/prisma/migrations/migration_lock.toml` (ligne 3)

**Description:**
Le schéma Prisma utilise des `enum` natifs Prisma:
```prisma
enum WorkflowStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
}

model Workflow {
  status WorkflowStatus @default(IN_PROGRESS)
}
```

**MAIS** la migration SQL génère des PostgreSQL ENUMs (incompatibles SQLite):
```sql
CREATE TYPE "WorkflowStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');
```

Et le `migration_lock.toml` indique:
```toml
provider = "postgresql"  # ❌ Mais .env dit SQLite
```

**Problème Fondamental:**
- `.env` force SQLite: `DATABASE_URL="file:./mcp-tracker.db"`
- Mais la migration est générée pour PostgreSQL
- **SQLite ne supporte pas les ENUMs créés** - Prisma ignore simplement cette création et stocke comme TEXT
- Cela crée une **incompatibilité implicite** qui prendra effet lors du changement de DB

**Impact:**
- ❌ Les migrations ne sont pas portables
- ❌ Si quelqu'un change vers PostgreSQL, les enums Prisma seront mal mapés
- ❌ Risque de données corrompues lors de migration inter-DB
- ⚠️ Les types TypeScript ne reflètent pas la réalité DB (enum vs TEXT)

**Recommandation:**
Pour SQLite, les enums DOIVENT être stockés comme `String` avec validation app-side:
```prisma
model Workflow {
  status String @default("IN_PROGRESS") // TEXT en SQLite
  // Validé en TypeScript via enum-like constant
}
```

---

#### 2.2 Logger Métier dans Shared - Violation SOC

**Sévérité:** 🔴 Critique  
**Fichiers concernés:**
- `/packages/shared/src/logger.ts` (163 lignes d'implémentation)
- `/packages/shared/src/index.ts` (lignes 100-106, ré-exports)

**Description:**
Selon le CLAUDE.md et l'architecture du projet, le package `shared` doit contenir **UNIQUEMENT:**
- Schéma Prisma (`prisma/schema.prisma`)
- Types générés par Prisma
- Enums TypeScript (type-safety)

**MAIS** il contient une implémentation complète de logger avec:
- Fonction `createLogger(module, options)`
- Système de filtrage par log level
- Formatage des logs
- Utilisation de `console.error` pour output stderr

**Problème:**
- ❌ C'est de la **logique métier**, pas des types
- ❌ Crée une dépendance circulaire potentielle (shared → mcp-server → shared)
- ❌ Viole le principe "Shared = Source of Truth pour types uniquement"
- ❌ Le logger ne devrait pas être un export public du package

**Impact:**
- Confusion sur la responsabilité du package shared
- Potentiel de couplage non-intentionnel
- Augmente la surface d'exposition du package

**Recommandation:**
1. **Déplacer `logger.ts` vers `packages/mcp-server/src/utils/logger.ts`**
2. **Dans shared, exporter UNIQUEMENT les interfaces (types):**
   ```typescript
   export type { LogLevel, LogEntry, Logger, LoggerOptions }
   ```
3. Shared n'expose que la **signature**, mcp-server expose l'**implémentation**

---

#### 2.3 Migration SQL PostgreSQL pour Base SQLite

**Sévérité:** 🔴 Critique  
**Fichiers concernés:**
- `/packages/shared/prisma/migrations/20251129060307_init/migration.sql` (entier)
- `/packages/shared/prisma/migrations/migration_lock.toml`

**Description:**
La migration utilise la syntaxe PostgreSQL:
- `JSONB` (spécifique PostgreSQL) au lieu de `TEXT` (SQLite)
- `TIMESTAMP(3)` (PostgreSQL) au lieu de `DATETIME` (SQLite)
- `CREATE TYPE ... AS ENUM` (PostgreSQL, invalide SQLite)
- `TEXT[]` (array PostgreSQL, stocké différemment en SQLite)

**Exemple:**
```sql
-- Ligne 21 - PostgreSQL
"plan" JSONB

-- Ligne 2 - PostgreSQL (invalide SQLite)
CREATE TYPE "WorkflowStatus" AS ENUM (...)

-- Ligne 37 - PostgreSQL array
"areas" TEXT[]
```

**Problème:**
- ❌ La migration ne peut pas s'exécuter sur SQLite
- ❌ Si un développeur essaie `pnpm db:migrate`, cela échouera
- ❌ Le `migration_lock.toml` dire PostgreSQL alors que `.env` dit SQLite = **état incohérent**

**Recommandation:**
```bash
# 1. Corriger la migration_lock.toml
provider = "sqlite"

# 2. Ou: Supprimer la migration et la regénérer
rm -rf packages/shared/prisma/migrations/20251129060307_init
npx prisma migrate dev --name init  # Prisma génèrera pour SQLite
```

---

### 🟠 IMPORTANTS (P2 - Dégradation)

#### 2.4 Incohérence Schema vs Documentation

**Sévérité:** 🟠 Important  
**Fichiers concernés:**
- `/packages/shared/prisma/schema.prisma` (lignes 46-84)
- `.claude/docs/database.md` (section "Gestion des Arrays")

**Description:**
Selon la documentation, les arrays doivent être JSON strings:
```typescript
// .claude/docs/database.md
achievements String[] // Stocké comme JSON string
```

**MAIS** le schéma Prisma utilise des types ambigus:
```prisma
areas String @default("[]")  // ✅ BON - string
achievements String @default("[]")  // ✅ BON - string
nextSteps String @default("[]")  // ✅ BON - string
filesAdded String @default("[]")  // ✅ BON - string
```

**Problème:**
- ⚠️ Les commentaires disent `// JSON array` mais le type est `String`
- ⚠️ SQLite stocke comme TEXT, Prisma gère la conversion
- ⚠️ L'interface TypeScript générée par Prisma ne reflète pas que ce sont des arrays (type: `string`, not `string[]`)

**Impact:**
- Confusion pour les développeurs
- Risque de parsing JSON manqué (oublier `JSON.parse`)
- Documentation et code source ne s'alignent pas

**Recommandation:**
Clarifier explicitement dans les commentaires du schéma:
```prisma
model Task {
  // Arrays stored as JSON strings (SQLite limitation)
  areas String @default("[]") // Parse as JSON.parse(areas): string[]
  achievements String @default("[]") // Parse as JSON.parse(achievements): string[]
}
```

---

#### 2.5 Exports Prisma Incomplets

**Sévérité:** 🟠 Important  
**Fichiers concernés:**
- `/packages/shared/src/index.ts` (lignes 40-48)
- `/packages/shared/prisma/schema.prisma` (lignes 150-156)

**Description:**
Le modèle `ServerInfo` existe dans le schéma:
```prisma
model ServerInfo {
  id            String   @id @default("singleton")
  websocketPort Int
  startedAt     DateTime @default(now())
  lastHeartbeat DateTime @default(now())
  processId     Int?
}
```

**MAIS** il n'est pas exporté par `src/index.ts`:
```typescript
export {
  PrismaClient,
  type Workflow,
  type Task,
  type Decision,
  type Issue,
  type Milestone,
  type Prisma,
}
```

**Manque:** `type ServerInfo`

**Impact:**
- ❌ Les packages (mcp-server, web-ui) ne peuvent pas utiliser le type `ServerInfo`
- ❌ Compilation error si quelqu'un essaie `import { ServerInfo }`
- ⚠️ Le modèle est orphelin, son usage n'est pas documenté

**Recommandation:**
```typescript
export {
  PrismaClient,
  type Workflow,
  type Task,
  type Decision,
  type Issue,
  type Milestone,
  type ServerInfo,  // ← AJOUTER
  type Prisma,
}
```

---

#### 2.6 Validation des Enums Absente

**Sévérité:** 🟠 Important  
**Fichiers concernés:**
- `/packages/shared/src/index.ts` (lignes 55-93)

**Description:**
Les enums TypeScript sont définis:
```typescript
export const WorkflowStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type WorkflowStatus = typeof WorkflowStatus[keyof typeof WorkflowStatus]
```

**MAIS** aucune validation Zod n'existe pour les entrées externes:
```typescript
// ❌ Pas de validation
export const WorkflowStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED'])
```

**Problème:**
- ⚠️ Si une valeur `"UNKNOWN"` arrive de l'API MCP, elle n'est pas validée
- ⚠️ Les types TypeScript ne garantissent pas les valeurs runtime
- ⚠️ Les outils MCP devraient valider avec Zod avant d'écrire en DB

**Impact:**
- Risque de corruption de données (enum invalide)
- Pas de boundary validation (backend)

**Recommandation:**
Créer `packages/shared/src/schemas.ts`:
```typescript
import { z } from 'zod'

export const WorkflowStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED'])
export const TaskStatusSchema = z.enum(['IN_PROGRESS', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED'])
export const DecisionCategorySchema = z.enum(['ARCHITECTURE', 'LIBRARY_CHOICE', 'TRADE_OFF', 'WORKAROUND', 'OTHER'])
export const IssueTypeSchema = z.enum(['DOC_GAP', 'BUG', 'DEPENDENCY_CONFLICT', 'UNCLEAR_REQUIREMENT', 'OTHER'])
export const TestsStatusSchema = z.enum(['PASSED', 'FAILED', 'NOT_RUN'])
```

---

#### 2.7 ServerInfo Model Orphelin

**Sévérité:** 🟠 Important  
**Fichiers concernés:**
- `/packages/shared/prisma/schema.prisma` (lignes 150-156)

**Description:**
```prisma
model ServerInfo {
  id            String   @id @default("singleton") // Always "singleton" - single entry
  websocketPort Int
  startedAt     DateTime @default(now())
  lastHeartbeat DateTime @default(now())
  processId     Int?     // PID for debugging
}
```

**Problème:**
- ⚠️ Pas de relations avec autres modèles
- ⚠️ Pas d'indexes (même pas sur `id`)
- ⚠️ Commentaire dit "single entry" mais rien ne l'empêche dans la DB
- ⚠️ Rôle flou ("WebSocket Port Discovery" - pas documenté)
- ⚠️ Pattern singleton pas clair pour Prisma

**Impact:**
- Confusion sur l'usage
- Risque de créer plusieurs entrées au lieu d'une

**Recommandation:**
Documenter explicitement:
```prisma
/// Singleton model for server runtime info (WebSocket port, heartbeat)
/// 
/// IMPORTANT: Always query/upsert with `id: "singleton"` to ensure single entry
/// 
/// Example:
/// ```
/// await prisma.serverInfo.upsert({
///   where: { id: "singleton" },
///   update: { lastHeartbeat: new Date() },
///   create: { id: "singleton", websocketPort: 8080 }
/// })
/// ```
model ServerInfo {
  id            String   @id @default("singleton")
  websocketPort Int
  startedAt     DateTime @default(now())
  lastHeartbeat DateTime @updatedAt  // Auto-update on heartbeat call
  processId     Int?
  
  @@index([id])  // Optimize singleton lookup
}
```

---

### 🟡 MINEURS (P3 - Amélioration)

#### 2.8 Nommage Enum Inconsistent

**Sévérité:** 🟡 Mineur  
**Fichiers concernés:**
- `/packages/shared/src/index.ts` (lignes 55-93)

**Description:**
Les enums TypeScript sont définis manuellement (pas générés par Prisma):
```typescript
export const WorkflowStatus = { ... } as const
export const TaskStatus = { ... } as const
```

**Problème:**
- ⚠️ Pas de commentaire explicatif
- ⚠️ Les consommateurs ne savent pas d'où viennent ces enums
- ⚠️ La convention CLAUDE.md parle d'enums Prisma, pas manuels

**Recommandation:**
Ajouter un commentaire de contexte:
```typescript
// ============================================
// ENUMS (Manual TypeScript, stored as TEXT in SQLite)
// These are NOT auto-generated by Prisma.
// Prisma stores enum values as TEXT strings in SQLite.
// Type-safety is enforced here via TypeScript const.
// ============================================

export const WorkflowStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type WorkflowStatus = typeof WorkflowStatus[keyof typeof WorkflowStatus]
```

---

#### 2.9 Fichiers Sensibles Committes

**Sévérité:** 🟡 Mineur  
**Fichiers concernés:**
- `/packages/shared/.env` (Database URL)
- `/packages/shared/.env.sqlite` (Database URL)

**Description:**
Les fichiers `.env` et `.env.sqlite` sont présents dans le repo:
```bash
# .env
DATABASE_URL="file:./mcp-tracker.db"

# .env.sqlite
DATABASE_URL="file:./mcp-tracker.db"
```

**Problème:**
- ⚠️ `.env` ne devrait JAMAIS être commité (même s'il n'y a pas de secrets)
- ⚠️ Double fichier (`.env` et `.env.sqlite`) est redondant
- ⚠️ Mauvaise pratique: devrait être dans `.gitignore`
- ⚠️ `.env.example` existe mais n'est pas utilisé par défaut

**Impact:**
- Mauvaise hygiène du repo
- Confusion pour les contributeurs (quel `.env` utiliser?)
- Pas de normalisation avec `.env.example`

**Recommandation:**
```bash
# Dans .gitignore
packages/shared/.env
packages/shared/.env.sqlite

# Utiliser .env.example comme template
packages/shared/.env.example  # Renommer de .env.example
```

---

#### 2.10 Documentation Logger Incomplète

**Sévérité:** 🟡 Mineur  
**Fichiers concernés:**
- `/packages/shared/src/logger.ts` (lignes 1-50)

**Description:**
Le module logger manque de documentation au niveau package:
- ❌ Pas de JSDoc au niveau module
- ❌ `LoggerOptions` mal documenté (qu'est-ce que `output`?)
- ⚠️ Cas d'usage non explicite
- ⚠️ Interaction avec MCP protocol pas mentionnée

**Recommandation:**
Ajouter JSDoc complet:
```typescript
/**
 * Custom Logger System for MCP Workflow Tracker
 *
 * Lightweight, structured logging compatible with MCP protocol.
 * Logs are written to stderr (stdout is reserved for MCP JSON-RPC).
 *
 * Features:
 * - Structured logging with timestamp, level, module, message, context
 * - Log level filtering (debug, info, warn, error)
 * - Custom output function for testing/redirection
 *
 * @example
 * ```typescript
 * const logger = createLogger('git-snapshot', { minLevel: 'info' })
 * logger.warn('Snapshot failed', { error: 'Not a git repo' })
 * // stderr: [2025-12-02T10:30:45.123Z] [WARN] [git-snapshot] Snapshot failed {"error":"Not a git repo"}
 * ```
 *
 * @module @mcp-tracker/shared/logger
 */
```

---

#### 2.11 Cascade Delete Partiel

**Sévérité:** 🟡 Mineur  
**Fichiers concernés:**
- `/packages/shared/prisma/schema.prisma` (ligne 88)

**Description:**
Le parentTaskId utilise `onDelete: SET NULL` (par défaut):
```prisma
parentTask Task? @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
// ❌ Par défaut: onDelete: SET NULL
```

**Problème:**
- ⚠️ Si un parent task est supprimé, les subtasks gardent `parentTaskId = NULL`
- ⚠️ Pas clair si c'est intentionnel ou un bug
- ⚠️ Inconsistent avec le cascade delete du workflow

**Recommandation:**
Documenter explicitement:
```prisma
/// Parent task relationship (hierarchical subtasks)
/// When parent is deleted, subtasks are orphaned (SET NULL)
/// This allows subtasks to continue independently
parentTask Task? @relation(
  "TaskHierarchy",
  fields: [parentTaskId],
  references: [id],
  onDelete: SetNull  // ← Explicit
)
```

---

## 3. ARCHITECTURE ET SÉPARATION DES RESPONSABILITÉS

### Points Positifs
✅ **Monorepo Structure:**
- Separation claire entre shared (types), mcp-server (logic), web-ui (presentation)
- Package.json bien configuré avec exports

✅ **Database Design:**
- Relations bien modélisées (Workflow → Task → Decision/Issue/Milestone)
- Indexes optimisés pour queries courantes
- Cascade delete approprié (Workflow suppression cascade)

✅ **TypeScript:**
- Mode strict activé
- Types explicites pour exports
- Enum pattern correctement implémenté (const + type)

### Points Négatifs
❌ **Logger dans Shared:**
- Violation du principe: Shared = Types + Prisma uniquement
- Crée potentiel de couplage non-intentionnel
- Confuse les consommateurs sur la responsabilité du package

❌ **Schéma Prisma:**
- Utilise enum Prisma natifs (PostgreSQL) pour base SQLite
- Migration générée pour PostgreSQL (incompatible SQLite)
- Ambiguïté schema vs réalité DB

---

## 4. TYPE-SAFETY ET VALIDATION

### Points Positifs
✅ `tsconfig.json` stricte:
- `strict: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`
- `noFallthroughCasesInSwitch: true`

✅ Enums TypeScript manuels:
- Bonne couverture (WorkflowStatus, TaskStatus, DecisionCategory, IssueType, TestsStatus)
- Pattern const + type génériques corrects

### Lacunes
❌ Pas de validation Zod:
- Enums TypeScript ne sont pas validés à l'entrée
- Risque d'enum invalide en runtime
- Les outils MCP devraient valider avec schemas Zod

❌ JSON fields sans validation:
- `snapshotData`, `plan`, `metadata` sont JSON libres
- Pas de Zod validation avant écriture
- Risque de données corrompues

---

## 5. SÉCURITÉ

### Bonnes Pratiques
✅ Pas de secrets hardcodés dans le code TypeScript  
✅ `.env.example` existe comme template  
✅ `DATABASE_URL` lue depuis `process.env`  

### Risques
⚠️ `.env` commité (même sans secrets)  
⚠️ Pas de validation des JSON fields (injection JSON)  
⚠️ `ServerInfo.processId` exposé (leaks PID)  

### Recommandations
- Retirer `.env` du repo
- Ajouter validation Zod pour tous les JSON inputs
- Documenter que ServerInfo ne doit pas être exposé publiquement

---

## 6. DOCUMENTATION

### Couverture
✅ Bon JSDoc pour types et interfaces  
✅ Schéma Prisma commenté  
✅ `.claude/docs/database.md` détaillée  

### Lacunes
❌ Pas de README dans shared/  
❌ Pattern singleton de ServerInfo non documenté  
❌ Enum naming inconsistency  
❌ Array JSON storage pas clair dans le schéma  

---

## 7. CHECKLIST AVANT FIX

- [ ] **P1.1:** Remplacer enums Prisma natifs par String + validation TypeScript
- [ ] **P1.2:** Regénérer migration pour SQLite (supprimer et `prisma migrate dev`)
- [ ] **P1.3:** Corriger `migration_lock.toml` de postgresql → sqlite
- [ ] **P1.4:** Déplacer logger.ts vers mcp-server/src/utils/
- [ ] **P2.1:** Ajouter ServerInfo aux exports
- [ ] **P2.2:** Créer packages/shared/src/schemas.ts avec Zod enums
- [ ] **P2.3:** Documenter ServerInfo avec exemple singleton
- [ ] **P2.4:** Clarifier array storage (JSON strings) dans schéma
- [ ] **P3.1:** Ajouter commentaires sur enums manuels
- [ ] **P3.2:** Retirer .env du git, ajouter à .gitignore
- [ ] **P3.3:** Créer README.md pour shared/

---

## 8. PRIORITÉS D'ACTION

### Phase 1 - URGENT (Bloquer les tests)
1. **Corriger le schéma Prisma pour SQLite** (P1.1)
   - Remplacer enum WorkflowStatus par String @default("IN_PROGRESS")
   - Idem pour TaskStatus, DecisionCategory, IssueType, TestsStatus
   - ~15 min

2. **Regénérer migrations pour SQLite** (P1.2, P1.3)
   - Supprimer /migrations/20251129060307_init/
   - Corriger migration_lock.toml
   - Run `npx prisma migrate dev --name init`
   - ~10 min

3. **Déplacer logger hors shared** (P1.4)
   - Créer packages/mcp-server/src/utils/logger.ts
   - Laisser types dans shared
   - ~20 min

### Phase 2 - Important (Avant merge)
4. **Exports Prisma** (P2.1)
   - Ajouter ServerInfo
   - ~2 min

5. **Validation Zod** (P2.2)
   - Créer schemas.ts
   - ~15 min

6. **Documentation ServerInfo** (P2.3)
   - Ajouter JSDoc au modèle
   - ~5 min

### Phase 3 - Nice-to-Have (Hygiène)
7. **Retirer .env du git** (P3.2)
8. **Commentaires enum** (P3.1)
9. **README shared/** (P3.3)

---

## CONCLUSION

Le package `shared` est **partiellement correct** mais souffre de **trois contradictions graves** qui doivent être résolues avant que le système ne se mette à l'échelle:

1. **Schéma Prisma incompatible SQLite** - L'utilisation d'enums Prisma natifs générera des migrations PostgreSQL pour une base SQLite
2. **Logger métier dans Shared** - Violation du principe "Shared = Types + Prisma uniquement"
3. **Migration générée pour mauvaise DB** - migration_lock.toml dit PostgreSQL, .env dit SQLite

**Estimation:** 60 min pour P1, 30 min pour P2 = **90 minutes de refactoring** pour un système stable.

**Recommandation:** Traiter immédiatement avant Phase 2 (web-ui) et tests.

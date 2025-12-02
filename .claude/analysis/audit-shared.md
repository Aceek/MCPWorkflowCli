# Audit Package: shared

**Date** : 2025-12-02
**Fichiers analysés** :
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/prisma/schema.prisma`
- `packages/shared/prisma/schema.postgresql.prisma`
- `packages/shared/.env.example`

## Score Global : 6.5/10

Le package `shared` présente une architecture solide mais souffre de plusieurs incohérences critiques entre les schémas Prisma, les enums exportés, et la documentation.

---

## Findings

### 1. Qualité Code

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟡 | src/index.ts:1-6 | JSDoc header incomplet | Ajouter métadonnées complètes |
| 🟡 | src/index.ts:8-19 | Commentaire trompeur "SQLite enums as strings" | Clarifier contexte |
| 🟡 | src/index.ts:59-63 | Types helpers non documentés | Ajouter JSDoc |

### 2. DRY

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | src/index.ts:22-56 | **DUPLICATION CRITIQUE**: Enums définis manuellement alors que Prisma les génère | Utiliser UNIQUEMENT les enums Prisma: `import { WorkflowStatus, TaskStatus } from '@prisma/client'` |
| 🔴 | prisma/ | **DEUX schémas Prisma** (confusion totale) | Supprimer `schema.postgresql.prisma`, garder UNIQUEMENT `schema.prisma` |

### 3. SOC

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟠 | src/index.ts:22-56 | Package contient de la logique (mapping enums) alors qu'il devrait être PURE types | Supprimer les constantes redondantes |
| 🟡 | prisma/schema.prisma:9 | Provider hardcodé à "postgresql" | Utiliser `provider = env("DATABASE_PROVIDER")` |

### 4. State of the Art

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | src/index.ts:22-56 | **ANTI-PATTERN**: Réinvention des enums Prisma | Supprimer et utiliser enums Prisma natifs |
| 🟠 | prisma/schema.prisma | Schéma manque champs métriques (totalDurationMs, tokensInput/Output) | Ajouter les champs |

### 5. Architecture

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🔴 | prisma/ | **VIOLATION CRITIQUE**: 2 schémas Prisma | UN SEUL schéma avec multi-DB via env var |
| 🟠 | src/index.ts:22-56 | Violation du principe "shared = types only" | Ce package NE DOIT contenir QUE types Prisma |

### 6. Sécurité

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| 🟡 | .env.example:5 | Mot de passe d'exemple trop simple | Ajouter commentaire sécurité |
| ✅ | Aucun secret hardcodé | Bonne pratique respectée | - |

### 7. Gestion d'Erreurs

| Sévérité | Fichier:Ligne | Problème | Recommandation |
|----------|---------------|----------|----------------|
| N/A | - | Package de types uniquement | Aucune action |

---

## Priorités de Correction

### P1 - Critiques

- [ ] Supprimer `prisma/schema.postgresql.prisma`
- [ ] Supprimer les enums manuels de `src/index.ts` (lignes 22-56)
- [ ] Corriger `prisma/schema.prisma` ligne 9: `provider = env("DATABASE_PROVIDER")`
- [ ] Aligner les valeurs des enums Prisma (casse cohérente)

### P2 - Importants

- [ ] Ajouter champs métriques manquants au schéma Prisma (totalDurationMs, tokensInput, tokensOutput)
- [ ] Faire en sorte que mcp-server importe les enums depuis `@mcp-tracker/shared`

### P3 - Mineurs

- [ ] Améliorer JSDoc header de `src/index.ts`
- [ ] Renommer scripts Prisma pour cohérence
- [ ] Ajouter commentaire sécurité dans `.env.example`

---

## Conclusion

Le package shared a une bonne base mais souffre de **duplications critiques** (enums manuels vs Prisma) et d'une **confusion architecturale** (2 schémas Prisma). Effort de correction estimé: 2-3 heures.

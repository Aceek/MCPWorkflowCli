---
description: Vérifie la qualité du code (TypeScript, ESLint, Prettier, diagnostics IDE)
---

# Check Code Quality

Lance tous les checks de qualité de code sur le monorepo pnpm.

## Packages du monorepo

- `@mcp-tracker/shared` - Types Prisma partagés
- `@mcp-tracker/mcp-server` - Serveur MCP (Phase 1)
- `@mcp-tracker/web-ui` - Interface Next.js (Phase 2)

## Checks effectués

1. **TypeScript Compilation** : Vérifie les erreurs de type (tous les packages)
2. **Diagnostics IDE** : Récupère les warnings/errors de VS Code

> Note: ESLint et Prettier seront ajoutés dans une future itération.

## Instructions

Tu dois exécuter les checks suivants **en parallèle** pour maximiser la performance :

### TypeScript - Tous les packages
```bash
# mcp-server (package principal Phase 1)
pnpm --filter @mcp-tracker/mcp-server exec tsc --noEmit

# shared (types Prisma)
pnpm --filter @mcp-tracker/shared exec tsc --noEmit
```

### Diagnostics IDE
Utilise `mcp__ide__getDiagnostics` pour récupérer les diagnostics VS Code.

## Format de sortie

Présente les résultats de manière claire et structurée :

```
📊 Check Code Quality Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ shared TypeScript      : OK
✅ mcp-server TypeScript  : OK
✅ IDE Diagnostics        : OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 All checks passed!
```

Si des erreurs sont détectées, affiche-les de manière concise avec les fichiers concernés :

```
📊 Check Code Quality Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ shared TypeScript      : OK
❌ mcp-server TypeScript  : 3 errors
   - src/tools/start-task.ts:15:7 - Type 'string' is not assignable to type 'TaskStatus'
   - src/utils/git-snapshot.ts:42:12 - Property 'hash' does not exist
   - src/db.ts:8:3 - Cannot find module '@prisma/client'

⚠️  IDE Diagnostics       : 2 warnings
   - src/index.ts:10:5 - Unused import 'Server'
   - src/tools/complete-task.ts:25:10 - 'any' type detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 5 issues found

💡 Suggestions:
- Run 'pnpm db:generate' if Prisma types are missing
- Check import paths and ensure workspace dependencies are installed
```

## Actions supplémentaires

Après avoir affiché les résultats :

1. **Si tout est OK** : Félicite l'utilisateur et ne fais rien d'autre
2. **Si Prisma types manquants** : Suggère `pnpm db:generate`
3. **Si dépendances manquantes** : Suggère `pnpm install`
4. **Si beaucoup d'erreurs TypeScript** : Propose d'analyser et corriger les erreurs

## Notes importantes

- **NE PAS** créer de fichier TODO ou plan, c'est juste un check rapide
- **NE PAS** lancer d'agent supplémentaire sauf si l'utilisateur le demande explicitement
- **NE PAS** modifier du code sans accord explicite de l'utilisateur
- Utilise Bash tool avec plusieurs appels parallèles pour maximiser la performance
- Ignore le package `web-ui` s'il n'est pas encore configuré (Phase 2)

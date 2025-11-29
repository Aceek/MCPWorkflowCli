---
description: Vérifie la qualité du code (TypeScript, ESLint, Prettier, diagnostics IDE)
---

# Check Code Quality

Lance tous les checks de qualité de code sur le projet (frontend + backend).

## Checks effectués

1. **TypeScript Compilation** : Vérifie les erreurs de type (frontend + backend)
2. **ESLint** : Vérifie les erreurs de linting (frontend + backend)
3. **Prettier** : Vérifie le formatage (frontend + backend)
4. **Diagnostics IDE** : Récupère les warnings/errors de VS Code

## Instructions

Tu dois exécuter les checks suivants **en parallèle** pour maximiser la performance :

**IMPORTANT** : Utilise toujours la racine du projet pour éviter les problèmes de working directory :
```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
```

### Frontend
```bash
cd "$PROJECT_ROOT/frontend" && npm run lint
cd "$PROJECT_ROOT/frontend" && npx tsc --noEmit
cd "$PROJECT_ROOT/frontend" && npx prettier --check "src/**/*.{ts,tsx,css}"
```

### Backend
```bash
cd "$PROJECT_ROOT/backend" && npm run lint
cd "$PROJECT_ROOT/backend" && npx tsc --noEmit
cd "$PROJECT_ROOT/backend" && npx prettier --check "src/**/*.ts"
```

### Diagnostics IDE (optionnel)
Utilise `mcp__ide__getDiagnostics` si disponible pour récupérer les diagnostics VS Code.

## Format de sortie

Présente les résultats de manière claire et structurée :

```
📊 Check Code Quality Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Frontend TypeScript   : OK
✅ Frontend ESLint       : OK
✅ Frontend Prettier     : OK
✅ Backend TypeScript    : OK
✅ Backend ESLint        : OK
✅ Backend Prettier      : OK
✅ IDE Diagnostics       : OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 All checks passed!
```

Si des erreurs sont détectées, affiche-les de manière concise avec les fichiers concernés :

```
📊 Check Code Quality Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Frontend TypeScript   : OK
❌ Frontend ESLint       : 3 errors
   - src/features/auth/AuthForm.tsx:15:7 - 'any' type is not allowed
   - src/features/catalog/ProductCard.tsx:42:12 - Missing translation key
   - src/lib/api.ts:8:3 - Unused variable 'config'

✅ Frontend Prettier     : OK
✅ Backend TypeScript    : OK
❌ Backend ESLint        : 1 error
   - src/features/auth/auth.service.ts:23:5 - 'any' type is not allowed

⚠️  Backend Prettier     : 2 files need formatting
   - src/features/catalog/catalog.routes.ts
   - src/lib/db.ts

✅ IDE Diagnostics       : OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 6 issues found

💡 Suggestions:
- Run 'npm run lint:fix' in frontend to auto-fix ESLint issues
- Run 'npm run format' in backend to auto-fix formatting
```

## Actions supplémentaires

Après avoir affiché les résultats :

1. **Si tout est OK** : Félicite l'utilisateur et ne fais rien d'autre
2. **Si des erreurs sont détectées** :
   - Demande à l'utilisateur s'il veut que tu les corriges automatiquement (pour lint:fix et format)
   - NE CORRIGE PAS automatiquement sans demander
3. **Si beaucoup d'erreurs TypeScript** : Suggère de vérifier les types et propose d'analyser les erreurs

## Notes importantes

- **NE PAS** créer de fichier TODO ou plan, c'est juste un check rapide
- **NE PAS** lancer d'agent supplémentaire sauf si l'utilisateur le demande explicitement
- **NE PAS** modifier du code sans accord explicite de l'utilisateur
- Utilise Bash tool avec plusieurs appels parallèles pour maximiser la performance

# Workflow: npm-distribution

**Workflow ID**: `cmjrsbohn0000fhythq59bjsh`
**Profile**: complex
**Created**: 2025-12-30T10:00:00Z

## Objective

Restructurer Mission Control pour distribution via NPM avec:
- Package `@mission-control/config` (configuration TOML centralisée)
- Package `@mission-control/cli` (commandes init/link/ui/doctor/config)
- Migration de mcp-server et web-ui vers la config centralisée
- Documentation et tests complets

## Scope

| Include | Exclude |
|---------|---------|
| packages/config/ (nouveau) | mission-system/ (docs seulement) |
| packages/cli/ (nouveau) | packages/shared/ (pas de changements majeurs) |
| packages/mcp-server/ (migration config) | .claude/workflows/ (pas de modification) |
| packages/web-ui/ (migration config) | |
| scripts/ (mise à jour si nécessaire) | |
| Documentation (README, CHANGELOG) | |

## Constraints

- Backwards compatible avec setup actuel (scripts existants continuent de fonctionner)
- Zero breaking change pour users existants pendant transition
- Node.js 20+ requis
- pnpm workspaces
- TypeScript strict mode
- Zod validation pour toute config
- Prisma enums (no magic strings)

## Success Criteria

- [ ] `npm install -g @mission-control/cli` fonctionne
- [ ] `mission-control init` crée config + DB + symlinks
- [ ] `mission-control link` génère .mcp.json valide
- [ ] `mission-control doctor` vérifie installation complète
- [ ] `mission-control ui` lance le dashboard
- [ ] `mission-control config` permet gestion config TOML
- [ ] Config TOML éditable et validée via Zod
- [ ] Variables d'environnement override fonctionnels
- [ ] Tests unitaires pour config et CLI (>80% coverage)
- [ ] Tests d'intégration pour flux complet
- [ ] Documentation mise à jour (README, architecture.md)
- [ ] CHANGELOG.md avec toutes les modifications
- [ ] Tous les builds passent (pnpm build)
- [ ] Aucune régression sur fonctionnalités existantes

# Workflow: Code Quality Review

**Workflow ID**: `<PENDING_start_workflow_call>`
**Created**: 2025-12-27

## Objective
Comprehensive code quality audit and remediation across all packages (mcp-server, shared, web-ui) following SOLID principles, DRY, security best practices, and clean code standards.

## Scope
| Include | Exclude |
|---------|---------|
| `packages/mcp-server/` (tools, websocket, utils) | node_modules, build artifacts |
| `packages/shared/` (Prisma schema, types) | Generated Prisma client |
| `packages/web-ui/` (components, hooks, lib, api) | .next, public assets |
| TypeScript/JavaScript source files | Documentation, config files |

## Constraints
- Conventional commits in English (no Claude Code mentions)
- Preserve all existing functionality
- No breaking changes to public APIs
- TypeScript strict mode compliance
- Regular commits during corrections (atomic changes)
- Each service corrected independently (no cross-contamination)

## Success Criteria
- [ ] All 3 services analyzed with detailed reports
- [ ] SOLID violations identified and categorized
- [ ] DRY violations identified and categorized
- [ ] Security issues flagged and prioritized
- [ ] Code smells (long files, SRP violations) documented
- [ ] All identified issues corrected with tests passing
- [ ] Final quality review validates all corrections
- [ ] Git history shows conventional commits only

## Context
This is a monorepo using:
- Prisma for database (packages/shared)
- MCP server protocol (packages/mcp-server)
- Next.js 14 App Router (packages/web-ui)

Quality standards:
- SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- DRY: Don't Repeat Yourself
- Security: Input validation, SQL injection prevention, XSS prevention
- Clean Code: Meaningful names, small functions, clear intent

## References
- `.claude/docs/standards.md`
- `.claude/docs/architecture.md`

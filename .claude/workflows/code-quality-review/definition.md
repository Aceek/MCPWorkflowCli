# Workflow: Code Quality Review

**Workflow ID**: `<TO_BE_REGISTERED>`

## Objective

Perform comprehensive code quality analysis and remediation across all packages in the monorepo, ensuring adherence to SOLID principles, DRY, security best practices, and clean code standards.

## Scope

| Include | Exclude |
|---------|---------|
| `packages/mcp-server/src/**/*.ts` | Generated files (Prisma client) |
| `packages/shared/src/**/*.ts` | `node_modules/` |
| `packages/web-ui/src/**/*.ts` | Build artifacts (`dist/`, `.next/`) |
| TypeScript source files only | Configuration files |
| All business logic, utilities, components | Test files (analyzed but not modified) |

## Analysis Criteria

1. **SOLID Principles**
   - Single Responsibility: Each module has one clear purpose
   - Open/Closed: Extensible without modification
   - Liskov Substitution: Proper inheritance hierarchies
   - Interface Segregation: Focused interfaces
   - Dependency Inversion: Depend on abstractions

2. **DRY (Don't Repeat Yourself)**
   - Identify code duplication
   - Extract common utilities
   - Shared types and interfaces

3. **Security Vulnerabilities**
   - Hardcoded secrets
   - SQL injection risks
   - Unsafe file operations
   - Input validation gaps

4. **Clean Code**
   - File length (<400 lines)
   - Function size (<50 lines)
   - Clear naming conventions
   - Proper error handling
   - Consistent formatting

## Constraints

- **Git commits**: Conventional commits format, English only
- **No Claude Code mentions**: Remove all references in commits/code
- **Atomic commits**: One logical change per commit
- **Preserve functionality**: No breaking changes without justification
- **TypeScript strict mode**: Maintain `strict: true` compliance
- **Package boundaries**: Respect architecture (no forbidden imports)

## Success Criteria

- [ ] All packages analyzed with detailed reports
- [ ] High-priority issues fixed (security, SOLID violations)
- [ ] Code duplication reduced by >30%
- [ ] All files comply with clean code metrics
- [ ] No regression in existing tests
- [ ] Atomic commits following conventions
- [ ] Final review validates consistency across packages

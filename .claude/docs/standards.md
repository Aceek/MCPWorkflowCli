# Code Standards

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Variables/Functions | camelCase | `workflowId`, `startTask` |
| Types/Interfaces | PascalCase | `TaskData`, `GitDiffResult` |
| Enums | PascalCase | `TaskStatus.IN_PROGRESS` |
| Constants | SCREAMING_SNAKE | `MAX_MILESTONES_PER_TASK` |
| Files (React) | PascalCase | `TreeView.tsx` |
| Files (other) | kebab-case | `git-snapshot.ts` |

## TypeScript

**Required**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**Rules**:
- Explicit types for public functions
- Prisma enums only (no magic strings)
- `unknown` instead of `any`
- No `@ts-ignore` without justification

## Validation

All MCP inputs must use Zod:

```typescript
const schema = z.object({
  name: z.string().min(1).max(100),
  status: z.enum(['success', 'failed'])
})
const validated = schema.parse(args)
```

## Git Commits

```
type(scope): description

feat(mcp): add complete_task tool
fix(git): handle union of commits + working tree
refactor(db): extract Prisma singleton
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

**Scopes**: `mcp`, `tools`, `git`, `db`, `prisma`, `ui`, `components`

## Error Handling

```typescript
export class McpError extends Error {
  constructor(public message: string, public code: string = 'INTERNAL_ERROR') {
    super(message)
  }
}

// Usage
if (!task) throw new McpError('Task not found', 'VALIDATION_ERROR')
```

## Prisma

**Do**:
- Use singleton pattern (`db.ts`)
- Use `include` for relations
- Use `Promise.all` for parallel queries

**Don't**:
- Create new PrismaClient per call
- Use raw SQL
- N+1 queries (loop with findMany)

## File Structure

```typescript
// 1. Imports (types last)
import { prisma } from '../db'
import { createGitSnapshot } from '../utils/git-snapshot'
import type { StartTaskArgs } from '../types'

// 2. Export function
export async function handleStartTask(args: StartTaskArgs): Promise<Result> {
  // 3. Validate
  const validated = schema.parse(args)

  // 4. Business logic
  const task = await prisma.task.create({ data: validated })

  // 5. Return
  return { task_id: task.id }
}
```

## Security

- No hardcoded secrets (use `process.env`)
- Zod validation on all inputs
- Filesystem access limited to project Git directory
- Web UI is read-only (no DB writes)

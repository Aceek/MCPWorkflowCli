# Recommandations d'Amelioration

## Priorite P0 (Critique)

### 1. Ajouter des Tests

**Probleme**: Zero tests dans le projet.

**Impact**: Impossible de refactorer en confiance, regressions possibles.

**Solution**:
```bash
packages/mcp-server/__tests__/
├── tools/
│   ├── start-task.test.ts
│   ├── complete-task.test.ts
│   └── ...
├── utils/
│   ├── git-snapshot.test.ts
│   └── git-diff.test.ts
└── integration/
    └── workflow-lifecycle.test.ts
```

**Effort**: 2-3 jours

### 2. Corriger get_context

**Probleme**: Doc mentionne `phase_summary` mais pas dans le code.

**Impact**: Orchestrators ne peuvent pas avoir de resume de phase.

**Solution**:
```typescript
if (include.includes('phase_summary')) {
  const phases = await prisma.phase.findMany({
    where: { workflowId: workflow_id },
    include: { _count: { select: { tasks: true }}}
  })
  response.phase_summary = phases.map(...)
}
```

**Effort**: 2 heures

## Priorite P1 (Important)

### 3. Limiter les Appels MCP

**Probleme**: Pas de limite sur log_milestone, risque de spam.

**Solution**:
```typescript
// Dans log_milestone handler
const count = await prisma.milestone.count({
  where: { taskId: validated.task_id }
})
if (count >= MAX_MILESTONES_PER_TASK) {
  throw new ValidationError('Milestone limit reached')
}
```

**Effort**: 1 heure

### 4. Ajouter Timeout sur Tasks

**Probleme**: Un subagent peut tourner indefiniment.

**Solution**:
```typescript
// Dans start_task
data: {
  ...
  deadline: new Date(Date.now() + validated.timeout_ms || 30 * 60 * 1000)
}

// Cron job ou check dans get_context
const stale = await prisma.task.findMany({
  where: {
    status: 'IN_PROGRESS',
    startedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }
  }
})
```

**Effort**: 4 heures

### 5. Pagination get_context

**Probleme**: Pour gros workflows, retourne tout.

**Solution**:
```typescript
const getContextSchema = z.object({
  // ...
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
})
```

**Effort**: 2 heures

## Priorite P2 (Nice to Have)

### 6. Retry Logic pour Subagents

**Probleme**: Pas de retry automatique si task fail.

**Solution**:
```typescript
// Dans workflow.md
agents:
  - type: implementer
    retry:
      max_attempts: 3
      backoff: exponential
```

**Effort**: 1 jour

### 7. Export Workflow

**Probleme**: Donnees bloquees en SQLite.

**Solution**:
```typescript
// Nouveau tool: export_workflow
export async function handleExportWorkflow(args) {
  const workflow = await prisma.workflow.findUnique({
    include: { phases: { include: { tasks: { include: {...}}}}}
  })
  return formatAsMarkdown(workflow) // ou JSON/HTML/PDF
}
```

**Effort**: 4 heures

### 8. Metrics Dashboard

**Probleme**: Pas de vue agregee (tokens, duree, success rate).

**Solution**:
```typescript
// Nouveau endpoint API
GET /api/metrics
{
  total_workflows: 42,
  avg_duration_ms: 125000,
  success_rate: 0.87,
  total_tokens: 1500000
}
```

**Effort**: 1 jour

## Priorite P3 (Future)

### 9. State Machine pour Workflows

**Probleme**: Workflows lineaires uniquement.

**Solution**: Integrer XState ou similar pour workflows avec branches.

**Effort**: 1 semaine

### 10. Semantic Memory

**Probleme**: Pas de recherche semantique dans les decisions.

**Solution**: Embeddings + vector search (Chroma, Pinecone).

**Effort**: 1 semaine

## Roadmap Suggeree

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| 1 | Tests | 80% coverage mcp-server |
| 2 | Robustesse | Limites, timeouts, pagination |
| 3 | UX | Export, metrics dashboard |
| 4 | Avance | Retry logic, state machine |

## Conclusion

Le projet est sur de bonnes bases. Les priorites P0 et P1 sont essentielles avant toute production use. L'architecture est solide et permet d'ajouter ces ameliorations incrementalement.

Le Git snapshot innovant et l'approche MCP-only pour le state sont des differenciateurs forts par rapport aux alternatives. Avec les tests et quelques ameliorations de robustesse, ce projet peut devenir une reference pour l'observabilite des agents AI.

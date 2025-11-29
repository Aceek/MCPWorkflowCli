/**
 * @mcp-tracker/shared
 *
 * Shared types and Prisma client exports for MCP Workflow Tracker.
 * This package is the source of truth for database types.
 */

// Re-export all Prisma types and enums
export {
  PrismaClient,
  // Enums
  WorkflowStatus,
  TaskStatus,
  DecisionCategory,
  IssueType,
  TestsStatus,
  // Types
  type Workflow,
  type Task,
  type Decision,
  type Issue,
  type Milestone,
  type Prisma,
} from '@prisma/client'

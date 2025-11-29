/**
 * log_issue MCP Tool
 *
 * Log an issue encountered during execution.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitIssueCreated } from '../websocket/index.js'
import { NotFoundError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// SQLite: enums stored as strings
const IssueType = {
  DOC_GAP: 'DOC_GAP',
  BUG: 'BUG',
  DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
  UNCLEAR_REQUIREMENT: 'UNCLEAR_REQUIREMENT',
  OTHER: 'OTHER',
} as const

// Map input strings to enum values
const issueTypeMap: Record<string, string> = {
  documentation_gap: IssueType.DOC_GAP,
  bug_encountered: IssueType.BUG,
  dependency_conflict: IssueType.DEPENDENCY_CONFLICT,
  unclear_requirement: IssueType.UNCLEAR_REQUIREMENT,
  other: IssueType.OTHER,
}

// Zod schema for validation
const logIssueSchema = z.object({
  task_id: z.string().min(1),
  type: z.enum([
    'documentation_gap',
    'bug_encountered',
    'dependency_conflict',
    'unclear_requirement',
    'other',
  ]),
  description: z.string().min(1),
  resolution: z.string().min(1),
  requires_human_review: z.boolean().optional(),
})

// MCP Tool definition
export const logIssueTool = {
  name: 'log_issue',
  description: 'Log an issue encountered during execution',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'Task ID this issue belongs to',
      },
      type: {
        type: 'string',
        enum: [
          'documentation_gap',
          'bug_encountered',
          'dependency_conflict',
          'unclear_requirement',
          'other',
        ],
        description: 'Type of issue',
      },
      description: {
        type: 'string',
        description: 'Description of the issue',
      },
      resolution: {
        type: 'string',
        description: 'How the issue was resolved/worked around',
      },
      requires_human_review: {
        type: 'boolean',
        description: 'Does a human need to review this resolution?',
      },
    },
    required: ['task_id', 'type', 'description', 'resolution'],
  },
}

// Handler
export async function handleLogIssue(args: unknown): Promise<CallToolResult> {
  // Validate input
  const validated = logIssueSchema.parse(args)

  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: validated.task_id },
  })

  if (!task) {
    throw new NotFoundError(`Task not found: ${validated.task_id}`)
  }

  // Map type string to Prisma enum
  const issueType = issueTypeMap[validated.type]
  if (!issueType) {
    throw new Error(`Invalid issue type: ${validated.type}`)
  }

  // Create issue in database
  const issue = await prisma.issue.create({
    data: {
      taskId: validated.task_id,
      type: issueType,
      description: validated.description,
      resolution: validated.resolution,
      requiresHumanReview: validated.requires_human_review ?? false,
    },
  })

  // Emit WebSocket event for real-time UI update
  emitIssueCreated(issue, validated.task_id, task.workflowId)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            issue_id: issue.id,
            created_at: issue.createdAt.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}

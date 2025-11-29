#!/usr/bin/env node

/**
 * MCP Workflow Tracker Server
 *
 * A Model Context Protocol server that provides observability
 * for agentic workflows. Captures intention, reasoning, and
 * code changes with automatic Git diff computation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js'
import { ZodError } from 'zod'

// Import tool definitions and handlers
import {
  startWorkflowTool,
  handleStartWorkflow,
} from './tools/start-workflow.js'
import { startTaskTool, handleStartTask } from './tools/start-task.js'
import { logDecisionTool, handleLogDecision } from './tools/log-decision.js'
import { logIssueTool, handleLogIssue } from './tools/log-issue.js'
import {
  logMilestoneTool,
  handleLogMilestone,
} from './tools/log-milestone.js'
import {
  completeTaskTool,
  handleCompleteTask,
} from './tools/complete-task.js'

// Import error types
import { McpError, ValidationError, NotFoundError } from './utils/errors.js'

const MCP_SERVER_NAME = 'mcp-workflow-tracker'
const MCP_SERVER_VERSION = '1.0.0'

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      startWorkflowTool,
      startTaskTool,
      logDecisionTool,
      logIssueTool,
      logMilestoneTool,
      completeTaskTool,
    ],
  }))

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    try {
      return await handleToolCall(name, args)
    } catch (error) {
      return formatError(error)
    }
  })

  return server
}

/**
 * Route tool calls to appropriate handlers
 */
async function handleToolCall(
  name: string,
  args: unknown
): Promise<CallToolResult> {
  switch (name) {
    case 'start_workflow':
      return handleStartWorkflow(args)

    case 'start_task':
      return handleStartTask(args)

    case 'log_decision':
      return handleLogDecision(args)

    case 'log_issue':
      return handleLogIssue(args)

    case 'log_milestone':
      return handleLogMilestone(args)

    case 'complete_task':
      return handleCompleteTask(args)

    default:
      throw new McpError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL')
  }
}

/**
 * Format errors for MCP response
 */
function formatError(error: unknown): CallToolResult {
  let message: string
  let code: string

  if (error instanceof ZodError) {
    // Validation error from Zod
    const issues = error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ')
    message = `Validation error: ${issues}`
    code = 'VALIDATION_ERROR'
  } else if (error instanceof ValidationError) {
    message = error.message
    code = error.code
  } else if (error instanceof NotFoundError) {
    message = error.message
    code = error.code
  } else if (error instanceof McpError) {
    message = error.message
    code = error.code
  } else if (error instanceof Error) {
    message = error.message
    code = 'INTERNAL_ERROR'
  } else {
    message = String(error)
    code = 'UNKNOWN_ERROR'
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: true,
            code,
            message,
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const server = createServer()
  const transport = new StdioServerTransport()

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await server.close()
    process.exit(0)
  })

  // Connect and start serving
  await server.connect(transport)

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error(`${MCP_SERVER_NAME} v${MCP_SERVER_VERSION} running on stdio`)
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

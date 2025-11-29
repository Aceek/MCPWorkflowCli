/**
 * Custom error classes for MCP Server
 */

export class McpError extends Error {
  constructor(
    public override message: string,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'McpError'
  }
}

export class ValidationError extends McpError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class GitError extends McpError {
  constructor(message: string) {
    super(message, 'GIT_ERROR')
    this.name = 'GitError'
  }
}

export class NotFoundError extends McpError {
  constructor(message: string) {
    super(message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

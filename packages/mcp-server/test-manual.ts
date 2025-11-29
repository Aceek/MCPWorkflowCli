/**
 * Manual test script for MCP Workflow Tracker
 *
 * Run with: pnpm exec tsx test-manual.ts
 */

import { spawn } from 'child_process'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: Record<string, unknown>
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

async function runTests() {
  console.log('Starting MCP server...')

  const server = spawn('tsx', ['src/index.ts'], {
    cwd: import.meta.dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  let responseBuffer = ''
  let responseResolver: ((value: JsonRpcResponse) => void) | null = null

  server.stdout.on('data', (data: Buffer) => {
    responseBuffer += data.toString()

    // Try to parse complete JSON responses
    const lines = responseBuffer.split('\n')
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line) as JsonRpcResponse
          if (responseResolver) {
            responseResolver(response)
            responseResolver = null
          }
        } catch {
          // Not complete JSON yet
        }
      }
    }
  })

  server.stderr.on('data', (data: Buffer) => {
    console.error('Server log:', data.toString())
  })

  function sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    return new Promise((resolve) => {
      responseResolver = resolve
      responseBuffer = ''
      server.stdin.write(JSON.stringify(request) + '\n')
    })
  }

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000))

  console.log('\n--- Test 1: Initialize connection ---')
  const initResponse = await sendRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  })
  console.log('Initialize response:', JSON.stringify(initResponse, null, 2))

  console.log('\n--- Test 2: List tools ---')
  const listResponse = await sendRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
  })
  console.log('Tools:', JSON.stringify(listResponse, null, 2))

  console.log('\n--- Test 3: Start workflow ---')
  const workflowResponse = await sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'start_workflow',
      arguments: {
        name: 'Test Workflow',
        description: 'A test workflow for manual testing',
        plan: [
          { step: '1', goal: 'Setup project' },
          { step: '2', goal: 'Implement features' },
        ],
      },
    },
  })
  console.log('Workflow response:', JSON.stringify(workflowResponse, null, 2))

  // Extract workflow_id from response
  let workflowId: string | undefined
  if (workflowResponse.result) {
    const content = (workflowResponse.result as { content: Array<{ text: string }> })
      .content[0]?.text
    if (content) {
      const parsed = JSON.parse(content)
      workflowId = parsed.workflow_id
      console.log('Created workflow ID:', workflowId)
    }
  }

  if (workflowId) {
    console.log('\n--- Test 4: Start task ---')
    const taskResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'start_task',
        arguments: {
          workflow_id: workflowId,
          name: 'Test Task',
          goal: 'Test the task creation functionality',
          areas: ['test', 'mcp'],
        },
      },
    })
    console.log('Task response:', JSON.stringify(taskResponse, null, 2))

    // Extract task_id
    let taskId: string | undefined
    if (taskResponse.result) {
      const content = (taskResponse.result as { content: Array<{ text: string }> })
        .content[0]?.text
      if (content) {
        const parsed = JSON.parse(content)
        taskId = parsed.task_id
        console.log('Created task ID:', taskId)
      }
    }

    if (taskId) {
      console.log('\n--- Test 5: Log milestone ---')
      const milestoneResponse = await sendRequest({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'log_milestone',
          arguments: {
            task_id: taskId,
            message: 'Running tests...',
            progress: 50,
          },
        },
      })
      console.log('Milestone response:', JSON.stringify(milestoneResponse, null, 2))

      console.log('\n--- Test 6: Complete task ---')
      const completeResponse = await sendRequest({
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'complete_task',
          arguments: {
            task_id: taskId,
            status: 'success',
            outcome: {
              summary: 'Test task completed successfully',
              achievements: ['Created workflow', 'Created task', 'Logged milestone'],
              limitations: [],
            },
            metadata: {
              tests_status: 'passed',
            },
          },
        },
      })
      console.log('Complete response:', JSON.stringify(completeResponse, null, 2))
    }
  }

  console.log('\n--- Tests complete ---')
  server.kill()
  process.exit(0)
}

runTests().catch((error) => {
  console.error('Test error:', error)
  process.exit(1)
})

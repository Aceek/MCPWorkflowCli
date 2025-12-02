'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { createLogger } from '@/lib/logger'

const logger = createLogger('workflow-error-boundary')

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function WorkflowError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('Workflow page error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  // Check if it's a "not found" type error
  const isNotFound =
    error.message.includes('not found') ||
    error.message.includes('does not exist')

  if (isNotFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl">📋</div>
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
          Workflow Not Found
        </h1>
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
          This workflow doesn&apos;t exist or has been deleted.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Back to Workflows
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-6xl">⚠️</div>
      <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
        Error Loading Workflow
      </h1>
      <p className="mb-2 text-lg text-gray-600 dark:text-gray-400">
        Failed to load workflow details.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-sm text-gray-500">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Back to Workflows
        </Link>
      </div>
    </div>
  )
}

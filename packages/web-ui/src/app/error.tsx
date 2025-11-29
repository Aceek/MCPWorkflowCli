'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-6xl">⚠️</div>
      <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="mb-2 text-lg text-gray-600 dark:text-gray-400">
        An unexpected error occurred while loading this page.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-sm text-gray-500 dark:text-gray-500">
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
        <a
          href="/"
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Back to home
        </a>
      </div>
    </div>
  )
}

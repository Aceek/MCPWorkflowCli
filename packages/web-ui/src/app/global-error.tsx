'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error boundary for root layout errors.
 * This catches errors that occur in the root layout itself.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="mb-4 text-6xl">💥</div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Critical Error
          </h1>
          <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
            A critical error occurred in the application. Please try refreshing
            the page.
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-xs text-gray-400 dark:text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  )
}

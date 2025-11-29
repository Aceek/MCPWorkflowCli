import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-6xl">🔍</div>
      <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
        404
      </h1>
      <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
        Page not found
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

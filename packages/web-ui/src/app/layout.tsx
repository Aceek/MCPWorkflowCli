import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCP Workflow Tracker',
  description: 'Observability for agentic workflows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased dark:bg-gray-900">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                MCP Workflow Tracker
              </h1>
            </Link>
            <nav className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Docs
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 py-6 dark:border-gray-800">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            MCP Workflow Tracker — Observability for agentic workflows
          </div>
        </footer>
      </body>
    </html>
  )
}

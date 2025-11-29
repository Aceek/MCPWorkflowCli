import type { Metadata } from 'next'
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
      <body className="min-h-screen antialiased">
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <h1 className="text-xl font-semibold">MCP Workflow Tracker</h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  )
}

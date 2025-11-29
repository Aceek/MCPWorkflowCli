import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, Github, BookOpen } from 'lucide-react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Tooltip } from '@/components/ui/tooltip'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCP Workflow Tracker',
  description: 'Observability for agentic workflows - Track intentions, decisions, and code changes',
  keywords: ['MCP', 'workflow', 'tracker', 'agent', 'AI', 'observability'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/0.95] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))/0.6]">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                  href="/"
                  className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--info))] text-white shadow-[var(--shadow-sm)]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-[hsl(var(--foreground))]">
                      MCP Workflow Tracker
                    </span>
                    <span className="hidden text-xs text-[hsl(var(--muted-foreground))] sm:block">
                      Observability for agentic workflows
                    </span>
                  </div>
                </Link>

                <nav className="flex items-center gap-1">
                  <Tooltip content="Documentation">
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="sr-only">Documentation</span>
                    </a>
                  </Tooltip>
                  <Tooltip content="GitHub">
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                    >
                      <Github className="h-4 w-4" />
                      <span className="sr-only">GitHub</span>
                    </a>
                  </Tooltip>
                  <div className="mx-1 h-4 w-px bg-[hsl(var(--border))]" />
                  <ThemeToggle />
                </nav>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1">
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    MCP Workflow Tracker — Observability for agentic workflows
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-[hsl(var(--foreground))]"
                    >
                      GitHub
                    </a>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-[hsl(var(--foreground))]"
                    >
                      Documentation
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

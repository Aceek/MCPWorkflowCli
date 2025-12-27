import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export interface HealthCheckResult {
  ok: boolean
  database: boolean
  tables: boolean
  error?: string
  suggestion?: string
}

/**
 * Check database health and provide actionable error messages
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    ok: false,
    database: false,
    tables: false,
  }

  try {
    // Test 1: Can we connect to the database?
    await prisma.$queryRaw`SELECT 1`
    result.database = true

    // Test 2: Do required tables exist?
    await prisma.workflow.count()
    await prisma.task.count()
    result.tables = true

    result.ok = true
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('no such table') || message.includes('does not exist')) {
      result.database = true // DB exists but tables missing
      result.error = 'Database tables are missing'
      result.suggestion = 'Run: pnpm db:migrate'
    } else if (message.includes('unable to open database') || message.includes('ENOENT')) {
      result.error = 'Database file not found or inaccessible'
      result.suggestion = `Check DATABASE_URL environment variable. Current: ${process.env.DATABASE_URL || 'not set'}`
    } else if (message.includes('SQLITE_CANTOPEN')) {
      result.error = 'Cannot open database file'
      result.suggestion = 'Check file permissions and path validity'
    } else {
      result.error = message
      result.suggestion = 'Run: ./scripts/verify-setup.sh for diagnostics'
    }

    return result
  }
}

/**
 * Verify database is ready, throw with helpful message if not
 */
export async function ensureDatabaseReady(): Promise<void> {
  const health = await checkDatabaseHealth()

  if (!health.ok) {
    const lines = [
      '╔══════════════════════════════════════════════════════════════╗',
      '║  DATABASE ERROR                                              ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      `Error: ${health.error}`,
      '',
    ]

    if (health.suggestion) {
      lines.push(`Fix: ${health.suggestion}`)
      lines.push('')
    }

    lines.push('For full diagnostics: ./scripts/verify-setup.sh')

    throw new Error(lines.join('\n'))
  }
}

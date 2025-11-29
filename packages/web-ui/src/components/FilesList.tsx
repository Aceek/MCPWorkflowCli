'use client'

import { motion } from 'framer-motion'
import { FilePlus, FileEdit, FileX, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilesListProps {
  added: string[]
  modified: string[]
  deleted: string[]
}

export function FilesList({ added, modified, deleted }: FilesListProps) {
  const total = added.length + modified.length + deleted.length

  const files = [
    ...added.map((file) => ({ file, type: 'added' as const })),
    ...modified.map((file) => ({ file, type: 'modified' as const })),
    ...deleted.map((file) => ({ file, type: 'deleted' as const })),
  ]

  const typeConfig = {
    added: {
      icon: FilePlus,
      label: 'A',
      className: 'text-[hsl(var(--success))]',
      bgClassName: 'bg-[hsl(var(--success)/0.1)]',
    },
    modified: {
      icon: FileEdit,
      label: 'M',
      className: 'text-[hsl(var(--warning))]',
      bgClassName: 'bg-[hsl(var(--warning)/0.1)]',
    },
    deleted: {
      icon: FileX,
      label: 'D',
      className: 'text-[hsl(var(--destructive))]',
      bgClassName: 'bg-[hsl(var(--destructive)/0.1)]',
    },
  }

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        <FileCode className="h-3.5 w-3.5" />
        Files Changed ({total})
      </h4>

      <div className="file-list-terminal">
        <div className="space-y-1">
          {files.map(({ file, type }, index) => {
            const config = typeConfig[type]
            const Icon = config.icon

            return (
              <motion.div
                key={`${type}-${file}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="flex items-center gap-2 group"
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded text-xs font-bold',
                    config.bgClassName,
                    config.className
                  )}
                >
                  {config.label}
                </span>
                <span
                  className={cn(
                    'flex-1 truncate',
                    config.className,
                    type === 'deleted' && 'line-through opacity-70'
                  )}
                >
                  {file}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

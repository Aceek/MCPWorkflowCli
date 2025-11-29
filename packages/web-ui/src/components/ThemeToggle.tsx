'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm">
        <div className="h-4 w-4" />
      </Button>
    )
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />
    }
    if (resolvedTheme === 'dark') {
      return <Moon className="h-4 w-4" />
    }
    return <Sun className="h-4 w-4" />
  }

  const getLabel = () => {
    if (theme === 'system') return 'System theme'
    if (theme === 'dark') return 'Dark theme'
    return 'Light theme'
  }

  return (
    <Tooltip content={getLabel()}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={cycleTheme}
        className="relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ opacity: 0, rotate: -90, scale: 0 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0 }}
            transition={{ duration: 0.15 }}
          >
            {getIcon()}
          </motion.div>
        </AnimatePresence>
        <span className="sr-only">{getLabel()}</span>
      </Button>
    </Tooltip>
  )
}

// Alternative dropdown version
export function ThemeDropdown() {
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm">
        <div className="h-4 w-4" />
      </Button>
    )
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const currentTheme = themes.find((t) => t.value === theme) || themes[2]!
  const CurrentIcon = currentTheme!.icon

  return (
    <div className="relative">
      <Tooltip content="Change theme">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-1 shadow-[var(--shadow-lg)]"
            >
              {themes.map((t) => {
                const Icon = t.icon
                const isActive = theme === t.value

                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      setTheme(t.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                        : 'text-[hsl(var(--popover-foreground))] hover:bg-[hsl(var(--accent))]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

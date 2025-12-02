'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

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

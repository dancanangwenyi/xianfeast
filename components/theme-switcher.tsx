"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/lib/theme"

function ThemeSwitcherInner() {
  const { theme, setTheme } = useTheme()

  const themes = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Clean and bright interface"
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Classic dark theme"
    },
    {
      value: "dark-blue" as const,
      label: "Dark Blue",
      icon: Monitor,
      description: "Deep blue dark theme"
    }
  ]

  const currentTheme = themes.find(t => t.value === theme)
  const Icon = currentTheme?.icon || Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <div className="flex items-center space-x-2">
                <ThemeIcon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{themeOption.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {themeOption.description}
                  </div>
                </div>
              </div>
              {theme === themeOption.value && (
                <Check className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
        disabled
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Theme switcher</span>
      </Button>
    )
  }

  try {
    return <ThemeSwitcherInner />
  } catch (error) {
    // Fallback if theme context is not available
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
        disabled
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Theme switcher unavailable</span>
      </Button>
    )
  }
}
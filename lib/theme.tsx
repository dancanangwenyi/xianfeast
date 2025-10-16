"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "dark-blue"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem("xianfeast-theme") as Theme
    if (savedTheme && ["light", "dark", "dark-blue"].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Save theme to localStorage
    localStorage.setItem("xianfeast-theme", theme)

    // Apply theme to document
    const root = document.documentElement
    root.classList.remove("light", "dark", "dark-blue")
    root.classList.add(theme)

    // Update CSS custom properties based on theme
    if (theme === "light") {
      root.style.setProperty("--color-background", "#ffffff")
      root.style.setProperty("--color-foreground", "#0f172a")
      root.style.setProperty("--color-muted", "#f8fafc")
      root.style.setProperty("--color-muted-foreground", "#475569")
      root.style.setProperty("--color-border", "#e2e8f0")
      root.style.setProperty("--color-input", "#ffffff")
      root.style.setProperty("--color-ring", "#dc2626")
      root.style.setProperty("--color-primary", "#dc2626")
      root.style.setProperty("--color-primary-foreground", "#ffffff")
      root.style.setProperty("--color-secondary", "#f1f5f9")
      root.style.setProperty("--color-secondary-foreground", "#1e293b")
      root.style.setProperty("--color-destructive", "#dc2626")
      root.style.setProperty("--color-destructive-foreground", "#ffffff")
      root.style.setProperty("--color-card", "#ffffff")
      root.style.setProperty("--color-card-foreground", "#0f172a")
      root.style.setProperty("--color-popover", "#ffffff")
      root.style.setProperty("--color-popover-foreground", "#0f172a")
      root.style.setProperty("--color-accent", "#fef2f2")
      root.style.setProperty("--color-accent-foreground", "#991b1b")
    } else if (theme === "dark") {
      root.style.setProperty("--color-background", "#0f172a")
      root.style.setProperty("--color-foreground", "#f8fafc")
      root.style.setProperty("--color-muted", "#1e293b")
      root.style.setProperty("--color-muted-foreground", "#94a3b8")
      root.style.setProperty("--color-border", "#334155")
      root.style.setProperty("--color-input", "#1e293b")
      root.style.setProperty("--color-ring", "#f87171")
      root.style.setProperty("--color-primary", "#f87171")
      root.style.setProperty("--color-primary-foreground", "#0f172a")
      root.style.setProperty("--color-secondary", "#1e293b")
      root.style.setProperty("--color-secondary-foreground", "#f8fafc")
      root.style.setProperty("--color-destructive", "#f87171")
      root.style.setProperty("--color-destructive-foreground", "#0f172a")
      root.style.setProperty("--color-card", "#1e293b")
      root.style.setProperty("--color-card-foreground", "#f8fafc")
      root.style.setProperty("--color-popover", "#1e293b")
      root.style.setProperty("--color-popover-foreground", "#f8fafc")
      root.style.setProperty("--color-accent", "#2d1b1b")
      root.style.setProperty("--color-accent-foreground", "#fca5a5")
    } else if (theme === "dark-blue") {
      root.style.setProperty("--color-background", "#0c1220")
      root.style.setProperty("--color-foreground", "#e2e8f0")
      root.style.setProperty("--color-muted", "#1e293b")
      root.style.setProperty("--color-muted-foreground", "#94a3b8")
      root.style.setProperty("--color-border", "#334155")
      root.style.setProperty("--color-input", "#1e293b")
      root.style.setProperty("--color-ring", "#60a5fa")
      root.style.setProperty("--color-primary", "#60a5fa")
      root.style.setProperty("--color-primary-foreground", "#0c1220")
      root.style.setProperty("--color-secondary", "#1e293b")
      root.style.setProperty("--color-secondary-foreground", "#e2e8f0")
      root.style.setProperty("--color-destructive", "#f87171")
      root.style.setProperty("--color-destructive-foreground", "#0c1220")
      root.style.setProperty("--color-card", "#1e293b")
      root.style.setProperty("--color-card-foreground", "#e2e8f0")
      root.style.setProperty("--color-popover", "#1e293b")
      root.style.setProperty("--color-popover-foreground", "#e2e8f0")
      root.style.setProperty("--color-accent", "#1e3a8a")
      root.style.setProperty("--color-accent-foreground", "#93c5fd")
    }
  }, [theme, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

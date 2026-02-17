"use client"

import type React from "react"

import { useEffect } from "react"
import { useThemeStore, useAuthStore } from "@/lib/store"

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore()
  const { checkSession, isHydrated } = useAuthStore()

  useEffect(() => {
    if (isHydrated) {
        checkSession()
    }
  }, [isHydrated, checkSession])

  useEffect(() => {
    // Apply theme on mount
    const savedTheme = localStorage.getItem("theme-storage")
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        if (parsed.state?.theme) {
          setTheme(parsed.state.theme)
        }
      } catch {
        // Use system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(prefersDark ? "dark" : "light")
      }
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
    }
  }, [setTheme])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  return (
    <>
      {children}
    </>
  )
}

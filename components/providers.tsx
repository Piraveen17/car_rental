"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { useThemeStore, useAuthStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore()
  const { checkSession, isHydrated } = useAuthStore()
  const initialized = useRef(false)

  // Theme init on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme-storage")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.state?.theme) { setTheme(parsed.state.theme); return }
      }
    } catch {}
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  }, []) // eslint-disable-line

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  // Set up auth listener ONCE after hydration
  // onRehydrateStorage already calls checkSession on startup,
  // so here we only subscribe to future auth state changes
  useEffect(() => {
    if (!isHydrated || initialized.current) return
    initialized.current = true

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      // Only re-run on actual changes, not initial session restoration
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await checkSession()
      }
    })

    return () => subscription.unsubscribe()
  }, [isHydrated, checkSession])

  return <>{children}</>
}

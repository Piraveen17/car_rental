"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/notification-bell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Car, LayoutDashboard, Calendar, LogOut, Menu, X, ChevronRight, ExternalLink, Briefcase
} from "lucide-react"

const sidebarLinks = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/staff/bookings", label: "Bookings", icon: Calendar },
  { href: "/staff/cars", label: "Fleet", icon: Car },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isHydrated } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.role !== "admin" && user?.role !== "staff") {
      router.replace("/dashboard")
    }
  }, [isHydrated, isAuthenticated, user, router])

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (user?.role !== "admin" && user?.role !== "staff") return null

  const initials = user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "S"
  const roleLabel = user.role === "admin" ? "Admin" : "Staff"

  const isActive = (link: typeof sidebarLinks[0]) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href)

  const handleLogout = async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const currentLink = sidebarLinks.find(l =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href)
  )

  return (
    <div className="min-h-screen flex bg-background">
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col",
          "transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto lg:flex",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
        aria-label="Staff navigation"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 h-16 border-b shrink-0">
          <Link
            href="/staff"
            className="flex items-center gap-2.5"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold tracking-tight">DriveEase</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Staff</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Sidebar navigation">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 py-2">
            Management
          </p>
          {sidebarLinks.map((link) => {
            const active = isActive(link)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{link.label}</span>
                {!active && (
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom user section */}
        <div className="p-3 border-t space-y-2 shrink-0">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/50">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">{roleLabel}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-8"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 border-b bg-background/95 backdrop-blur-sm gap-3 shrink-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground hidden sm:inline">Staff</span>
            {currentLink && currentLink.href !== "/staff" && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                <span className="font-medium text-foreground truncate">{currentLink.label}</span>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Button variant="outline" size="sm" asChild className="flex items-center gap-1.5 px-2 sm:px-3">
              <Link href="/" rel="noopener noreferrer" aria-label="View Site">
                <ExternalLink className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="hidden sm:block">View Site</span>
              </Link>
            </Button>
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

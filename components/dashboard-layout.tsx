"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, BookOpen, Bike, FileText, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react"
import { useSession } from "@/components/auth-gate"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DashboardOverview } from "@/components/dashboard-overview"
import { UsersManagement } from "@/components/users-management"
import { BikesManagement } from "@/components/bikes-management"
import { RentalsTracking } from "@/components/rentals-tracking"
import { AlertsManagement } from "@/components/alerts-management"
import { SystemGuide } from "@/components/system-guide"
import { API_BASE_URL, apiFetch, signOut } from "@/lib/api"

interface DashboardLayoutProps {
  children?: React.ReactNode
}

type PageName = "Overview" | "Users" | "Bikes" | "Rentals" | "Alerts" | "How it works"

const groups: { label: string; items: { name: PageName; icon: LucideIcon; purpose: string }[] }[] = [
  {
    label: "Monitor",
    items: [{ name: "Overview", icon: LayoutDashboard, purpose: "Is the stand healthy right now? Live fleet, rides, alerts and RFID activity." }],
  },
  {
    label: "Manage",
    items: [
      { name: "Users", icon: Users, purpose: "Riders and their RFID cards. A card that is not listed here is refused at the stand." },
      { name: "Bikes", icon: Bike, purpose: "The fleet: add bikes, set maintenance, and see who has which bike." },
      { name: "Rentals", icon: FileText, purpose: "Every ride with rider, bike, start, end and duration." },
      { name: "Alerts", icon: AlertTriangle, purpose: "Where the RFID records and the camera disagree. Resolve them once handled." },
    ],
  },
  {
    label: "Learn",
    items: [{ name: "How it works", icon: BookOpen, purpose: "How a card tap travels from the stand to this screen, and what every status means." }],
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState<PageName>("Overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [apiUp, setApiUp] = useState<boolean | null>(null)
  const [openAlerts, setOpenAlerts] = useState(0)
  const session = useSession()

  // Light heartbeat so the shell can show connection state and the open-alert count on every page.
  const ping = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/admin/dashboard/stats`)
      if (!res.ok) throw new Error("bad status")
      const body = await res.json()
      setOpenAlerts(body?.data?.alerts?.unresolved ?? 0)
      setApiUp(true)
    } catch {
      setApiUp(false)
    }
  }, [])

  useEffect(() => {
    ping()
    const timer = setInterval(ping, 10000)
    return () => clearInterval(timer)
  }, [ping])

  const navigate = (page: string) => {
    setCurrentPage(page as PageName)
    setSidebarOpen(false)
    window.scrollTo({ top: 0 })
  }

  const meta = groups.flatMap((g) => g.items).find((i) => i.name === currentPage)

  const renderPage = () => {
    switch (currentPage) {
      case "Users":
        return <UsersManagement />
      case "Bikes":
        return <BikesManagement />
      case "Rentals":
        return <RentalsTracking />
      case "Alerts":
        return <AlertsManagement />
      case "How it works":
        return <SystemGuide />
      default:
        return <DashboardOverview onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sidebar-border p-5">
            <div className="flex items-end gap-3">
              <span className="inline-flex flex-col gap-1">
                <span className="velo-display text-[1.45rem] text-sidebar-foreground">Velo</span>
                <span className="velo-band block h-[6px] w-full" aria-hidden />
              </span>
              <span className="pb-0.5 text-xs leading-tight text-sidebar-foreground/60">
                Admin
                <br />
                Stand control room
              </span>
            </div>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto p-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = currentPage === item.name
                    return (
                      <button
                        key={item.name}
                        onClick={() => navigate(item.name)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.name === "Alerts" && openAlerts > 0 && (
                          <span className="rounded-full bg-[#E5401F] px-2 py-0.5 text-[11px] font-semibold text-white" aria-label={`${openAlerts} open alerts`}>
                            {openAlerts}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
              <span
                className={cn("h-2 w-2 rounded-full", apiUp === null ? "bg-sidebar-foreground/30" : apiUp ? "animate-pulse bg-[#6B9A00]" : "bg-[#E5401F]")}
              />
              {apiUp === null ? "Connecting to API" : apiUp ? "Connected to Velo API" : "Velo API unreachable"}
            </div>
            <p className="mt-1 text-[11px] text-sidebar-foreground/40">RFID smart cycle sharing</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="velo-wide text-xl font-extrabold uppercase leading-tight">{currentPage}</h1>
                {meta && <p className="hidden truncate text-sm text-muted-foreground sm:block">{meta.purpose}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={cn(
                  "hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex",
                  apiUp === false ? "border-[#E5401F]/40 text-[#B3301A] dark:text-[#f2866c]" : "text-muted-foreground",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", apiUp === null ? "bg-muted-foreground/40" : apiUp ? "animate-pulse bg-[#6B9A00]" : "bg-[#E5401F]")} />
                {apiUp === null ? "Connecting" : apiUp ? "Live" : "Offline"}
              </span>
              <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground md:inline" title={session?.email}>
                {session?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2 rounded-sm">
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{renderPage()}</main>
      </div>
    </div>
  )
}

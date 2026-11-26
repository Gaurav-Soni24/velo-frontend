"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Bike, FileText, AlertTriangle, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardOverview } from "@/components/dashboard-overview"
import { UsersManagement } from "@/components/users-management"
import { BikesManagement } from "@/components/bikes-management"
import { RentalsTracking } from "@/components/rentals-tracking"
import { AlertsManagement } from "@/components/alerts-management"

interface DashboardLayoutProps {
  children?: React.ReactNode
}

const navigation = [
  { name: "Overview", icon: LayoutDashboard, component: DashboardOverview },
  { name: "Users", icon: Users, component: UsersManagement },
  { name: "Bikes", icon: Bike, component: BikesManagement },
  { name: "Rentals", icon: FileText, component: RentalsTracking },
  { name: "Alerts", icon: AlertTriangle, component: AlertsManagement },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState("Overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const ActiveComponent = navigation.find((item) => item.name === currentPage)?.component || DashboardOverview

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Bike className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground text-lg">Velo Admin</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPage === item.name
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setCurrentPage(item.name)
                    setSidebarOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/50">RFID Bike Rental System</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">{currentPage}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <ActiveComponent />
        </main>
      </div>
    </div>
  )
}

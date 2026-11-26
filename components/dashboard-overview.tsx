"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Users, AlertTriangle, Activity, Radio, CheckCircle2, XCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ScanEvent {
  _id: string
  action: "rent" | "return"
  success: boolean
  message: string
  rfidTag?: string | null
  deviceId?: string | null
  createdAt: string
}

interface Device {
  _id: string
  deviceId: string
  name?: string
  location?: string
  online: boolean
  lastHeartbeat?: string | null
  lastEvent?: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const REFRESH_MS = 5000

function timeAgo(iso?: string | null) {
  if (!iso) return "never"
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  return `${Math.round(seconds / 3600)} h ago`
}

interface Stats {
  bikes: {
    total: number
    available: number
    rented: number
    maintenance: number
    missing: number
  }
  users: {
    total: number
    active: number
  }
  rentals: {
    ongoing: number
    completed: number
  }
  alerts: {
    unresolved: number
  }
}

export function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<ScanEvent[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAll(true)
    // The ground station keeps sending RFID taps, so keep the overview fresh.
    const timer = setInterval(() => fetchAll(false), REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  const fetchAll = async (initial: boolean) => {
    try {
      if (initial) setLoading(true)
      setError(null)
      const [statsRes, eventsRes, devicesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/dashboard/stats`),
        fetch(`${API_BASE_URL}/api/admin/events?limit=8`),
        fetch(`${API_BASE_URL}/api/admin/devices`),
      ])

      if (!statsRes.ok) {
        throw new Error("Failed to fetch stats. Is the Velo backend running?")
      }

      setStats((await statsRes.json()).data)
      if (eventsRes.ok) setEvents((await eventsRes.json()).data)
      if (devicesRes.ok) setDevices((await devicesRes.json()).data)
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard stats")
    } finally {
      if (initial) setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Total Bikes",
      value: stats.bikes.total,
      subtitle: `${stats.bikes.available} available`,
      icon: Bike,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Active Users",
      value: stats.users.total,
      subtitle: `${stats.users.active} active`,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Ongoing Rentals",
      value: stats.rentals.ongoing,
      subtitle: `${stats.rentals.completed} completed`,
      icon: Activity,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Unresolved Alerts",
      value: stats.alerts.unresolved,
      subtitle: "Requires attention",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bike Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bike Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="text-sm font-semibold">{stats.bikes.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rented</span>
              <span className="text-sm font-semibold">{stats.bikes.rented}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Maintenance</span>
              <span className="text-sm font-semibold">{stats.bikes.maintenance}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Missing</span>
              <span className="text-sm font-semibold text-destructive">{stats.bikes.missing}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rental Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Currently Rented</span>
              <span className="text-sm font-semibold">{stats.rentals.ongoing}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Completed</span>
              <span className="text-sm font-semibold">{stats.rentals.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.rentals.completed > 0 ? "100%" : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ground stations + live RFID activity (what the Arduino/RFID computer at the stand reports) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Ground Stations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {devices.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No ground station has connected yet. Start the ground-station program next to the stand and it will
                appear here.
              </p>
            )}
            {devices.map((d) => (
              <div key={d._id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-semibold">{d.name || d.deviceId}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.location || "Unknown location"} · last seen {timeAgo(d.lastHeartbeat)}
                  </p>
                  {d.lastEvent && <p className="text-xs text-muted-foreground mt-1">{d.lastEvent}</p>}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    d.online
                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${d.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  {d.online ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live RFID Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">No card taps yet. Taps from the stand appear here live.</p>
            )}
            {events.map((e) => (
              <div key={e._id} className="flex items-start gap-2 text-sm">
                {e.success ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="truncate">{e.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.action.toUpperCase()} · {e.rfidTag || "no card"} · {timeAgo(e.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

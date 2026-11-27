"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  Bike,
  CheckCircle2,
  CircleCheck,
  Radio,
  Timer,
  WifiOff,
  XCircle,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ALERT_TYPE_INFO, PALETTE, TONE_BADGE, TONE_BORDER, TONE_TEXT, timeAgo, type Tone } from "@/lib/status"
import { API_BASE_URL, apiFetch } from "@/lib/api"

interface Stats {
  bikes: { total: number; available: number; rented: number; maintenance: number; missing: number }
  users: { total: number; active: number }
  rentals: { ongoing: number; completed: number }
  alerts: { unresolved: number }
}

interface ScanEvent {
  _id: string
  action: "rent" | "return"
  success: boolean
  message: string
  rfidTag?: string | null
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

interface AlertItem {
  _id: string
  type: string
  message: string
  timestamp: string
  isResolved: boolean
  bikeId?: { bikeId: number; bikeName?: string } | null
}

interface Rental {
  _id: string
  startTime: string
  endTime?: string | null
  status: string
  duration?: number | null
}
const REFRESH_MS = 5000

interface OverviewProps {
  onNavigate?: (page: string) => void
}

const getJson = async <T,>(path: string): Promise<T | null> => {
  const res = await apiFetch(`${API_BASE_URL}${path}`)
  if (!res.ok) return null
  const body = await res.json()
  return (body.data ?? null) as T | null
}

export function DashboardOverview({ onNavigate }: OverviewProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<ScanEvent[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [, setTick] = useState(0)

  const load = useCallback(async (initial: boolean) => {
    try {
      if (initial) setLoading(true)
      const [s, e, d, a, r] = await Promise.all([
        getJson<Stats>("/api/admin/dashboard/stats"),
        getJson<ScanEvent[]>("/api/admin/events?limit=8").catch(() => null),
        getJson<Device[]>("/api/admin/devices").catch(() => null),
        getJson<AlertItem[]>("/api/admin/alerts?resolved=false").catch(() => null),
        getJson<Rental[]>("/api/admin/rentals").catch(() => null),
      ])
      if (!s) throw new Error("The Velo API answered, but not with dashboard stats.")
      setStats(s)
      setEvents(e ?? [])
      setDevices(d ?? [])
      setAlerts((a ?? []).filter((x) => !x.isResolved))
      setRentals(r ?? [])
      setError(null)
      setRefreshedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the dashboard")
    } finally {
      if (initial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(true)
    const refresh = setInterval(() => load(false), REFRESH_MS)
    const clock = setInterval(() => setTick((t) => t + 1), 1000) // keeps "x s ago" labels honest
    return () => {
      clearInterval(refresh)
      clearInterval(clock)
    }
  }, [load])

  // Rides started per hour, last 12 hours.
  const ridesByHour = useMemo(() => {
    const now = new Date()
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now)
      start.setMinutes(0, 0, 0)
      start.setHours(start.getHours() - (11 - i))
      return { start: start.getTime(), label: start.toLocaleTimeString([], { hour: "numeric" }), rides: 0 }
    })
    rentals.forEach((r) => {
      const t = new Date(r.startTime).getTime()
      const b = [...buckets].reverse().find((x) => t >= x.start)
      if (b && t <= now.getTime()) b.rides += 1
    })
    return buckets
  }, [rentals])
  const ridesLast12h = ridesByHour.reduce((sum, b) => sum + b.rides, 0)

  const avgRideMin = useMemo(() => {
    const done = rentals.filter((r) => r.status === "completed")
    if (!done.length) return null
    const total = done.reduce((sum, r) => {
      if (r.duration != null) return sum + r.duration
      if (r.endTime) return sum + Math.max(1, Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000))
      return sum
    }, 0)
    return Math.round(total / done.length)
  }, [rentals])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <Skeleton className="h-72 lg:col-span-3" />
          <Skeleton className="h-72 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card className="border-[#E5401F]/40 bg-[#E5401F]/[0.06]">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2 font-semibold text-[#B3301A] dark:text-[#f2866c]">
            <WifiOff className="h-5 w-5" />
            Cannot reach the Velo API
          </div>
          <p className="text-sm text-muted-foreground">
            {error} The dashboard is looking for the API at <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{API_BASE_URL}</code>.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Start the backend: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run dev:memory</code> in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">velo-backend</code>
            </li>
            <li>
              Make sure <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_API_BASE_URL</code> points at it, then reload.
            </li>
          </ol>
          <button onClick={() => onNavigate?.("How it works")} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            See how the pieces fit together
          </button>
        </CardContent>
      </Card>
    )
  }

  const { bikes, rentals: rentalStats } = stats
  const station = devices[0]
  const pctReady = bikes.total ? Math.round((bikes.available / bikes.total) * 100) : 0
  const pctInUse = bikes.total ? Math.round((bikes.rented / bikes.total) * 100) : 0
  const openAlerts = alerts.length || stats.alerts.unresolved

  const stationTone: Tone = !station ? "muted" : station.online ? "good" : "bad"
  const alertTone: Tone = openAlerts > 0 ? "bad" : "good"
  const readyTone: Tone = bikes.available === 0 ? "bad" : bikes.available === 1 ? "warn" : "good"

  const banner: { tone: Tone; icon: LucideIcon; title: string; text: string } =
    openAlerts > 0
      ? {
          tone: "bad",
          icon: AlertTriangle,
          title: `${openAlerts} alert${openAlerts > 1 ? "s" : ""} need${openAlerts > 1 ? "" : "s"} attention`,
          text: "The camera and RFID records disagree. Review them below.",
        }
      : station && !station.online
        ? {
            tone: "warn",
            icon: WifiOff,
            title: "The ground station is offline",
            text: "No heartbeat has arrived recently. Taps and camera checks are not reaching the cloud.",
          }
        : {
            tone: "good",
            icon: CircleCheck,
            title: "All systems normal",
            text: devices.length ? "The stand is online and no alerts are open." : "No alerts are open. Start a ground station to see live taps here.",
          }

  const fleetSegments = [
    { key: "available", label: "Available", value: bikes.available, color: PALETTE.good },
    { key: "rented", label: "Rented", value: bikes.rented, color: PALETTE.info },
    { key: "maintenance", label: "Maintenance", value: bikes.maintenance, color: PALETTE.warn },
    { key: "missing", label: "Missing", value: bikes.missing, color: PALETTE.bad },
  ]
  const fleetInsight =
    bikes.total === 0
      ? "No bikes are registered yet"
      : bikes.missing > 0
        ? `${bikes.missing} of ${bikes.total} bikes are missing`
        : bikes.rented === 0
          ? `All ${bikes.total} bikes are at the stand`
          : `${bikes.rented} of ${bikes.total} bikes are out on rides`

  return (
    <div className="space-y-6">
      {/* Status banner: the 5-second answer */}
      <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 ${TONE_BORDER[banner.tone]}`}>
        <banner.icon className={`mt-0.5 h-5 w-5 shrink-0 ${TONE_TEXT[banner.tone]}`} />
        <div className="min-w-0">
          <p className={`font-semibold ${TONE_TEXT[banner.tone]}`}>{banner.title}</p>
          <p className="text-sm text-muted-foreground">{banner.text}</p>
        </div>
        {openAlerts > 0 && (
          <button onClick={() => onNavigate?.("Alerts")} className="ml-auto shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Review alerts
          </button>
        )}
      </div>

      {/* Level 1: headline KPIs, each with a comparison */}
      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={Bike}
          title="Bikes ready to rent"
          value={String(bikes.available)}
          unit={`of ${bikes.total}`}
          note={`${pctReady}% of the fleet is at the stand and available`}
          tone={readyTone}
          bar={pctReady}
        />
        <Kpi
          icon={Activity}
          title="Rides in progress"
          value={String(rentalStats.ongoing)}
          note={`${rentalStats.completed} completed so far${avgRideMin ? ` · average ride ${avgRideMin} min` : ""}`}
          tone="info"
          bar={pctInUse}
        />
        <Kpi
          icon={AlertTriangle}
          title="Open alerts"
          value={String(openAlerts)}
          note={openAlerts > 0 ? `${bikes.missing} bike${bikes.missing === 1 ? "" : "s"} marked missing` : "RFID and camera records agree"}
          tone={alertTone}
        />
        <Kpi
          icon={Radio}
          title="Ground station"
          value={!station ? "None" : station.online ? "Online" : "Offline"}
          note={station ? `Last heartbeat ${timeAgo(station.lastHeartbeat)}` : "No station has connected yet"}
          tone={stationTone}
        />
      </section>

      {/* Level 2: primary context */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{fleetInsight}</CardTitle>
            <p className="text-sm text-muted-foreground">Fleet status right now</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              className="flex h-5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={fleetSegments.map((s) => `${s.value} ${s.label}`).join(", ")}
            >
              {fleetSegments.map((s) =>
                s.value > 0 ? (
                  <div key={s.key} style={{ width: `${(s.value / Math.max(bikes.total, 1)) * 100}%`, backgroundColor: s.color }} title={`${s.label}: ${s.value}`} />
                ) : null,
              )}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {fleetSegments.map((s) => (
                <li key={s.key} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {s.value}
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({bikes.total ? Math.round((s.value / bikes.total) * 100) : 0}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              A bike becomes <strong>Rented</strong> when its rider taps the RFID card, and <strong>Missing</strong> when the camera cannot find it at the stand.{" "}
              <button onClick={() => onNavigate?.("How it works")} className="font-medium text-primary underline-offset-4 hover:underline">
                How statuses work
              </button>
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {ridesLast12h === 0 ? "No rides started in the last 12 hours" : `${ridesLast12h} ride${ridesLast12h > 1 ? "s" : ""} started in the last 12 hours`}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Rides per hour</p>
          </CardHeader>
          <CardContent>
            {ridesLast12h === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
                <Timer className="h-6 w-6 text-muted-foreground" />
                <p className="max-w-[16rem] text-sm text-muted-foreground">
                  Rides appear here once a rider taps a card. Run the ground-station simulator to try it.
                </p>
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ridesByHour} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={1} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => [`${v} ride${v === 1 ? "" : "s"}`, "Started"]} />
                    <Bar dataKey="rides" fill={PALETTE.info} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Level 3: what needs attention + live detail */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-[#6B9A00]/10 p-3 text-sm text-[#3F5A00] dark:text-[#5fd6c8]">
                <CheckCircle2 className="h-4 w-4" /> Nothing to review. RFID and camera records agree.
              </div>
            )}
            {alerts.slice(0, 4).map((a) => {
              const info = ALERT_TYPE_INFO[a.type] ?? ALERT_TYPE_INFO.other
              return (
                <div key={a._id} className={`rounded-lg border p-3 ${TONE_BORDER[info.tone]}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE[info.tone]}`}>{info.label}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(a.timestamp)}</span>
                  </div>
                  <p className="mt-1.5 text-sm">{a.message}</p>
                </div>
              )
            })}
            {alerts.length > 4 && (
              <button onClick={() => onNavigate?.("Alerts")} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                View all {alerts.length} alerts
              </button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Live RFID activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">No card taps yet. When a rider taps at the stand, it shows up here within seconds.</p>
            )}
            {events.map((e) => (
              <div key={e._id} className="flex items-start gap-2 text-sm">
                {e.success ? (
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${TONE_TEXT.good}`} />
                ) : (
                  <XCircle className={`mt-0.5 h-4 w-4 shrink-0 ${TONE_TEXT.bad}`} />
                )}
                <div className="min-w-0">
                  <p className="truncate">{e.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.action === "rent" ? "Rent" : "Return"} · {e.rfidTag || "no card"} · {timeAgo(e.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4 text-muted-foreground" />
              Ground stations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {devices.length === 0 && (
              <p className="text-sm text-muted-foreground">
                None connected yet. The ground station is the small program next to the stand that forwards taps and camera checks to the cloud.
              </p>
            )}
            {devices.map((d) => (
              <div key={d._id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{d.name || d.deviceId}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.location || "Unknown location"} · seen {timeAgo(d.lastHeartbeat)}
                  </p>
                  {d.lastEvent && <p className="mt-1 truncate text-xs text-muted-foreground">{d.lastEvent}</p>}
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_BADGE[d.online ? "good" : "bad"]}`}>
                  <span className={`h-2 w-2 rounded-full ${d.online ? "animate-pulse bg-[#6B9A00]" : "bg-[#E5401F]"}`} />
                  {d.online ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Footer: source and freshness */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
        <span>
          Source: Velo cloud API (<code>{API_BASE_URL}</code>). Fleet counts are live; ride history comes from the rentals list.
        </span>
        <span>
          Refreshed {refreshedAt ? refreshedAt.toLocaleTimeString() : "never"} · updates every {REFRESH_MS / 1000} s
        </span>
      </footer>
    </div>
  )
}

function Kpi({
  icon: Icon,
  title,
  value,
  unit,
  note,
  tone,
  bar,
}: {
  icon: LucideIcon
  title: string
  value: string
  unit?: string
  note: string
  tone: Tone
  bar?: number
}) {
  return (
    <Card className={TONE_BORDER[tone]}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONE_BADGE[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`velo-wide text-4xl font-extrabold tabular-nums ${TONE_TEXT[tone]}`}>{value}</span>
          {unit && <span className="text-base text-muted-foreground">{unit}</span>}
        </div>
        {bar !== undefined && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${Math.min(bar, 100)}%`, backgroundColor: PALETTE[tone] }} />
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

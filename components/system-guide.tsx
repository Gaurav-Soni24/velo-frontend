"use client"

import type { LucideIcon } from "lucide-react"
import { AlertTriangle, ArrowDown, ArrowRight, Bike, Camera, CreditCard, Database, FileText, Laptop, LayoutDashboard, Server, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ALERT_TYPE_INFO, BIKE_STATUS_TONE, TONE_BADGE } from "@/lib/status"

const FLOW: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: CreditCard, title: "Rider taps a card", text: "An RFID reader wired to an Arduino reads the card and prints its ID over USB." },
  { icon: Laptop, title: "Ground station forwards it", text: "A small program on the stand's computer sends the tap to the cloud over the internet, with a secret device key." },
  { icon: Server, title: "Cloud API decides", text: "It finds the rider and either rents the first free bike or closes their ride. Two riders can never get the same bike." },
  { icon: Database, title: "Database remembers", text: "Rentals, bike status, alerts and every tap (even refused ones) are stored." },
  { icon: LayoutDashboard, title: "You are here", text: "This dashboard reads the same database, so you see taps, rentals and alerts within seconds." },
]

const PAGES: { icon: LucideIcon; name: string; text: string }[] = [
  { icon: LayoutDashboard, name: "Overview", text: "The 5-second answer: is everything fine, how many bikes are free, what needs attention, and is the stand online." },
  { icon: Users, name: "Users", text: "Riders and their RFID cards. A card that is not listed here is refused at the stand. Disable a rider to block their card." },
  { icon: Bike, name: "Bikes", text: "The fleet. Add bikes, put one in maintenance, and see who has which bike and when the camera last saw it." },
  { icon: FileText, name: "Rentals", text: "Every ride with rider, bike, start, end and duration." },
  { icon: AlertTriangle, name: "Alerts", text: "Places where RFID records and the camera disagree, plus manual alerts. Resolve them once handled." },
]

const STATUS_MEANING: Record<string, string> = {
  available: "At the stand and ready to rent.",
  rented: "With a rider. Set when the rider taps their card, cleared when they tap again to return.",
  maintenance: "Taken out of service by an admin. Never handed out.",
  missing: "Should be at the stand, but the camera has not seen it for 10+ minutes. Recovers by itself when it is seen again.",
}

const CODE = `# in the velo-backend folder
npm run dev:memory          # API with demo riders and bikes
npm run ground-station      # second terminal, then type:
tap 04A1B2C3                # Aarav rents a bike
tap 04A1B2C3                # (a moment later) returns it
camera 2,3                  # camera reports which bikes it sees`

const TROUBLE = [
  ["The Overview says “Cannot reach the Velo API”", "The backend is not running, or NEXT_PUBLIC_API_BASE_URL points at the wrong address."],
  ["Ground station shows Offline", "No heartbeat for 90 seconds: check the ground-station program, its internet connection and its device key."],
  ["Taps do not appear in the live feed", "The ground station is not reaching the API (check the device key), or the card tap was ignored as a repeat within 3 seconds."],
  ["A tap says “User not found”", "The card is not assigned to a rider yet. Add it on the Users page."],
  ["A bike shows Missing but it is parked", "The camera did not report it. Once the camera sees it, it returns to Available on its own."],
]

export function SystemGuide() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">How Velo works, in one minute</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Velo lets riders rent a bike by tapping an RFID card. The hardware stays at the stand; everything that has to be shared or remembered lives in the cloud. This dashboard is
          the control room on top.
        </p>
      </section>

      {/* Flow */}
      <section aria-label="The flow">
        <div className="grid gap-3 lg:grid-cols-5">
          {FLOW.map((step, i) => (
            <div key={step.title} className="relative">
              <Card className={`h-full ${i === FLOW.length - 1 ? "border-primary" : ""}`}>
                <CardContent className="pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <step.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                </CardContent>
              </Card>
              {i < FLOW.length - 1 && (
                <>
                  <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground lg:block" />
                  <ArrowDown className="mx-auto my-1 h-4 w-4 text-muted-foreground lg:hidden" />
                </>
              )}
            </div>
          ))}
        </div>
        <Card className="mt-4">
          <CardContent className="flex items-start gap-3 pt-5">
            <Camera className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">The camera is the second source of truth.</strong> RFID records what the system believes. A camera at the stand reports which bikes
              are physically there. When they disagree, an alert is raised, for example a bike that is &quot;available&quot; but not seen, or a bike that is &quot;rented&quot; but parked at the stand.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Pages */}
      <section>
        <h3 className="mb-3 text-lg font-semibold">What each page is for</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {PAGES.map((p) => (
            <div key={p.name} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <p.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Glossary */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bike statuses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(STATUS_MEANING).map(([key, text]) => (
              <div key={key} className="flex items-start gap-3">
                <span className={`mt-0.5 w-28 shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-medium capitalize ${TONE_BADGE[BIKE_STATUS_TONE[key]]}`}>{key}</span>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alert types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(ALERT_TYPE_INFO).map((a) => (
              <div key={a.label} className="flex items-start gap-3">
                <span className={`mt-0.5 w-40 shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-medium ${TONE_BADGE[a.tone]}`}>{a.label}</span>
                <p className="text-sm text-muted-foreground">{a.meaning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Try it */}
      <section>
        <h3 className="mb-3 text-lg font-semibold">Try it yourself</h3>
        <p className="mb-3 text-sm text-muted-foreground">No Arduino needed. Run the backend with demo data and tap cards from the terminal, then watch the Overview update.</p>
        <pre className="overflow-x-auto rounded-xl bg-[oklch(0.16_0_0)] p-4 text-xs leading-relaxed text-[oklch(0.92_0_0)]">{CODE}</pre>
      </section>

      {/* Troubleshooting */}
      <section>
        <h3 className="mb-3 text-lg font-semibold">If something looks wrong</h3>
        <div className="divide-y rounded-xl border bg-card">
          {TROUBLE.map(([problem, fix]) => (
            <div key={problem} className="grid gap-1 p-4 md:grid-cols-[1fr_1.4fr] md:gap-6">
              <p className="text-sm font-medium">{problem}</p>
              <p className="text-sm text-muted-foreground">{fix}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

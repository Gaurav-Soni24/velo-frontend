/**
 * One colour language for the whole dashboard (Velo "Timing Chip" palette).
 *   green  = good / available / online
 *   blue   = primary data / in use (Velo Blue)
 *   amber  = caution / needs a look
 *   red    = problem / missing / offline
 *   grey   = context
 * Text colours are darkened so they keep a 4.5:1 contrast on their tinted backgrounds.
 */
export const PALETTE = {
  good: "#6B9A00",
  info: "#2440F0",
  warn: "#C77700",
  bad: "#E5401F",
  muted: "#8a8f98",
} as const

export type Tone = "good" | "info" | "warn" | "bad" | "muted"

export const TONE_BADGE: Record<Tone, string> = {
  good: "bg-[#6B9A00]/10 text-[#3F5A00] dark:bg-[#6B9A00]/20 dark:text-[#5fd6c8]",
  info: "bg-[#2440F0]/10 text-[#1A2FB8] dark:bg-[#2440F0]/20 dark:text-[#6fb8ee]",
  warn: "bg-[#C77700]/12 text-[#8A5A00] dark:bg-[#C77700]/20 dark:text-[#f5a06b]",
  bad: "bg-[#E5401F]/10 text-[#B3301A] dark:bg-[#E5401F]/20 dark:text-[#f2866c]",
  muted: "bg-muted text-muted-foreground",
}

export const TONE_TEXT: Record<Tone, string> = {
  good: "text-[#3F5A00] dark:text-[#5fd6c8]",
  info: "text-[#1A2FB8] dark:text-[#6fb8ee]",
  warn: "text-[#8A5A00] dark:text-[#f5a06b]",
  bad: "text-[#B3301A] dark:text-[#f2866c]",
  muted: "text-muted-foreground",
}

export const TONE_BORDER: Record<Tone, string> = {
  good: "border-[#6B9A00]/40 bg-[#6B9A00]/[0.06]",
  info: "border-[#2440F0]/40 bg-[#2440F0]/[0.06]",
  warn: "border-[#C77700]/40 bg-[#C77700]/[0.06]",
  bad: "border-[#E5401F]/40 bg-[#E5401F]/[0.06]",
  muted: "border-border",
}

export const BIKE_STATUS_TONE: Record<string, Tone> = {
  available: "good",
  rented: "info",
  maintenance: "warn",
  missing: "bad",
}

export const ALERT_TYPE_INFO: Record<string, { label: string; tone: Tone; meaning: string }> = {
  missing_mismatch: {
    label: "Missing bike",
    tone: "bad",
    meaning: "The system says the bike is at the stand, but the camera has not seen it for 10+ minutes.",
  },
  returned_manually: {
    label: "Returned without tapping",
    tone: "warn",
    meaning: "The camera sees a bike at the stand that the system still thinks is rented. The rider forgot to tap.",
  },
  camera_issue: {
    label: "Camera issue",
    tone: "warn",
    meaning: "The camera or ground station stopped reporting.",
  },
  other: { label: "Other", tone: "muted", meaning: "An alert created manually by an admin." },
}

/** "12s ago", "4 min ago", "3 h ago". */
export function timeAgo(iso?: string | null, now: number = Date.now()): string {
  if (!iso) return "never"
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`
  return `${Math.round(seconds / 86400)} d ago`
}

"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { API_BASE_URL, LoginError, signIn, type Session } from "@/lib/api"

export function LoginScreen({ onSignedIn, notice }: { onSignedIn: (s: Session) => void; notice?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    if (!email.trim() || !password) {
      setError("Enter the admin email and password.")
      return
    }
    setBusy(true)
    try {
      onSignedIn(await signIn(email.trim(), password))
    } catch (err) {
      setError(err instanceof LoginError ? err.message : "Sign in failed. Try again.")
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-[100svh] bg-[var(--velo-blue)] text-white lg:grid-cols-[1.15fr_1fr]">
      <section className="flex flex-col justify-between px-6 pb-10 pt-8 sm:px-10 lg:px-14 lg:pb-14">
        <div className="inline-flex flex-col gap-1">
          <span className="velo-display text-[1.6rem]">Velo</span>
          <span className="velo-band block h-[7px] w-[5.4rem]" aria-hidden />
        </div>
        <div className="py-14 lg:py-0">
          <h1 className="velo-display text-[clamp(3rem,7.5vw,6.5rem)]">
            Stand
            <br />
            control
            <br />
            room
          </h1>
          <p className="mt-6 max-w-md text-lg text-white/85">Live fleet, rides, RFID taps and camera alerts for every Velo stand. Admins only.</p>
        </div>
        <p className="hidden text-sm text-white/60 lg:block">Connected to {API_BASE_URL}</p>
      </section>

      <section className="flex items-center justify-center bg-[var(--background)] px-6 py-14 text-[var(--ink)] sm:px-10">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--ink)] text-[var(--lime)]">
              <Lock className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="velo-wide text-2xl font-extrabold uppercase leading-none">Sign in</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Use the admin account set in the backend.</p>
            </div>
          </div>

          {notice && !error && (
            <p role="status" className="mb-5 rounded-sm border border-[#2440F0]/30 bg-[#2440F0]/[0.06] px-3 py-2.5 text-sm text-[#1A2FB8]">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="mb-5 rounded-sm border border-[#E5401F]/40 bg-[#E5401F]/[0.07] px-3 py-2.5 text-sm text-[#B3301A]">
              {error}
            </p>
          )}

          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-5 h-12 w-full rounded-sm border border-[var(--input)] bg-white px-3.5 text-base outline-none transition-[border-color,box-shadow] focus:border-[var(--velo-blue)] focus:ring-2 focus:ring-[var(--velo-blue)]/25"
            placeholder="admin@example.com"
            required
          />

          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
            Password
          </label>
          <div className="relative mb-7">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-sm border border-[var(--input)] bg-white pl-3.5 pr-12 text-base outline-none transition-[border-color,box-shadow] focus:border-[var(--velo-blue)] focus:ring-2 focus:ring-[var(--velo-blue)]/25"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-sm text-[var(--muted-foreground)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--velo-blue)]"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-[var(--ink)] text-base font-bold text-white transition-colors hover:bg-[var(--velo-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--velo-blue)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? "Signing in" : "Sign in"}
          </button>

          <p className="mt-6 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Sessions last 12 hours and end when this tab closes. Five wrong attempts lock sign-in for 15 minutes.
          </p>
        </form>
      </section>
    </div>
  )
}

"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getSession, signOut, SIGNED_OUT_EVENT, type Session } from "@/lib/api"
import { LoginScreen } from "@/components/login-screen"

const SessionContext = createContext<Session | null>(null)
export const useSession = () => useContext(SessionContext)

/** Shows the sign-in screen until there is a valid admin session. The backend enforces access either way. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [notice, setNotice] = useState<string | undefined>()

  useEffect(() => {
    setSession(getSession())
    setReady(true)
    const onOut = (e: Event) => {
      setSession(null)
      setNotice((e as CustomEvent<string | undefined>).detail)
    }
    window.addEventListener(SIGNED_OUT_EVENT, onOut)
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onOut)
  }, [])

  // Expire the session on time even if no request is made.
  useEffect(() => {
    if (!session) return
    const ms = new Date(session.expiresAt).getTime() - Date.now()
    const timer = setTimeout(() => signOut("Your session has ended. Please sign in again."), Math.max(0, ms))
    return () => clearTimeout(timer)
  }, [session])

  if (!ready) return <div className="min-h-[100svh] bg-[var(--velo-blue)]" aria-busy="true" />
  if (!session)
    return (
      <LoginScreen
        notice={notice}
        onSignedIn={(s) => {
          setNotice(undefined)
          setSession(s)
        }}
      />
    )
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

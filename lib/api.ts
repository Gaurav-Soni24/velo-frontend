/**
 * Admin session and authenticated API calls.
 * The backend enforces auth on every /api/admin route; this file only carries the token.
 * The token lives in sessionStorage, so it ends when the browser tab closes.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "")

const KEY = "velo-admin-session"
export const SIGNED_OUT_EVENT = "velo:signed-out"

export type Session = { token: string; email: string; expiresAt: string }

export function getSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (!s.token || new Date(s.expiresAt).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

function saveSession(s: Session) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Storage blocked: the session lasts until reload.
  }
}

export function signOut(reason?: string) {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {}
  window.dispatchEvent(new CustomEvent(SIGNED_OUT_EVENT, { detail: reason }))
}

export class LoginError extends Error {}

export async function signIn(email: string, password: string): Promise<Session> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new LoginError(`Cannot reach the Velo API at ${API_BASE_URL}. Check that the backend is running.`)
  }
  const body = await res.json().catch(() => ({}))
  if (res.status === 401) throw new LoginError("Email or password is incorrect.")
  if (res.status === 429) throw new LoginError("Too many failed attempts. Wait 15 minutes and try again.")
  if (res.status === 503) throw new LoginError("Admin login is not set up on the server yet. Add ADMIN_EMAIL, ADMIN_PASSWORD_HASH and JWT_SECRET to the backend .env.")
  if (!res.ok || !body?.data?.token) throw new LoginError(body?.message || "Sign in failed. Try again.")
  const session: Session = body.data
  saveSession(session)
  return session
}

/** fetch() with the admin token. A 401 ends the session and returns the user to the sign-in screen. */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const session = getSession()
  const headers = new Headers(init.headers)
  if (session) headers.set("Authorization", `Bearer ${session.token}`)
  const res = await fetch(url, { ...init, headers })
  if (res.status === 401) signOut("Your session has ended. Please sign in again.")
  return res
}

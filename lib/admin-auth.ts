import crypto from "node:crypto"
import { cookies, headers } from "next/headers"

const ADMIN_COOKIE_NAME = "cbt_admin_session"
const JWT_EXPIRES_SECONDS = 60 * 60 * 12 // 12 hours

function getPasscode(): string {
  return process.env.ADMIN_PASSCODE || "admin1234"
}

function getJwtSecret(): string {
  return (
    process.env.JWT_SECRET ||
    process.env.ADMIN_PASSCODE ||
    "tr3g-cbt-dev-jwt-secret"
  )
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/")
  const padLen = (4 - (padded.length % 4)) % 4
  return Buffer.from(padded + "=".repeat(padLen), "base64").toString("utf8")
}

export function signAdminJwt(): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: "admin",
      role: "admin",
      iat: now,
      exp: now + JWT_EXPIRES_SECONDS,
    })
  )
  const data = `${header}.${payload}`
  const signature = base64UrlEncode(
    crypto.createHmac("sha256", getJwtSecret()).update(data).digest()
  )
  return `${data}.${signature}`
}

export function verifyAdminJwt(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const [header, payload, signature] = parts
    const data = `${header}.${payload}`
    const expectedSig = base64UrlEncode(
      crypto.createHmac("sha256", getJwtSecret()).update(data).digest()
    )

    const a = Buffer.from(signature)
    const b = Buffer.from(expectedSig)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return false
    }

    const decoded = JSON.parse(base64UrlDecode(payload)) as {
      sub?: string
      exp?: number
    }
    if (decoded.sub !== "admin") return false
    if (typeof decoded.exp !== "number") return false
    return decoded.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function verifyPasscode(passcode: string): boolean {
  const expected = getPasscode()
  const a = Buffer.from(passcode)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const headerStore = await headers()
  const authHeader = headerStore.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim()
    if (verifyAdminJwt(bearerToken)) return true
  }

  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!cookieToken) return false
  return verifyAdminJwt(cookieToken)
}

export { ADMIN_COOKIE_NAME }

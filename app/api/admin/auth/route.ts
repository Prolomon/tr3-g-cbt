import { NextResponse } from "next/server"
import {
  ADMIN_COOKIE_NAME,
  isAdminAuthenticated,
  signAdminJwt,
  verifyPasscode,
} from "@/lib/admin-auth"

export async function GET() {
  const authenticated = await isAdminAuthenticated()
  return NextResponse.json({ authenticated })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { passcode?: string }
    const passcode = typeof body.passcode === "string" ? body.passcode : ""

    if (!passcode || !verifyPasscode(passcode)) {
      return NextResponse.json(
        { error: "Invalid admin passcode." },
        { status: 401 }
      )
    }

    const token = signAdminJwt()
    const response = NextResponse.json({ authenticated: true, token })
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    })
    return response
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.delete(ADMIN_COOKIE_NAME)
  return response
}

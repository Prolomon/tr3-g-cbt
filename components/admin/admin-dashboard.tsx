"use client"

import * as React from "react"
import {
  Lock,
  LogOut,
  Loader2,
  PieChart as PieIcon,
  Briefcase,
  HelpCircle,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { AnalyticsPanel } from "./analytics-panel"
import { RolesManager, type AdminRole } from "./roles-manager"
import { QuestionsManager } from "./questions-manager"
import { SubmissionsTable } from "./submissions-table"

const ADMIN_SESSION_KEY = "tr3g_admin_jwt"

export function AdminDashboard() {
  const [checkingAuth, setCheckingAuth] = React.useState(true)
  const [authenticated, setAuthenticated] = React.useState(false)
  const [passcode, setPasscode] = React.useState("")
  const [showPasscode, setShowPasscode] = React.useState(false)
  const [loggingIn, setLoggingIn] = React.useState(false)

  const [roles, setRoles] = React.useState<AdminRole[]>([])
  const [refreshKey, setRefreshKey] = React.useState(0)

  const fetchRoles = React.useCallback(async () => {
    const res = await fetch("/api/roles")
    if (res.ok) {
      const data = await res.json()
      setRoles(data.roles || [])
    }
  }, [])

  React.useEffect(() => {
    async function check() {
      try {
        const storedJwt =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(ADMIN_SESSION_KEY)
            : null
        const res = await fetch("/api/admin/auth", {
          headers: storedJwt
            ? { Authorization: `Bearer ${storedJwt}` }
            : undefined,
        })
        const data = await res.json()
        const isAuthed = Boolean(data.authenticated)
        setAuthenticated(isAuthed)
        if (!isAuthed && typeof window !== "undefined") {
          window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
        }
        if (isAuthed) {
          await fetchRoles()
        }
      } finally {
        setCheckingAuth(false)
      }
    }
    check()
  }, [fetchRoles])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoggingIn(true)
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid passcode.")

      if (data.token && typeof window !== "undefined") {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, data.token)
      }
      setAuthenticated(true)
      setPasscode("")
      await fetchRoles()
      toast.add({
        title: "Welcome, Admin",
        description: "JWT session active in sessionStorage.",
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Access Denied",
        description: err instanceof Error ? err.message : "Wrong passcode.",
        type: "error",
      })
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleLogout() {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
    }
    await fetch("/api/admin/auth", { method: "DELETE" })
    setAuthenticated(false)
  }

  function handleDataChanged() {
    fetchRoles()
    setRefreshKey((k) => k + 1)
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="overflow-hidden border-border bg-card shadow-lg shadow-black/5">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#062950] via-[#0b3a6c] to-primary" />
          <CardHeader className="border-b border-border p-6 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary ring-1 ring-border">
              <Lock className="size-5" />
            </div>
            <CardTitle className="text-xl text-foreground">
              Admin Portal Access
            </CardTitle>
            <CardDescription className="mt-1">
              Enter your administrator passcode to manage roles, questions,
              auto-mark keys, and analytics.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="adminPass" className="text-foreground">
                  Admin Passcode
                </Label>
                <div className="relative">
                  <Input
                    id="adminPass"
                    type={showPasscode ? "text" : "password"}
                    placeholder="Enter passcode..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode((prev) => !prev)}
                    aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-primary"
                  >
                    {showPasscode ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
              >
                {loggingIn ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Unlock Admin Portal"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[#062950] p-6 text-[#ecf2f8] shadow-md">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-[#59a132]/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#59a132]/20 text-[#59a132]">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Admin Control Center
              </h1>
              <p className="mt-0.5 text-sm text-[#8fa6be]">
                Manage roles, set questions &amp; auto-mark answers, and track
                live performance.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 bg-[#59a132] text-[#041526] font-semibold hover:bg-[#437b25] hover:text-white"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-1.5 rounded-xl border border-border bg-secondary/70 p-1.5 sm:inline-grid sm:w-auto sm:grid-cols-4">
          <TabsTrigger
            value="analytics"
            className="gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground data-active:bg-primary data-active:text-primary-foreground data-active:shadow-xs"
          >
            <PieIcon className="size-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground data-active:bg-primary data-active:text-primary-foreground data-active:shadow-xs"
          >
            <Briefcase className="size-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            className="gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground data-active:bg-primary data-active:text-primary-foreground data-active:shadow-xs"
          >
            <HelpCircle className="size-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            className="gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground data-active:bg-primary data-active:text-primary-foreground data-active:shadow-xs"
          >
            <Users className="size-4" />
            Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsPanel roles={roles} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesManager roles={roles} onChanged={handleDataChanged} />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionsManager roles={roles} onChanged={handleDataChanged} />
        </TabsContent>

        <TabsContent value="submissions">
          <SubmissionsTable refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

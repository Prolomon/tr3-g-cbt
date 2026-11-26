"use client"

import * as React from "react"
import { Plus, Trash2, Briefcase, Loader2, SlidersHorizontal, Save } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

export interface AdminRole {
  id: number
  name: string
  description: string
  allowRetake: boolean
  questionsPerAttempt: number | null
  timeLimitMinutes: number | null
  activeQuestionCount: number
  totalQuestionCount: number
}

interface GeneralSettings {
  useGeneralQuestionCount: boolean
  generalQuestionCount: number | null
  useGeneralTimeLimit: boolean
  generalTimeLimitMinutes: number | null
  useGeneralRetake: boolean
  generalAllowRetake: boolean
  ignoreRoleFilter: boolean
}

export function RolesManager({
  roles,
  onChanged,
}: {
  roles: AdminRole[]
  onChanged: () => void
}) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [allowRetake, setAllowRetake] = React.useState(false)
  const [questionsPerAttempt, setQuestionsPerAttempt] = React.useState("")
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  // General Settings state
  const [loadingSettings, setLoadingSettings] = React.useState(true)
  const [savingSettings, setSavingSettings] = React.useState(false)
  const [useGeneralQCount, setUseGeneralQCount] = React.useState(false)
  const [generalQCount, setGeneralQCount] = React.useState("20")
  const [useGeneralTime, setUseGeneralTime] = React.useState(false)
  const [generalTime, setGeneralTime] = React.useState("20")
  const [useGeneralRetake, setUseGeneralRetake] = React.useState(false)
  const [generalAllowRetake, setGeneralAllowRetake] = React.useState(false)
  const [ignoreRoleFilter, setIgnoreRoleFilter] = React.useState(false)

  React.useEffect(() => {
    let active = true
    async function loadSettings() {
      try {
        setLoadingSettings(true)
        const res = await fetch("/api/admin/settings")
        if (!res.ok) return
        const data = (await res.json()) as { settings: GeneralSettings }
        if (active && data.settings) {
          setUseGeneralQCount(data.settings.useGeneralQuestionCount)
          setGeneralQCount(
            data.settings.generalQuestionCount
              ? String(data.settings.generalQuestionCount)
              : ""
          )
          setUseGeneralTime(data.settings.useGeneralTimeLimit)
          setGeneralTime(
            data.settings.generalTimeLimitMinutes
              ? String(data.settings.generalTimeLimitMinutes)
              : ""
          )
          setUseGeneralRetake(data.settings.useGeneralRetake)
          setGeneralAllowRetake(data.settings.generalAllowRetake)
          setIgnoreRoleFilter(data.settings.ignoreRoleFilter)
        }
      } finally {
        if (active) setLoadingSettings(false)
      }
    }
    loadSettings()
    return () => {
      active = false
    }
  }, [])

  async function handleSaveGeneralSettings(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSavingSettings(true)
      const qCountNum = Number(generalQCount)
      const timeNum = Number(generalTime)

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useGeneralQuestionCount: useGeneralQCount,
          generalQuestionCount:
            Number.isInteger(qCountNum) && qCountNum > 0 ? qCountNum : null,
          useGeneralTimeLimit: useGeneralTime,
          generalTimeLimitMinutes:
            Number.isInteger(timeNum) && timeNum > 0 ? timeNum : null,
          useGeneralRetake,
          generalAllowRetake,
          ignoreRoleFilter,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save settings.")

      toast.add({
        title: "General Settings Saved",
        description:
          "Global question count, timer, and randomization rules updated.",
        type: "success",
      })
      onChanged()
    } catch (err) {
      toast.add({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Could not save settings.",
        type: "error",
      })
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setSaving(true)
      const parsedLimit = Number(questionsPerAttempt)
      const parsedTime = Number(timeLimitMinutes)
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          allowRetake,
          questionsPerAttempt:
            Number.isInteger(parsedLimit) && parsedLimit > 0
              ? parsedLimit
              : null,
          timeLimitMinutes:
            Number.isInteger(parsedTime) && parsedTime > 0 ? parsedTime : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add role.")

      toast.add({
        title: "Role Created",
        description: `"${data.role.name}" is now available for questions and public registration.`,
        type: "success",
      })
      setName("")
      setDescription("")
      setAllowRetake(false)
      setQuestionsPerAttempt("")
      setTimeLimitMinutes("")
      onChanged()
    } catch (err) {
      toast.add({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not add role.",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateTimeLimit(role: AdminRole, rawValue: string) {
    const parsed = Number(rawValue)
    const nextTime =
      rawValue.trim() !== "" && Number.isInteger(parsed) && parsed > 0
        ? parsed
        : null
    if (nextTime === role.timeLimitMinutes) return

    const res = await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeLimitMinutes: nextTime }),
    })
    if (res.ok) {
      toast.add({
        title: "Time Limit Updated",
        description: nextTime
          ? `${role.name} now has a ${nextTime}-minute timer (auto-submits when time is up).`
          : `${role.name} is now untimed.`,
        type: "info",
      })
      onChanged()
    }
  }

  async function handleUpdateLimit(role: AdminRole, rawValue: string) {
    const parsed = Number(rawValue)
    const nextLimit =
      rawValue.trim() !== "" && Number.isInteger(parsed) && parsed > 0
        ? parsed
        : null
    if (nextLimit === role.questionsPerAttempt) return

    const res = await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionsPerAttempt: nextLimit }),
    })
    if (res.ok) {
      toast.add({
        title: "Question Limit Updated",
        description: nextLimit
          ? `${role.name} will show ${nextLimit} shuffled questions per person.`
          : `${role.name} will show all active questions (shuffled).`,
        type: "info",
      })
      onChanged()
    }
  }

  async function handleToggleRetake(role: AdminRole) {
    const res = await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowRetake: !role.allowRetake }),
    })
    if (res.ok) {
      toast.add({
        title: !role.allowRetake ? "Retakes Enabled" : "Retakes Disabled",
        description: `${role.name}: candidates ${!role.allowRetake ? "can" : "cannot"} take this assessment again.`,
        type: "info",
      })
      onChanged()
    }
  }

  async function handleDeleteRole(id: number, roleName: string) {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete role.")

      toast.add({
        title: "Role Deleted",
        description: `Removed "${roleName}" and its associated questions.`,
        type: "info",
      })
      onChanged()
    } catch (err) {
      toast.add({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed.",
        type: "error",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* General Exam Settings (Global Overrides) */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border bg-secondary/40">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <SlidersHorizontal className="size-4 text-primary" />
            General Exam Settings (Global Overrides)
          </CardTitle>
          <CardDescription>
            Toggle these on to apply one question count, timer, or full-bank
            randomization across all roles without editing each role
            individually.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveGeneralSettings}>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* General Question Count */}
            <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="useGenQ"
                  className="text-sm font-semibold text-foreground"
                >
                  General Question Count
                </Label>
                <Switch
                  id="useGenQ"
                  checked={useGeneralQCount}
                  onCheckedChange={setUseGeneralQCount}
                  disabled={loadingSettings}
                />
              </div>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 20"
                value={generalQCount}
                onChange={(e) => setGeneralQCount(e.target.value)}
                disabled={!useGeneralQCount || loadingSettings}
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground">
                {useGeneralQCount
                  ? "ON: Overrides all roles with this random question count."
                  : "OFF: Uses each role's own Qs setting."}
              </p>
            </div>

            {/* General Time Limit */}
            <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="useGenTime"
                  className="text-sm font-semibold text-foreground"
                >
                  General Time Limit (Mins)
                </Label>
                <Switch
                  id="useGenTime"
                  checked={useGeneralTime}
                  onCheckedChange={setUseGeneralTime}
                  disabled={loadingSettings}
                />
              </div>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 20"
                value={generalTime}
                onChange={(e) => setGeneralTime(e.target.value)}
                disabled={!useGeneralTime || loadingSettings}
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground">
                {useGeneralTime
                  ? "ON: Overrides all roles with this countdown timer."
                  : "OFF: Uses each role's own Mins setting."}
              </p>
            </div>

            {/* General Retake */}
            <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="useGenRetake"
                  className="text-sm font-semibold text-foreground"
                >
                  General Retake
                </Label>
                <Switch
                  id="useGenRetake"
                  checked={useGeneralRetake}
                  onCheckedChange={setUseGeneralRetake}
                  disabled={loadingSettings}
                />
              </div>
              <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-card px-3">
                <span className="text-xs font-medium text-foreground/90">
                  Allow Retake
                </span>
                <Switch
                  checked={generalAllowRetake}
                  onCheckedChange={setGeneralAllowRetake}
                  disabled={!useGeneralRetake || loadingSettings}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {useGeneralRetake
                  ? `ON: ${generalAllowRetake ? "Allows" : "Disables"} retakes for all roles.`
                  : "OFF: Uses each role's own Retake toggle."}
              </p>
            </div>

            {/* Ignore Role Filter */}
            <div className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="ignoreRole"
                  className="text-sm font-semibold text-foreground"
                >
                  Not Based on Role
                </Label>
                <Switch
                  id="ignoreRole"
                  checked={ignoreRoleFilter}
                  onCheckedChange={setIgnoreRoleFilter}
                  disabled={loadingSettings}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {ignoreRoleFilter
                  ? "ON: Draws randomly from ALL active questions regardless of role."
                  : "OFF: Draws from selected role + All Roles questions."}
              </p>
              <Button
                type="submit"
                disabled={savingSettings || loadingSettings}
                className="w-full gap-2 bg-primary text-white hover:bg-primary/90"
              >
                {savingSettings ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save General Settings
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Plus className="size-4 text-primary" />
              Add New Role
            </CardTitle>
            <CardDescription>
              Create roles like Supervisor or Customer Service. Public
              candidates will pick from these roles.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateRole}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g. Customer Service"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDesc">Description (Optional)</Label>
                <Input
                  id="roleDesc"
                  placeholder="Frontline support & ticket handling"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qPerAttempt">Questions / Person</Label>
                  <Input
                    id="qPerAttempt"
                    type="number"
                    min={1}
                    placeholder="All (shuffled)"
                    value={questionsPerAttempt}
                    onChange={(e) => setQuestionsPerAttempt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeLimitMins">Time Limit (Minutes)</Label>
                  <Input
                    id="timeLimitMins"
                    type="number"
                    min={1}
                    placeholder="No limit"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Questions are randomly shuffled. If a time limit is set, the
                exam auto-submits when time expires.
              </p>
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5">
                <div>
                  <Label htmlFor="allowRetake" className="text-sm text-foreground">
                    Allow Retake
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show &ldquo;Take Another Assessment&rdquo; button after
                    submission
                  </p>
                </div>
                <Switch
                  id="allowRetake"
                  checked={allowRetake}
                  onCheckedChange={setAllowRetake}
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full gap-2 bg-primary text-white hover:bg-primary/90"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add Role
              </Button>
            </CardContent>
          </form>
        </Card>

        <Card className="border-border bg-card lg:col-span-3">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Briefcase className="size-4 text-primary" />
              Configured Roles ({roles.length})
            </CardTitle>
            <CardDescription>
              Per-role settings (overridden when General Exam Settings toggles
              above are ON).
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-2">
            {roles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No roles added yet. Add your first role on the left.
              </p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {role.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-primary"
                      >
                        {role.activeQuestionCount} active Qs
                      </Badge>
                    </div>
                    {role.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Qs:</span>
                      <Input
                        type="number"
                        min={1}
                        placeholder="All"
                        disabled={useGeneralQCount}
                        defaultValue={role.questionsPerAttempt ?? ""}
                        onBlur={(e) => handleUpdateLimit(role, e.target.value)}
                        className="h-8 w-16 px-2 text-center text-xs"
                        aria-label={`Questions per person for ${role.name}`}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Mins:</span>
                      <Input
                        type="number"
                        min={1}
                        placeholder="∞"
                        disabled={useGeneralTime}
                        defaultValue={role.timeLimitMinutes ?? ""}
                        onBlur={(e) =>
                          handleUpdateTimeLimit(role, e.target.value)
                        }
                        className="h-8 w-16 px-2 text-center text-xs"
                        aria-label={`Time limit in minutes for ${role.name}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Retake</span>
                      <Switch
                        checked={role.allowRetake}
                        disabled={useGeneralRetake}
                        onCheckedChange={() => handleToggleRetake(role)}
                        aria-label={`Allow retake for ${role.name}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === role.id}
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {deletingId === role.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

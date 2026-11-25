"use client"

import * as React from "react"
import { Plus, Trash2, Briefcase, Loader2 } from "lucide-react"
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
  activeQuestionCount: number
  totalQuestionCount: number
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
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setSaving(true)
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          allowRetake,
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
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="border-blue-100 bg-white lg:col-span-2">
        <CardHeader className="border-b border-blue-50">
          <CardTitle className="flex items-center gap-2 text-base text-blue-950">
            <Plus className="size-4 text-blue-600" />
            Add New Role
          </CardTitle>
          <CardDescription>
            Create roles like Supervisor or Customer Service. Public candidates
            will pick from these roles.
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
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/40 px-3.5 py-2.5">
              <div>
                <Label htmlFor="allowRetake" className="text-sm text-blue-950">
                  Allow Retake
                </Label>
                <p className="text-xs text-slate-500">
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
              className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
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

      <Card className="border-blue-100 bg-white lg:col-span-3">
        <CardHeader className="border-b border-blue-50">
          <CardTitle className="flex items-center gap-2 text-base text-blue-950">
            <Briefcase className="size-4 text-blue-600" />
            Configured Roles ({roles.length})
          </CardTitle>
          <CardDescription>
            Roles currently active in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-blue-50 pt-2">
          {roles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No roles added yet. Add your first role on the left.
            </p>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-950">
                      {role.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700"
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

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Retake</span>
                    <Switch
                      checked={role.allowRetake}
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
  )
}

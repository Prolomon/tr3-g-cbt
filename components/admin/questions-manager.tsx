"use client"

import * as React from "react"
import { Plus, Trash2, CheckCircle2, Loader2, HelpCircle, FileText } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import type { AdminRole } from "./roles-manager"

interface AdminQuestion {
  id: number
  roleId: number
  roleName: string
  questionType: "objective" | "theory"
  prompt: string
  options: string[]
  correctOptionIndex: number
  explanation: string | null
  points: number
  isActive: boolean
}

export function QuestionsManager({
  roles,
  onChanged,
}: {
  roles: AdminRole[]
  onChanged: () => void
}) {
  const [questions, setQuestions] = React.useState<AdminQuestion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filterRoleId, setFilterRoleId] = React.useState<string>("all")

  // Form state
  const [roleId, setRoleId] = React.useState<string>("")
  const effectiveRoleId = roleId || (roles[0] ? String(roles[0].id) : "")
  const [questionType, setQuestionType] = React.useState<"objective" | "theory">(
    "objective"
  )
  const [prompt, setPrompt] = React.useState("")
  const [options, setOptions] = React.useState<string[]>(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = React.useState<string>("0")
  const [explanation, setExplanation] = React.useState("")
  const [points, setPoints] = React.useState("1")
  const [saving, setSaving] = React.useState(false)

  const loadQuestions = React.useCallback(async () => {
    try {
      setLoading(true)
      const query =
        filterRoleId !== "all"
          ? `?admin=true&roleId=${filterRoleId}`
          : "?admin=true"
      const res = await fetch(`/api/questions${query}`)
      if (!res.ok) return
      const data = await res.json()
      setQuestions(data.questions || [])
    } finally {
      setLoading(false)
    }
  }, [filterRoleId])

  React.useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveRoleId || !prompt.trim()) {
      toast.add({
        title: "Incomplete Question",
        description: "Select a role and enter a question prompt.",
        type: "error",
      })
      return
    }

    const cleanedOptions = options.map((o) => o.trim()).filter(Boolean)
    const correctIdxNum = Number(correctIndex)

    if (questionType === "objective") {
      if (cleanedOptions.length < 2) {
        toast.add({
          title: "Missing Options",
          description:
            "Provide at least 2 answer options for an objective question.",
          type: "error",
        })
        return
      }
      if (correctIdxNum >= cleanedOptions.length) {
        toast.add({
          title: "Invalid Correct Answer",
          description: "The selected correct answer option cannot be empty.",
          type: "error",
        })
        return
      }
    }

    try {
      setSaving(true)
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: Number(effectiveRoleId),
          questionType,
          prompt: prompt.trim(),
          options: questionType === "objective" ? cleanedOptions : [],
          correctOptionIndex: questionType === "objective" ? correctIdxNum : -1,
          explanation: explanation.trim() || null,
          points: Number(points) || 1,
          isActive: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save question.")

      toast.add({
        title: "Question Added",
        description:
          questionType === "theory"
            ? "Theory question saved (will be manually scored by admin)."
            : "Objective question and auto-mark answer key saved.",
        type: "success",
      })
      setPrompt("")
      setOptions(["", "", "", ""])
      setCorrectIndex("0")
      setExplanation("")
      setPoints(questionType === "theory" ? "5" : "1")
      await loadQuestions()
      onChanged()
    } catch (err) {
      toast.add({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not save.",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(q: AdminQuestion) {
    const res = await fetch(`/api/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !q.isActive }),
    })
    if (res.ok) {
      await loadQuestions()
      onChanged()
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.add({
        title: "Question Deleted",
        description: "Removed from question bank.",
        type: "info",
      })
      await loadQuestions()
      onChanged()
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Create Question Form */}
      <Card className="border-blue-100 bg-white lg:col-span-2">
        <CardHeader className="border-b border-blue-50">
          <CardTitle className="flex items-center gap-2 text-base text-blue-950">
            <Plus className="size-4 text-blue-600" />
            Add Question
          </CardTitle>
          <CardDescription>
            Create auto-marked objective questions or written theory questions.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateQuestion}>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Role</Label>
                {roles.length === 0 ? (
                  <p className="text-xs text-amber-700">
                    Create a role first.
                  </p>
                ) : (
                  <Select
                    value={effectiveRoleId}
                    onValueChange={(val) => val && setRoleId(val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={questionType}
                  onValueChange={(val) => {
                    if (val === "objective" || val === "theory") {
                      setQuestionType(val)
                      setPoints(val === "theory" ? "5" : "1")
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="objective">
                      Objective (Options)
                    </SelectItem>
                    <SelectItem value="theory">Theory (Textarea)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qPrompt">Question Prompt</Label>
              <Textarea
                id="qPrompt"
                rows={3}
                placeholder="Enter the assessment question..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
            </div>

            {questionType === "objective" ? (
              <>
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 text-xs font-bold text-blue-700">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          value={opt}
                          onChange={(e) => {
                            const next = [...options]
                            next[idx] = e.target.value
                            setOptions(next)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={correctIndex}
                      onValueChange={(val) => val && setCorrectIndex(val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((_, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            Option {String.fromCharCode(65 + idx)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qPoints">Points</Label>
                    <Input
                      id="qPoints"
                      type="number"
                      min={1}
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs leading-relaxed text-blue-900">
                  <strong>Theory Mode:</strong> No options or auto-mark key
                  required. Candidates will answer in a textarea, and you will
                  score their response in <strong>Submissions</strong> before
                  their Brevo email is sent.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qPointsTheory">Max Points</Label>
                  <Input
                    id="qPointsTheory"
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="qExplanation">
                {questionType === "theory"
                  ? "Grading Guide / Expected Points (Optional)"
                  : "Advisor Explanation (Optional)"}
              </Label>
              <Input
                id="qExplanation"
                placeholder={
                  questionType === "theory"
                    ? "Key points to look for when grading..."
                    : "Why this answer is correct..."
                }
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={saving || roles.length === 0}
              className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Save Question
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Question Bank List */}
      <Card className="border-blue-100 bg-white lg:col-span-3">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-blue-50">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-blue-950">
              <HelpCircle className="size-4 text-blue-600" />
              Question Bank ({questions.length})
            </CardTitle>
            <CardDescription>
              Manage objective and theory questions across roles.
            </CardDescription>
          </div>
          <Select
            value={filterRoleId}
            onValueChange={(val) => val && setFilterRoleId(val)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="divide-y divide-blue-50 pt-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-blue-600" />
            </div>
          ) : questions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No questions found for this filter.
            </p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {q.roleName}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          q.questionType === "theory"
                            ? "border-blue-300 bg-blue-600 text-white"
                            : "border-slate-200 text-slate-700"
                        }
                      >
                        {q.questionType === "theory" ? "Theory" : "Objective"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {q.points} pt{q.points === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <p className="font-medium text-blue-950">{q.prompt}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={q.isActive}
                      onCheckedChange={() => handleToggleActive(q)}
                      aria-label="Toggle active"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(q.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {q.questionType === "theory" ? (
                  <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/40 px-3 py-2 text-xs text-blue-800">
                    <FileText className="size-3.5 shrink-0 text-blue-600" />
                    <span>
                      Written response question (manually scored by admin).
                    </span>
                  </div>
                ) : (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {q.options.map((opt, idx) => {
                      const isCorrect = idx === q.correctOptionIndex
                      return (
                        <div
                          key={idx}
                          className={
                            isCorrect
                              ? "flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
                              : "rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                          }
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-blue-600" />
                          ) : null}
                          <span>
                            {String.fromCharCode(65 + idx)}. {opt}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MailCheck,
  MailWarning,
  Send,
  Loader2,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"
import { AdvisorChip } from "@/components/advisor-chip"
import { cn } from "@/lib/utils"

interface SubmissionDetail {
  id: number
  fullName: string
  email: string
  phone: string
  roleName: string
  score: number
  totalPoints: number
  percentage: number
  gradingStatus: "graded" | "pending_review"
  advisorChip: string
  advisorMessage: string
  emailSent: boolean
  emailError: string | null
  submittedAt: string
}

interface ReviewRow {
  questionId: number
  questionType: "objective" | "theory"
  prompt: string
  selectedOption: string
  correctOption: string
  theoryAnswer: string | null
  pointsAwarded: number
  maxPoints: number
  isCorrect: boolean
  explanation: string | null
}

const ADMIN_SESSION_KEY = "tr3g_admin_jwt"

export function SubmissionReviewPage({
  submissionId,
}: {
  submissionId: string
}) {
  const [loading, setLoading] = React.useState(true)
  const [unauthorized, setUnauthorized] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [submission, setSubmission] = React.useState<SubmissionDetail | null>(
    null
  )
  const [reviewRows, setReviewRows] = React.useState<ReviewRow[]>([])
  const [theoryScores, setTheoryScores] = React.useState<
    Record<number, number>
  >({})
  const [savingGrades, setSavingGrades] = React.useState(false)
  const [resending, setResending] = React.useState(false)

  const loadSubmission = React.useCallback(async () => {
    try {
      setLoading(true)
      const storedJwt =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(ADMIN_SESSION_KEY)
          : null

      const res = await fetch(`/api/submissions/${submissionId}`, {
        headers: storedJwt
          ? { Authorization: `Bearer ${storedJwt}` }
          : undefined,
      })

      if (res.status === 401) {
        setUnauthorized(true)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to load submission.")
      }

      setSubmission(data.submission)
      const rows: ReviewRow[] = data.review || []
      setReviewRows(rows)

      const initialScores: Record<number, number> = {}
      for (const r of rows) {
        if (r.questionType === "theory") {
          initialScores[r.questionId] = r.pointsAwarded ?? 0
        }
      }
      setTheoryScores(initialScores)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load submission."
      )
    } finally {
      setLoading(false)
    }
  }, [submissionId])

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadSubmission()
    })
  }, [loadSubmission])

  async function handleFinalizeTheoryAndSend() {
    if (!submission) return
    try {
      setSavingGrades(true)
      const storedJwt =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(ADMIN_SESSION_KEY)
          : null

      const payload = {
        theoryScores: reviewRows
          .filter((r) => r.questionType === "theory")
          .map((r) => ({
            questionId: r.questionId,
            pointsAwarded: theoryScores[r.questionId] ?? 0,
          })),
      }

      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(storedJwt ? { Authorization: `Bearer ${storedJwt}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save grades.")

      toast.add({
        title: data.emailSent ? "Graded & Email Sent!" : "Grades Saved",
        description: data.emailSent
          ? `Final score (${data.submission.percentage}%) sent to ${submission.email} via Brevo.`
          : data.emailError || "Scores saved, but Brevo email was not sent.",
        type: data.emailSent ? "success" : "info",
      })
      await loadSubmission()
    } catch (err) {
      toast.add({
        title: "Grading Error",
        description:
          err instanceof Error ? err.message : "Could not save grades.",
        type: "error",
      })
    } finally {
      setSavingGrades(false)
    }
  }

  async function handleResendEmail() {
    if (!submission) return
    try {
      setResending(true)
      const storedJwt =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(ADMIN_SESSION_KEY)
          : null

      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "POST",
        headers: storedJwt
          ? { Authorization: `Bearer ${storedJwt}` }
          : undefined,
      })
      const data = await res.json()
      if (res.ok && data.emailSent) {
        toast.add({
          title: "Email Sent",
          description: `Score report sent to ${submission.email} via Brevo.`,
          type: "success",
        })
      } else {
        toast.add({
          title: "Brevo Delivery Failed",
          description: data.emailError || data.error || "Check Brevo keys.",
          type: "error",
        })
      }
      await loadSubmission()
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="border-border bg-card text-center shadow-md">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Lock className="size-5" />
            </div>
            <CardTitle className="text-foreground">
              Admin Sign-In Required
            </CardTitle>
            <CardDescription>
              Please unlock the Admin Portal first to review and grade candidate
              submissions.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/admin">
              <Button className="bg-primary text-white hover:bg-primary/90">
                Go to Admin Sign-In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Back to Admin Portal
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertTitle>Unable to Load Submission</AlertTitle>
          <AlertDescription>{error || "Submission not found."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const hasTheory = reviewRows.some((r) => r.questionType === "theory")

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/admin">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-border bg-card text-primary hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            Back to Admin Portal
          </Button>
        </Link>

        {submission.gradingStatus === "pending_review" ? (
          <Badge className="gap-1.5 bg-amber-100 px-3 py-1 text-amber-800 hover:bg-amber-100">
            <Clock className="size-3.5" />
            Pending Theory Grading
          </Badge>
        ) : (
          <Badge className="gap-1.5 bg-primary/15 px-3 py-1 text-primary hover:bg-primary/15">
            <CheckCircle2 className="size-3.5" />
            Graded
          </Badge>
        )}
      </div>

      {/* Candidate Summary Card */}
      <Card className="overflow-hidden border-border bg-card shadow-md shadow-black/5">
        <CardHeader className="border-b border-border bg-secondary/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge className="mb-2 bg-primary text-white hover:bg-primary">
                {submission.roleName}
              </Badge>
              <CardTitle className="text-2xl text-foreground">
                {submission.fullName}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {submission.email} • {submission.phone}
              </CardDescription>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#062950] to-[#0b3a6c] px-6 py-3.5 text-center text-white shadow-sm">
              <div className="text-3xl font-extrabold tracking-tight">
                {submission.percentage}%
              </div>
              <div className="text-xs font-medium text-[#8fa6be]">
                {submission.score} / {submission.totalPoints} points
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <AdvisorChip
            label={submission.advisorChip}
            message={submission.advisorMessage}
          />

          {submission.emailSent ? (
            <Alert className="border-border bg-secondary/60 text-foreground">
              <MailCheck className="size-4 text-primary" />
              <AlertTitle>Brevo Email Sent</AlertTitle>
              <AlertDescription>
                Result email was delivered to{" "}
                <strong>{submission.email}</strong>.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-200 bg-amber-50 text-amber-950">
              <MailWarning className="size-4 text-amber-600" />
              <AlertTitle>Email Not Sent Yet</AlertTitle>
              <AlertDescription>
                {submission.gradingStatus === "pending_review"
                  ? "Score the theory question(s) below and click Save Grades & Send Brevo Email."
                  : submission.emailError || "Brevo email has not been sent."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Questions & Theory Grading */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
          <CardTitle className="text-base text-foreground">
            Answer Review &amp; Theory Grading ({reviewRows.length} Questions)
          </CardTitle>
          <CardDescription>
            Objective questions are auto-marked. Score any theory responses
            below before sending the Brevo email.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {reviewRows.map((row, idx) => (
            <div
              key={row.questionId}
              className={cn(
                "rounded-xl border border-l-4 p-5",
                row.questionType === "theory"
                  ? "border-border border-l-primary bg-secondary/20"
                  : row.isCorrect
                    ? "border-border border-l-primary bg-card"
                    : "border-red-100 border-l-red-500 bg-red-50/20"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-xs text-primary"
                  >
                    {row.questionType === "theory"
                      ? `Theory (${row.maxPoints} pts max)`
                      : `Objective (${row.maxPoints} pt)`}
                  </Badge>
                  <p className="font-semibold text-foreground">
                    {idx + 1}. {row.prompt}
                  </p>
                </div>

                {row.questionType === "objective" ? (
                  row.isCorrect ? (
                    <Badge className="shrink-0 gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                      <CheckCircle2 className="size-3.5" />
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="shrink-0 gap-1">
                      <XCircle className="size-3.5" />
                      Incorrect
                    </Badge>
                  )
                ) : null}
              </div>

              {row.questionType === "theory" ? (
                <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4">
                  <div>
                    <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                      Candidate Written Answer
                    </span>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {row.theoryAnswer || "No written answer provided."}
                    </p>
                  </div>

                  {row.explanation ? (
                    <div className="rounded-lg bg-secondary/60 p-3 text-xs text-foreground">
                      <strong>Grading Guide:</strong> {row.explanation}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                    <Label
                      htmlFor={`score-${row.questionId}`}
                      className="text-sm font-semibold text-foreground"
                    >
                      Score Awarded (0 – {row.maxPoints}):
                    </Label>
                    <Input
                      id={`score-${row.questionId}`}
                      type="number"
                      min={0}
                      max={row.maxPoints}
                      value={theoryScores[row.questionId] ?? 0}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(row.maxPoints, Number(e.target.value) || 0)
                        )
                        setTheoryScores((prev) => ({
                          ...prev,
                          [row.questionId]: val,
                        }))
                      }}
                      className="w-28 bg-card"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                  <p className="text-foreground/90">
                    <span className="font-medium text-muted-foreground">
                      Selected:{" "}
                    </span>
                    {row.selectedOption}
                  </p>
                  <p className="font-medium text-primary">
                    <span className="text-primary/80">Correct: </span>
                    {row.correctOption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-4">
          <Link href="/admin">
            <Button variant="outline" className="border-border text-primary">
              Return to Submissions
            </Button>
          </Link>

          {hasTheory ? (
            <Button
              type="button"
              disabled={savingGrades}
              onClick={handleFinalizeTheoryAndSend}
              className="gap-2 bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
            >
              {savingGrades ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Save Grades &amp; Send Brevo Email
            </Button>
          ) : (
            <Button
              type="button"
              disabled={resending}
              onClick={handleResendEmail}
              className="gap-2 bg-primary text-white hover:bg-primary/90"
            >
              {resending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {submission.emailSent
                ? "Resend Score Email via Brevo"
                : "Send Score Email via Brevo"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

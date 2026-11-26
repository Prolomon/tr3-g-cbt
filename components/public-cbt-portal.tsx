"use client"

import * as React from "react"
import {
  CheckCircle2,
  XCircle,
  MailCheck,
  MailWarning,
  ArrowRight,
  ArrowLeft,
  Send,
  UserCheck,
  RotateCcw,
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
  FileText,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/toast"
import { AdvisorChip } from "@/components/advisor-chip"
import { cn } from "@/lib/utils"

interface RoleOption {
  id: number
  name: string
  description: string
  questionsPerAttempt?: number | null
  timeLimitMinutes?: number | null
  effectiveQuestionsPerAttempt?: number | null
  effectiveTimeLimitMinutes?: number | null
  activeQuestionCount: number
}

interface PublicQuestion {
  id: number
  roleId: number
  questionType: "objective" | "theory"
  prompt: string
  options: string[]
  points: number
}

interface GradedReviewItem {
  questionId: number
  questionType: "objective" | "theory"
  prompt: string
  options: string[]
  selectedOptionIndex: number
  correctOptionIndex: number
  selectedOption: string
  correctOption: string
  isCorrect: boolean
  pointsAwarded: number
  maxPoints: number
  explanation?: string | null
  points: number
}

interface SubmissionResult {
  submission: {
    id: number
    fullName: string
    email: string
    phone: string
    roleName: string
    allowRetake: boolean
    score: number
    totalPoints: number
    percentage: number
    gradingStatus: "graded" | "pending_review"
    advisorChip: string
    advisorMessage: string
    emailSent: boolean
    emailError?: string | null
  }
  review: GradedReviewItem[]
}

type Step = "register" | "exam" | "result"

const DRAFT_STORAGE_KEY = "tr3g_cbt_draft_v1"

interface DraftState {
  step: "register" | "exam"
  fullName: string
  email: string
  phone: string
  selectedRoleId: string
  questions: PublicQuestion[]
  currentIndex: number
  answers: Record<number, number>
  theoryAnswers: Record<number, string>
  examEndsAt: number | null
}

const STEPS: { key: Step; num: number; label: string }[] = [
  { key: "register", num: 1, label: "Candidate Details" },
  { key: "exam", num: 2, label: "Role Assessment" },
  { key: "result", num: 3, label: "Score & Advisor Review" },
]

export function PublicCbtPortal() {
  const [step, setStep] = React.useState<Step>("register")
  const [roles, setRoles] = React.useState<RoleOption[]>([])
  const [loadingRoles, setLoadingRoles] = React.useState(true)
  const [rolesError, setRolesError] = React.useState<string | null>(null)

  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")

  const [questions, setQuestions] = React.useState<PublicQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<number, number>>({})
  const [theoryAnswers, setTheoryAnswers] = React.useState<
    Record<number, string>
  >({})
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<SubmissionResult | null>(null)
  const [draftHydrated, setDraftHydrated] = React.useState(false)
  const [examEndsAt, setExamEndsAt] = React.useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(
    null
  )
  const autoSubmittedRef = React.useRef(false)

  // Restore saved assessment progress from localStorage on mount
  React.useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DraftState>
          if (parsed.fullName) setFullName(parsed.fullName)
          if (parsed.email) setEmail(parsed.email)
          if (parsed.phone) setPhone(parsed.phone)
          if (parsed.selectedRoleId) setSelectedRoleId(parsed.selectedRoleId)
          if (typeof parsed.examEndsAt === "number") {
            setExamEndsAt(parsed.examEndsAt)
          }
          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            setQuestions(parsed.questions)
            setAnswers(parsed.answers || {})
            setTheoryAnswers(parsed.theoryAnswers || {})
            setCurrentIndex(
              typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0
            )
            if (parsed.step === "exam") {
              setStep("exam")
            }
          }
        }
      } catch {
        // Ignore malformed draft
      } finally {
        setDraftHydrated(true)
      }
    })
  }, [])

  // Save in-progress answers & candidate details to localStorage until submitted
  React.useEffect(() => {
    if (!draftHydrated || step === "result") return
    try {
      const draft: DraftState = {
        step,
        fullName,
        email,
        phone,
        selectedRoleId,
        questions,
        currentIndex,
        answers,
        theoryAnswers,
        examEndsAt,
      }
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // Ignore storage quota errors
    }
  }, [
    draftHydrated,
    step,
    fullName,
    email,
    phone,
    selectedRoleId,
    questions,
    currentIndex,
    answers,
    theoryAnswers,
    examEndsAt,
  ])

  React.useEffect(() => {
    let active = true
    async function fetchRoles() {
      try {
        setLoadingRoles(true)
        const res = await fetch("/api/roles")
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load roles.")
        if (active) {
          setRoles(data.roles || [])
          setRolesError(null)
        }
      } catch (err) {
        if (active) {
          setRolesError(
            err instanceof Error ? err.message : "Could not connect to database."
          )
        }
      } finally {
        if (active) setLoadingRoles(false)
      }
    }
    fetchRoles()
    return () => {
      active = false
    }
  }, [])

  const selectedRole = roles.find((r) => String(r.id) === selectedRoleId)

  async function handleStartExam(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !phone.trim() || !selectedRoleId) {
      toast.add({
        title: "Missing details",
        description: "Please fill in your name, email, phone number, and role.",
        type: "error",
      })
      return
    }

    try {
      setLoadingQuestions(true)
      const res = await fetch(`/api/questions?roleId=${selectedRoleId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load questions.")

      const loaded: PublicQuestion[] = data.questions || []
      if (loaded.length === 0) {
        toast.add({
          title: "No questions available",
          description:
            "The admin has not added active questions for this role yet.",
          type: "info",
        })
        return
      }

      setQuestions(loaded)
      setAnswers({})
      setTheoryAnswers({})
      setCurrentIndex(0)
      autoSubmittedRef.current = false
      const limitMins =
        selectedRole?.effectiveTimeLimitMinutes ??
        selectedRole?.timeLimitMinutes
      if (limitMins && limitMins > 0) {
        const endsAt = Date.now() + limitMins * 60 * 1000
        setExamEndsAt(endsAt)
        setRemainingSeconds(limitMins * 60)
      } else {
        setExamEndsAt(null)
        setRemainingSeconds(null)
      }
      setStep("exam")
    } catch (err) {
      toast.add({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to start assessment.",
        type: "error",
      })
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleSubmitExam = React.useCallback(
    async (isAutoSubmit = false) => {
      try {
        setSubmitting(true)
        const payload = {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          roleId: Number(selectedRoleId),
          answers: questions.map((q) => ({
            questionId: q.id,
            selectedOptionIndex:
              q.questionType === "objective" ? (answers[q.id] ?? -1) : -1,
            theoryAnswer:
              q.questionType === "theory" ? (theoryAnswers[q.id] ?? "") : "",
          })),
        }

        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Submission failed.")

        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
        setExamEndsAt(null)
        setRemainingSeconds(null)
        setResult(data as SubmissionResult)
        setStep("result")
        toast.add({
          title: isAutoSubmit
            ? "Time's Up — Auto-Submitted!"
            : data.submission.gradingStatus === "pending_review"
              ? "Assessment Submitted!"
              : "Assessment Graded!",
          description:
            data.submission.gradingStatus === "pending_review"
              ? "Your theory answers are pending admin review. Your final score will be emailed once graded."
              : data.submission.emailSent
                ? `Your score (${data.submission.percentage}%) has been emailed to ${email}.`
                : "Your score is ready below.",
          type: "success",
        })
      } catch (err) {
        toast.add({
          title: "Submission error",
          description:
            err instanceof Error ? err.message : "Could not submit answers.",
          type: "error",
        })
      } finally {
        setSubmitting(false)
      }
    },
    [fullName, email, phone, selectedRoleId, questions, answers, theoryAnswers]
  )

  // Countdown timer that auto-submits when time expires
  React.useEffect(() => {
    if (step !== "exam" || !examEndsAt) return

    const tick = () => {
      const secs = Math.max(0, Math.ceil((examEndsAt - Date.now()) / 1000))
      setRemainingSeconds(secs)
      if (secs <= 0 && !autoSubmittedRef.current && !submitting) {
        autoSubmittedRef.current = true
        void handleSubmitExam(true)
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [step, examEndsAt, submitting, handleSubmitExam])

  function handleReset() {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setStep("register")
    setResult(null)
    setQuestions([])
    setAnswers({})
    setTheoryAnswers({})
    setExamEndsAt(null)
    setRemainingSeconds(null)
    setCurrentIndex(0)
  }

  function isQuestionAnswered(q: PublicQuestion): boolean {
    if (q.questionType === "theory") {
      return (theoryAnswers[q.id] || "").trim().length > 0
    }
    return answers[q.id] !== undefined
  }

  const answeredCount = questions.filter(isQuestionAnswered).length
  const progressPct =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0

  const currentStepNum =
    step === "register" ? 1 : step === "exam" ? 2 : 3

  const currentQuestion = questions[currentIndex]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Executive Hero Banner */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-[#062950] p-6 text-[#ecf2f8] shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-[#59a132]/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#59a132]/40 bg-[#59a132]/15 px-3 py-1 font-mono text-xs font-semibold tracking-wide text-[#59a132] uppercase">
            <Sparkles className="size-3.5" />
            TR3-G Role-Based CBT Portal
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Professional Competency Assessment
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8fa6be] sm:text-base">
            Complete your candidate profile and role-specific assessment.
            Objective questions are auto-marked immediately, while theory
            questions are scored by an administrator before your official
            report is emailed.
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-xs font-medium text-[#ecf2f8]/90">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#59a132]" />
              Role-Tailored Questions
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-[#59a132]" />
              Auto-Saved Drafts
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MailCheck className="size-4 text-[#59a132]" />
              Brevo Email Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8 grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-2 shadow-xs">
        {STEPS.map((s) => {
          const isActive = s.num === currentStepNum
          const isCompleted = s.num < currentStepNum
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : isCompleted
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isActive
                    ? "bg-card text-[#062950]"
                    : isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </div>
          )
        })}
      </div>

      {rolesError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Database Connection Needed</AlertTitle>
          <AlertDescription>{rolesError}</AlertDescription>
        </Alert>
      )}

      {/* STEP 1: REGISTRATION */}
      {step === "register" && (
        <Card className="overflow-hidden border-border bg-card shadow-md shadow-black/5">
          <CardHeader className="border-b border-border bg-secondary/40 px-6 py-5">
            <CardTitle className="flex items-center gap-2.5 text-lg text-foreground">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCheck className="size-4" />
              </div>
              Candidate Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Provide your contact details and select your assigned role to
              begin.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleStartExam}>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName" className="text-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="role" className="text-foreground">
                  Assessment Role
                </Label>
                {loadingRoles ? (
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-border px-3.5 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Loading available roles...
                  </div>
                ) : roles.length === 0 ? (
                  <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-foreground">
                    No roles have been configured yet. Please ask an
                    administrator to add roles and questions in the{" "}
                    <strong>Admin Portal</strong>.
                  </div>
                ) : (
                  <Select
                    value={selectedRoleId}
                    onValueChange={(val) => val && setSelectedRoleId(val)}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Select your role (e.g. Supervisor, Customer Service)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => {
                        const qLimit =
                          role.effectiveQuestionsPerAttempt ??
                          role.questionsPerAttempt
                        const timeLimit =
                          role.effectiveTimeLimitMinutes ??
                          role.timeLimitMinutes
                        const shownCount =
                          qLimit && qLimit > 0
                            ? Math.min(qLimit, role.activeQuestionCount)
                            : role.activeQuestionCount
                        return (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name} ({shownCount} question
                            {shownCount === 1 ? "" : "s"}
                            {timeLimit ? ` • ${timeLimit} min` : ""})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
                {selectedRole?.description ? (
                  <p className="text-xs text-muted-foreground">
                    {selectedRole.description}
                  </p>
                ) : null}
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border bg-secondary/40 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Your progress is saved locally until you submit.
              </p>
              <Button
                type="submit"
                disabled={loadingRoles || loadingQuestions || roles.length === 0}
                className="gap-2 bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
              >
                {loadingQuestions ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading Questions...
                  </>
                ) : (
                  <>
                    Start Assessment
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* STEP 2: EXAM */}
      {step === "exam" && currentQuestion && (
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{fullName}</span>
                  <Badge variant="secondary" className="bg-secondary text-primary">
                    {selectedRole?.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  {remainingSeconds !== null && (
                    <Badge
                      className={cn(
                        "gap-1.5 px-3 py-1 font-mono text-xs font-bold",
                        remainingSeconds <= 60
                          ? "animate-pulse bg-red-600 text-white hover:bg-red-600"
                          : "bg-primary text-white hover:bg-primary"
                      )}
                    >
                      <Clock className="size-3.5" />
                      {String(Math.floor(remainingSeconds / 60)).padStart(
                        2,
                        "0"
                      )}
                      :{String(remainingSeconds % 60).padStart(2, "0")}
                    </Badge>
                  )}
                  <span className="font-semibold text-primary">
                    {answeredCount} of {questions.length} answered (
                    {progressPct}%)
                  </span>
                </div>
              </div>
              <Progress value={progressPct} className="mt-3 h-2" />

              <div className="mt-4 flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = isQuestionAnswered(q)
                  const isCurrent = idx === currentIndex
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg border text-xs font-semibold transition-all",
                        isCurrent
                          ? "border-primary bg-primary text-white shadow-xs"
                          : isAnswered
                            ? "border-border bg-secondary text-primary hover:bg-primary/15"
                            : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-card shadow-md shadow-black/5">
            <CardHeader className="border-b border-border bg-secondary/30 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white hover:bg-primary">
                    Question {currentIndex + 1} of {questions.length}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-primary"
                  >
                    {currentQuestion.questionType === "theory"
                      ? "Theory (Written)"
                      : "Objective"}
                  </Badge>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {currentQuestion.points} point
                  {currentQuestion.points === 1 ? "" : "s"}
                </span>
              </div>
              <CardTitle className="mt-3 text-lg leading-relaxed text-foreground">
                {currentQuestion.prompt}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {currentQuestion.questionType === "theory" ? (
                <div className="space-y-2.5">
                  <Label
                    htmlFor={`theory-${currentQuestion.id}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground"
                  >
                    <FileText className="size-4 text-primary" />
                    Your Written Answer
                  </Label>
                  <Textarea
                    id={`theory-${currentQuestion.id}`}
                    rows={6}
                    placeholder="Write a clear, detailed response..."
                    value={theoryAnswers[currentQuestion.id] ?? ""}
                    onChange={(e) => {
                      const qId = currentQuestion.id
                      const val = e.target.value
                      setTheoryAnswers((prev) => ({ ...prev, [qId]: val }))
                    }}
                    className="resize-y border-border focus-visible:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    This theory response will be reviewed and scored by an
                    administrator before your final score email is sent.
                  </p>
                </div>
              ) : (
                <RadioGroup
                  value={
                    answers[currentQuestion.id] !== undefined
                      ? String(answers[currentQuestion.id])
                      : ""
                  }
                  onValueChange={(val) => {
                    const qId = currentQuestion.id
                    setAnswers((prev) => ({ ...prev, [qId]: Number(val) }))
                  }}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((optionText, optIdx) => {
                    const optionId = `q-${currentQuestion.id}-opt-${optIdx}`
                    const isSelected =
                      answers[currentQuestion.id] === optIdx
                    return (
                      <label
                        key={optionId}
                        htmlFor={optionId}
                        className={cn(
                          "flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary/25"
                            : "border-border bg-card hover:border-primary/50 hover:bg-secondary/30"
                        )}
                      >
                        <RadioGroupItem value={String(optIdx)} id={optionId} />
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {optionText}
                        </span>
                      </label>
                    )
                  })}
                </RadioGroup>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border bg-secondary/40 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="gap-1.5 border-border text-primary hover:bg-secondary"
              >
                <ArrowLeft className="size-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((i) =>
                        Math.min(questions.length - 1, i + 1)
                      )
                    }
                    className="gap-1.5 bg-primary text-white hover:bg-primary/90"
                  >
                    Next Question
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          type="button"
                          disabled={submitting}
                          className="gap-1.5 bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
                        />
                      }
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Submit Assessment
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Submit your assessment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          You have answered {answeredCount} out of{" "}
                          {questions.length} questions. Once submitted, your
                          answers will be recorded and your report will be sent
                          to <strong>{email}</strong> (after theory grading if
                          applicable).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Review Answers</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleSubmitExam(false)}
                          className="bg-primary text-white hover:bg-primary/90"
                        >
                          Confirm &amp; Submit
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* STEP 3: RESULT + DIGITAL ADVISOR CHIP + FULL REVIEW */}
      {step === "result" && result && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-border bg-card shadow-md shadow-black/5">
            <CardHeader className="border-b border-border bg-secondary/40 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Badge className="mb-2 bg-primary/15 text-primary hover:bg-primary/15">
                    {result.submission.roleName}
                  </Badge>
                  <CardTitle className="text-2xl text-foreground">
                    {result.submission.fullName}
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {result.submission.email} • {result.submission.phone}
                  </CardDescription>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-[#062950] to-[#0b3a6c] px-6 py-3.5 text-center text-white shadow-sm">
                  {result.submission.gradingStatus === "pending_review" ? (
                    <>
                      <div className="text-lg font-bold">Pending Theory</div>
                      <div className="text-xs font-medium text-[#8fa6be]">
                        Objective: {result.submission.score} pts so far
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-extrabold tracking-tight">
                        {result.submission.percentage}%
                      </div>
                      <div className="text-xs font-medium text-[#8fa6be]">
                        {result.submission.score} /{" "}
                        {result.submission.totalPoints} points
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <AdvisorChip
                label={result.submission.advisorChip}
                message={result.submission.advisorMessage}
              />

              {result.submission.gradingStatus === "pending_review" ? (
                <Alert className="border-border bg-primary/10 text-foreground">
                  <Clock className="size-4 text-primary" />
                  <AlertTitle>Awaiting Theory Grading</AlertTitle>
                  <AlertDescription>
                    Because this assessment includes theory questions, an
                    administrator will score your written responses before your
                    final score, Digital Advisor Chip, and review email are sent
                    to <strong>{result.submission.email}</strong> via Brevo.
                  </AlertDescription>
                </Alert>
              ) : result.submission.emailSent ? (
                <Alert className="border-border bg-secondary/60 text-foreground">
                  <MailCheck className="size-4 text-primary" />
                  <AlertTitle>Result Sent via Brevo</AlertTitle>
                  <AlertDescription>
                    A copy of your score, Digital Advisor Chip, and answer
                    review has been sent to{" "}
                    <strong>{result.submission.email}</strong>.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                  <MailWarning className="size-4 text-amber-600" />
                  <AlertTitle>Email Delivery Notice</AlertTitle>
                  <AlertDescription>
                    Your assessment was graded and saved, but the email could
                    not be sent:{" "}
                    {result.submission.emailError || "Brevo not configured."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            {result.submission.allowRetake && (
              <CardFooter className="border-t border-border bg-secondary/40 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2 border-border text-primary hover:bg-secondary"
                >
                  <RotateCcw className="size-4" />
                  Take Another Assessment
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
              <CardTitle className="text-base text-foreground">
                Submitted Answers &amp; Review
              </CardTitle>
              <CardDescription>
                Objective items are auto-marked; theory items are scored by the
                administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {result.review.map((item, idx) => (
                <div
                  key={item.questionId}
                  className={cn(
                    "rounded-xl border border-l-4 p-4",
                    item.questionType === "theory"
                      ? "border-border border-l-primary/70 bg-secondary/20"
                      : item.isCorrect
                        ? "border-border border-l-primary bg-card"
                        : "border-red-100 border-l-red-500 bg-red-50/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-foreground">
                      {idx + 1}. {item.prompt}
                    </p>
                    {item.questionType === "theory" ? (
                      <Badge className="shrink-0 bg-primary/15 text-primary hover:bg-primary/15">
                        Pending Score ({item.maxPoints} pts)
                      </Badge>
                    ) : item.isCorrect ? (
                      <Badge className="shrink-0 gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                        <CheckCircle2 className="size-3.5" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="shrink-0 gap-1">
                        <XCircle className="size-3.5" />
                        Incorrect
                      </Badge>
                    )}
                  </div>

                  {item.questionType === "theory" ? (
                    <div className="mt-2.5 rounded-lg border border-border bg-card p-3 text-sm text-foreground/90">
                      <span className="block text-xs font-semibold text-primary">
                        Your Written Answer:
                      </span>
                      {item.selectedOption}
                    </div>
                  ) : (
                    <div className="mt-2.5 grid gap-1 text-sm sm:grid-cols-2">
                      <p className="text-foreground/90">
                        <span className="font-medium text-muted-foreground">
                          Your Answer:{" "}
                        </span>
                        {item.selectedOption}
                      </p>
                      <p className="font-medium text-primary">
                        <span className="text-primary/80">Correct Answer: </span>
                        {item.correctOption}
                      </p>
                    </div>
                  )}

                  {item.explanation && item.questionType !== "theory" ? (
                    <p className="mt-2 rounded-lg bg-primary/10 p-2.5 text-xs text-foreground">
                      <strong>Advisor Note:</strong> {item.explanation}
                    </p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

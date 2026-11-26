"use client"

import * as React from "react"
import Link from "next/link"
import {
  MailCheck,
  MailWarning,
  Send,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import { AdvisorChip } from "@/components/advisor-chip"

interface SubmissionItem {
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

export function SubmissionsTable({ refreshKey }: { refreshKey: number }) {
  const [submissions, setSubmissions] = React.useState<SubmissionItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [resendingId, setResendingId] = React.useState<number | null>(null)

  const loadSubmissions = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/submissions")
      if (!res.ok) return
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions, refreshKey])

  async function handleResendEmail(id: number) {
    try {
      setResendingId(id)
      const res = await fetch(`/api/submissions/${id}`, { method: "POST" })
      const data = await res.json()
      if (res.ok && data.emailSent) {
        toast.add({
          title: "Email Sent",
          description: "Result email delivered via Brevo.",
          type: "success",
        })
      } else {
        toast.add({
          title: "Brevo Delivery Failed",
          description: data.emailError || data.error || "Check Brevo keys.",
          type: "error",
        })
      }
      await loadSubmissions()
    } finally {
      setResendingId(null)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base text-foreground">
          Candidate Submissions ({submissions.length})
        </CardTitle>
        <CardDescription>
          Auto-marked objective scores, manual theory grading, Digital Advisor
          Chips, and Brevo email delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No submissions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Advisor Chip</TableHead>
                  <TableHead>Brevo Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {sub.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sub.email} • {sub.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-primary"
                      >
                        {sub.roleName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.gradingStatus === "pending_review" ? (
                        <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                          <Clock className="size-3" />
                          Grade Theory
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-secondary text-primary hover:bg-secondary">
                          <CheckCircle2 className="size-3" />
                          Graded
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {sub.score}/{sub.totalPoints} ({sub.percentage}%)
                    </TableCell>
                    <TableCell>
                      <AdvisorChip label={sub.advisorChip} compact />
                    </TableCell>
                    <TableCell>
                      {sub.emailSent ? (
                        <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                          <MailCheck className="size-3" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-300 bg-amber-50 text-amber-800"
                          title={sub.emailError || "Not sent"}
                        >
                          <MailWarning className="size-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="space-x-1.5 text-right">
                      <Link href={`/admin/submissions/${sub.id}`}>
                        <Button
                          type="button"
                          variant={
                            sub.gradingStatus === "pending_review"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={
                            sub.gradingStatus === "pending_review"
                              ? "gap-1.5 bg-primary text-white hover:bg-primary/90"
                              : "gap-1.5 border-border text-primary hover:bg-secondary"
                          }
                        >
                          {sub.gradingStatus === "pending_review" ? (
                            <>
                              <ClipboardCheck className="size-3.5" />
                              Grade
                            </>
                          ) : (
                            <>
                              <Eye className="size-3.5" />
                              Review
                            </>
                          )}
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={
                          resendingId === sub.id ||
                          sub.gradingStatus === "pending_review"
                        }
                        onClick={() => handleResendEmail(sub.id)}
                        title={
                          sub.gradingStatus === "pending_review"
                            ? "Grade theory questions first"
                            : "Send / Resend Brevo Email"
                        }
                        className="text-primary hover:bg-secondary"
                      >
                        {resendingId === sub.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getAdvisorFeedback } from "@/lib/advisor"
import { sendScoreEmail } from "@/lib/brevo"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const submissionId = Number(id)
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return NextResponse.json(
        { error: "Invalid submission ID." },
        { status: 400 }
      )
    }

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        role: { select: { name: true } },
        answers: {
          orderBy: { id: "asc" },
          include: { question: true },
        },
      },
    })

    if (!sub) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 }
      )
    }

    const review = sub.answers.map((row) => {
      const opts = Array.isArray(row.question.options)
        ? (row.question.options as string[])
        : []
      const qType =
        row.question.questionType === "theory" ? "theory" : "objective"

      return {
        questionId: row.questionId,
        questionType: qType,
        prompt: row.question.prompt,
        selectedOption:
          qType === "theory"
            ? row.theoryAnswer || "No written answer provided"
            : row.selectedOptionIndex >= 0 &&
                row.selectedOptionIndex < opts.length
              ? opts[row.selectedOptionIndex]
              : "No answer selected",
        correctOption:
          qType === "theory"
            ? "Graded by administrator"
            : opts[row.question.correctOptionIndex] ?? "",
        theoryAnswer: row.theoryAnswer,
        pointsAwarded: row.pointsAwarded,
        maxPoints: row.question.points,
        isCorrect: row.isCorrect,
        explanation: row.question.explanation,
      }
    })

    return NextResponse.json({
      submission: {
        id: sub.id,
        fullName: sub.fullName,
        email: sub.email,
        phone: sub.phone,
        roleId: sub.roleId,
        roleName: sub.role.name,
        score: sub.score,
        totalPoints: sub.totalPoints,
        percentage: sub.percentage,
        gradingStatus: sub.gradingStatus,
        advisorChip: sub.advisorChip,
        advisorMessage: sub.advisorMessage,
        emailSent: sub.emailSent,
        emailError: sub.emailError,
        submittedAt: sub.submittedAt,
      },
      review,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load submission."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const submissionId = Number(id)
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return NextResponse.json(
        { error: "Invalid submission ID." },
        { status: 400 }
      )
    }

    const body = (await request.json()) as {
      theoryScores?: Array<{ questionId: number; pointsAwarded: number }>
    }

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        role: { select: { name: true } },
        answers: {
          orderBy: { id: "asc" },
          include: { question: true },
        },
      },
    })

    if (!sub) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 }
      )
    }

    const theoryScoreMap = new Map<number, number>()
    for (const item of body.theoryScores ?? []) {
      if (Number.isInteger(item.questionId)) {
        theoryScoreMap.set(item.questionId, Number(item.pointsAwarded) || 0)
      }
    }

    let totalScore = 0
    let totalPoints = 0
    const updatedReviewItems = []

    for (const row of sub.answers) {
      const maxPts = row.question.points
      totalPoints += maxPts

      if (row.question.questionType === "theory") {
        const rawScore = theoryScoreMap.has(row.questionId)
          ? theoryScoreMap.get(row.questionId)!
          : row.pointsAwarded
        const clamped = Math.max(0, Math.min(maxPts, Math.round(rawScore)))
        const passed = clamped >= Math.ceil(maxPts / 2)

        await prisma.submissionAnswer.update({
          where: { id: row.id },
          data: { pointsAwarded: clamped, isCorrect: passed },
        })

        totalScore += clamped
        updatedReviewItems.push({
          questionType: "theory" as const,
          prompt: row.question.prompt,
          selectedOption: row.theoryAnswer || "No written answer provided",
          correctOption: "Graded by administrator",
          isCorrect: passed,
          pointsAwarded: clamped,
          maxPoints: maxPts,
          explanation: row.question.explanation,
        })
      } else {
        const opts = Array.isArray(row.question.options)
          ? (row.question.options as string[])
          : []
        const objPoints = row.isCorrect ? maxPts : 0
        totalScore += objPoints
        updatedReviewItems.push({
          questionType: "objective" as const,
          prompt: row.question.prompt,
          selectedOption:
            row.selectedOptionIndex >= 0 &&
            row.selectedOptionIndex < opts.length
              ? opts[row.selectedOptionIndex]
              : "No answer selected",
          correctOption: opts[row.question.correctOptionIndex] ?? "",
          isCorrect: row.isCorrect,
          pointsAwarded: objPoints,
          maxPoints: maxPts,
          explanation: row.question.explanation,
        })
      }
    }

    const percentage =
      totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0
    const advisor = getAdvisorFeedback(percentage)

    const emailResult = await sendScoreEmail({
      toEmail: sub.email,
      toName: sub.fullName,
      roleName: sub.role.name,
      score: totalScore,
      totalPoints,
      percentage,
      advisorChip: advisor.chipLabel,
      advisorMessage: advisor.message,
      reviewItems: updatedReviewItems,
    })

    const updatedSub = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: totalScore,
        totalPoints,
        percentage,
        gradingStatus: "graded",
        advisorChip: advisor.chipLabel,
        advisorMessage: advisor.message,
        emailSent: emailResult.sent,
        emailError: emailResult.error ?? null,
      },
    })

    return NextResponse.json({
      submission: updatedSub,
      emailSent: emailResult.sent,
      emailError: emailResult.error ?? null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finalize grading."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const submissionId = Number(id)
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return NextResponse.json(
        { error: "Invalid submission ID." },
        { status: 400 }
      )
    }

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        role: { select: { name: true } },
        answers: {
          orderBy: { id: "asc" },
          include: { question: true },
        },
      },
    })

    if (!sub) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 }
      )
    }

    if (sub.gradingStatus === "pending_review") {
      return NextResponse.json(
        { error: "Grade the theory questions first before sending the email." },
        { status: 400 }
      )
    }

    const emailResult = await sendScoreEmail({
      toEmail: sub.email,
      toName: sub.fullName,
      roleName: sub.role.name,
      score: sub.score,
      totalPoints: sub.totalPoints,
      percentage: sub.percentage,
      advisorChip: sub.advisorChip,
      advisorMessage: sub.advisorMessage,
      reviewItems: sub.answers.map((row) => {
        const opts = Array.isArray(row.question.options)
          ? (row.question.options as string[])
          : []
        const qType =
          row.question.questionType === "theory" ? "theory" : "objective"
        return {
          questionType: qType,
          prompt: row.question.prompt,
          selectedOption:
            qType === "theory"
              ? row.theoryAnswer || "No written answer provided"
              : row.selectedOptionIndex >= 0 &&
                  row.selectedOptionIndex < opts.length
                ? opts[row.selectedOptionIndex]
                : "No answer selected",
          correctOption:
            qType === "theory"
              ? "Graded by administrator"
              : opts[row.question.correctOptionIndex] ?? "",
          isCorrect: row.isCorrect,
          pointsAwarded: row.pointsAwarded,
          maxPoints: row.question.points,
          explanation: row.question.explanation,
        }
      }),
    })

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        emailSent: emailResult.sent,
        emailError: emailResult.error ?? null,
      },
    })

    return NextResponse.json({
      emailSent: emailResult.sent,
      emailError: emailResult.error ?? null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resend email."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

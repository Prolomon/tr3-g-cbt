import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getAdvisorFeedback } from "@/lib/advisor"
import { sendScoreEmail } from "@/lib/brevo"

export async function GET(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleIdParam = searchParams.get("roleId")
    const roleId = roleIdParam ? Number(roleIdParam) : undefined

    const rows = await prisma.submission.findMany({
      where: roleId ? { roleId } : undefined,
      include: { role: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
    })

    const formatted = rows.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      roleId: s.roleId,
      roleName: s.role.name,
      score: s.score,
      totalPoints: s.totalPoints,
      percentage: s.percentage,
      gradingStatus: s.gradingStatus,
      advisorChip: s.advisorChip,
      advisorMessage: s.advisorMessage,
      emailSent: s.emailSent,
      emailError: s.emailError,
      submittedAt: s.submittedAt,
    }))

    return NextResponse.json({ submissions: formatted })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch submissions."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string
      email?: string
      phone?: string
      roleId?: number
      answers?: Array<{
        questionId: number
        selectedOptionIndex?: number
        theoryAnswer?: string
      }>
    }

    const fullName = body.fullName?.trim()
    const email = body.email?.trim()
    const phone = body.phone?.trim()
    const roleId = Number(body.roleId)
    const answersInput = Array.isArray(body.answers) ? body.answers : []

    if (
      !fullName ||
      !email ||
      !phone ||
      !Number.isInteger(roleId) ||
      roleId <= 0
    ) {
      return NextResponse.json(
        { error: "Name, email, phone number, and role are all required." },
        { status: 400 }
      )
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      return NextResponse.json(
        { error: "Selected role does not exist." },
        { status: 404 }
      )
    }

    const settings = await prisma.assessmentSettings.findUnique({
      where: { id: 1 },
    })

    const allRoleQuestions = await prisma.question.findMany({
      where: settings?.ignoreRoleFilter
        ? { isActive: true }
        : {
            isActive: true,
            OR: [{ roleId }, { roleId: null }],
          },
      orderBy: { id: "asc" },
    })

    if (allRoleQuestions.length === 0) {
      return NextResponse.json(
        { error: "No active questions found for this role." },
        { status: 400 }
      )
    }

    const answerMap = new Map<
      number,
      { selectedOptionIndex: number; theoryAnswer: string }
    >()
    const assignedOrder: number[] = []
    for (const item of answersInput) {
      if (Number.isInteger(item.questionId)) {
        if (!answerMap.has(item.questionId)) {
          assignedOrder.push(item.questionId)
        }
        answerMap.set(item.questionId, {
          selectedOptionIndex: Number.isInteger(item.selectedOptionIndex)
            ? Number(item.selectedOptionIndex)
            : -1,
          theoryAnswer:
            typeof item.theoryAnswer === "string"
              ? item.theoryAnswer.trim()
              : "",
        })
      }
    }

    // Grade only the candidate's assigned shuffled subset (or all if none specified)
    const questionById = new Map(allRoleQuestions.map((q) => [q.id, q]))
    const roleQuestions =
      assignedOrder.length > 0
        ? assignedOrder
            .map((id) => questionById.get(id))
            .filter((q): q is (typeof allRoleQuestions)[number] => Boolean(q))
        : allRoleQuestions

    if (roleQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions matched this submission." },
        { status: 400 }
      )
    }

    const hasTheory = roleQuestions.some((q) => q.questionType === "theory")

    let score = 0
    let totalPoints = 0

    const gradedItems = roleQuestions.map((q) => {
      totalPoints += q.points
      const entry = answerMap.get(q.id)
      const opts = Array.isArray(q.options) ? (q.options as string[]) : []

      if (q.questionType === "theory") {
        const written = entry?.theoryAnswer || "No written answer provided"
        return {
          questionId: q.id,
          questionType: "theory" as const,
          prompt: q.prompt,
          options: [] as string[],
          selectedOptionIndex: -1,
          theoryAnswer: entry?.theoryAnswer || "",
          correctOptionIndex: -1,
          selectedOption: written,
          correctOption: "Graded by administrator",
          isCorrect: false,
          pointsAwarded: 0,
          maxPoints: q.points,
          explanation: q.explanation,
          points: q.points,
        }
      }

      const selectedIdx = entry?.selectedOptionIndex ?? -1
      const isCorrect = selectedIdx === q.correctOptionIndex
      const pointsAwarded = isCorrect ? q.points : 0
      score += pointsAwarded

      return {
        questionId: q.id,
        questionType: "objective" as const,
        prompt: q.prompt,
        options: opts,
        selectedOptionIndex: selectedIdx,
        theoryAnswer: null as string | null,
        correctOptionIndex: q.correctOptionIndex,
        selectedOption:
          selectedIdx >= 0 && selectedIdx < opts.length
            ? opts[selectedIdx]
            : "No answer selected",
        correctOption: opts[q.correctOptionIndex] ?? "",
        isCorrect,
        pointsAwarded,
        maxPoints: q.points,
        explanation: q.explanation,
        points: q.points,
      }
    })

    const percentage =
      totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

    const gradingStatus = hasTheory ? "pending_review" : "graded"
    const advisor = hasTheory
      ? {
          tier: "practice" as const,
          chipLabel: "Pending Review",
          message:
            "Your objective questions have been auto-marked. Your theory responses are awaiting administrator grading—your final score and Digital Advisor Chip will be emailed to you once reviewed.",
        }
      : getAdvisorFeedback(percentage)

    const createdSubmission = await prisma.submission.create({
      data: {
        fullName,
        email,
        phone,
        roleId,
        score,
        totalPoints,
        percentage,
        gradingStatus,
        advisorChip: advisor.chipLabel,
        advisorMessage: advisor.message,
        emailSent: false,
        answers: {
          create: gradedItems.map((item) => ({
            questionId: item.questionId,
            selectedOptionIndex: item.selectedOptionIndex,
            theoryAnswer: item.theoryAnswer,
            pointsAwarded: item.pointsAwarded,
            isCorrect: item.isCorrect,
          })),
        },
      },
    })

    let emailSent = false
    let emailError: string | null = null

    if (!hasTheory) {
      const emailResult = await sendScoreEmail({
        toEmail: email,
        toName: fullName,
        roleName: role.name,
        score,
        totalPoints,
        percentage,
        advisorChip: advisor.chipLabel,
        advisorMessage: advisor.message,
        reviewItems: gradedItems.map((g) => ({
          questionType: g.questionType,
          prompt: g.prompt,
          selectedOption: g.selectedOption,
          correctOption: g.correctOption,
          isCorrect: g.isCorrect,
          pointsAwarded: g.pointsAwarded,
          maxPoints: g.maxPoints,
          explanation: g.explanation,
        })),
      })

      emailSent = emailResult.sent
      emailError = emailResult.error ?? null

      await prisma.submission.update({
        where: { id: createdSubmission.id },
        data: { emailSent, emailError },
      })
    }

    return NextResponse.json(
      {
        submission: {
          id: createdSubmission.id,
          fullName,
          email,
          phone,
          roleName: role.name,
          allowRetake: role.allowRetake,
          score,
          totalPoints,
          percentage,
          gradingStatus,
          advisorTier: advisor.tier,
          advisorChip: advisor.chipLabel,
          advisorMessage: advisor.message,
          emailSent,
          emailError,
          submittedAt: createdSubmission.submittedAt,
        },
        review: gradedItems,
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to grade submission."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

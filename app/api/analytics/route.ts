import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleIdParam = searchParams.get("roleId")
    const roleId = roleIdParam ? Number(roleIdParam) : undefined

    const [submissions, roles] = await Promise.all([
      prisma.submission.findMany({
        where: roleId ? { roleId } : undefined,
        include: {
          answers: { select: { isCorrect: true } },
        },
      }),
      prisma.role.findMany({
        orderBy: { name: "asc" },
        include: {
          submissions: { select: { percentage: true } },
        },
      }),
    ])

    const totalSubmissions = submissions.length
    const averagePercentage =
      totalSubmissions > 0
        ? Math.round(
            submissions.reduce((sum, s) => sum + s.percentage, 0) /
              totalSubmissions
          )
        : 0
    const emailsSentCount = submissions.filter((s) => s.emailSent).length
    const emailDeliveryRate =
      totalSubmissions > 0
        ? Math.round((emailsSentCount / totalSubmissions) * 100)
        : 0

    let totalAnswers = 0
    let correctAnswers = 0
    const advisorCounts = new Map<string, number>()

    for (const s of submissions) {
      advisorCounts.set(
        s.advisorChip,
        (advisorCounts.get(s.advisorChip) ?? 0) + 1
      )
      for (const a of s.answers) {
        totalAnswers += 1
        if (a.isCorrect) correctAnswers += 1
      }
    }

    const incorrectAnswers = Math.max(0, totalAnswers - correctAnswers)
    const correctRate =
      totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0

    const roleBreakdown = roles.map((r) => {
      const count = r.submissions.length
      const avg =
        count > 0
          ? Math.round(
              r.submissions.reduce((sum, s) => sum + s.percentage, 0) / count
            )
          : 0
      return {
        roleId: r.id,
        roleName: r.name,
        submissionsCount: count,
        averagePercentage: avg,
      }
    })

    const advisorBreakdown = Array.from(advisorCounts.entries()).map(
      ([advisorChip, count]) => ({
        advisorChip,
        count,
      })
    )

    return NextResponse.json({
      summary: {
        totalSubmissions,
        averagePercentage,
        totalAnswers,
        correctAnswers,
        incorrectAnswers,
        correctRate,
        emailsSentCount,
        emailDeliveryRate,
      },
      pieData: [
        {
          key: "correct",
          label: "Correct Answers",
          value: correctAnswers,
          fill: "var(--color-correct)",
        },
        {
          key: "incorrect",
          label: "Incorrect Answers",
          value: incorrectAnswers,
          fill: "var(--color-incorrect)",
        },
      ],
      roleBreakdown,
      advisorBreakdown,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load analytics."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

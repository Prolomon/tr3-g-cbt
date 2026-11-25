import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  try {
    const [rows, globalActiveCount] = await Promise.all([
      prisma.role.findMany({
        orderBy: { name: "asc" },
        include: {
          questions: {
            select: { id: true, isActive: true },
          },
        },
      }),
      prisma.question.count({
        where: { roleId: null, isActive: true },
      }),
    ])

    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      allowRetake: r.allowRetake,
      questionsPerAttempt: r.questionsPerAttempt,
      timeLimitMinutes: r.timeLimitMinutes,
      createdAt: r.createdAt,
      activeQuestionCount:
        r.questions.filter((q) => q.isActive).length + globalActiveCount,
      totalQuestionCount: r.questions.length,
    }))

    return NextResponse.json({ roles: formatted })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load roles."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      name?: string
      description?: string
      allowRetake?: boolean
      questionsPerAttempt?: number | null
      timeLimitMinutes?: number | null
    }

    const name = body.name?.trim()
    const description = body.description?.trim() ?? ""
    const allowRetake = Boolean(body.allowRetake)
    const questionsPerAttempt =
      typeof body.questionsPerAttempt === "number" &&
      Number.isInteger(body.questionsPerAttempt) &&
      body.questionsPerAttempt > 0
        ? body.questionsPerAttempt
        : null
    const timeLimitMinutes =
      typeof body.timeLimitMinutes === "number" &&
      Number.isInteger(body.timeLimitMinutes) &&
      body.timeLimitMinutes > 0
        ? body.timeLimitMinutes
        : null

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required." },
        { status: 400 }
      )
    }

    const created = await prisma.role.create({
      data: {
        name,
        description,
        allowRetake,
        questionsPerAttempt,
        timeLimitMinutes,
      },
    })

    return NextResponse.json({ role: created }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create role."
    const isDuplicate =
      message.toLowerCase().includes("unique") || message.includes("P2002")
    return NextResponse.json(
      { error: isDuplicate ? "A role with this name already exists." : message },
      { status: isDuplicate ? 409 : 500 }
    )
  }
}

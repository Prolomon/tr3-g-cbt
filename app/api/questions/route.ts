import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roleIdParam = searchParams.get("roleId")
    const isAdminQuery = searchParams.get("admin") === "true"

    if (isAdminQuery) {
      if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const roleId = roleIdParam ? Number(roleIdParam) : undefined
      const rows = await prisma.question.findMany({
        where: roleId ? { roleId } : undefined,
        include: { role: { select: { name: true } } },
        orderBy: { id: "asc" },
      })

      const formatted = rows.map((q) => ({
        id: q.id,
        roleId: q.roleId,
        roleName: q.role.name,
        questionType: q.questionType,
        prompt: q.prompt,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        points: q.points,
        isActive: q.isActive,
        createdAt: q.createdAt,
      }))

      return NextResponse.json({ questions: formatted })
    }

    const roleId = Number(roleIdParam)
    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json(
        { error: "A valid roleId query parameter is required." },
        { status: 400 }
      )
    }

    const rows = await prisma.question.findMany({
      where: { roleId, isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        roleId: true,
        questionType: true,
        prompt: true,
        options: true,
        points: true,
      },
    })

    const formatted = rows.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
    }))

    return NextResponse.json({ questions: formatted })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load questions."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      roleId?: number
      questionType?: string
      prompt?: string
      options?: string[]
      correctOptionIndex?: number
      explanation?: string
      points?: number
      isActive?: boolean
    }

    const roleId = Number(body.roleId)
    const questionType =
      body.questionType === "theory" ? "theory" : "objective"
    const prompt = body.prompt?.trim()
    const explanation = body.explanation?.trim() || null
    const points =
      Number.isInteger(body.points) && (body.points ?? 0) > 0
        ? Number(body.points)
        : 1
    const isActive = body.isActive ?? true

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json(
        { error: "Valid roleId is required." },
        { status: 400 }
      )
    }
    if (!prompt) {
      return NextResponse.json(
        { error: "Question prompt is required." },
        { status: 400 }
      )
    }

    let options: string[] = []
    let correctOptionIndex = -1

    if (questionType === "objective") {
      options = Array.isArray(body.options)
        ? body.options.map((o) => String(o).trim()).filter(Boolean)
        : []
      correctOptionIndex = Number(body.correctOptionIndex)

      if (options.length < 2) {
        return NextResponse.json(
          {
            error:
              "At least 2 answer options are required for objective questions.",
          },
          { status: 400 }
        )
      }
      if (
        !Number.isInteger(correctOptionIndex) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        return NextResponse.json(
          { error: "correctOptionIndex must match one of the options." },
          { status: 400 }
        )
      }
    }

    const created = await prisma.question.create({
      data: {
        roleId,
        questionType,
        prompt,
        options,
        correctOptionIndex,
        explanation,
        points,
        isActive,
      },
    })

    return NextResponse.json({ question: created }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create question."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

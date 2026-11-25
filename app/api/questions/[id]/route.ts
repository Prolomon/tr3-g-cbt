import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const questionId = Number(id)
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json(
        { error: "Invalid question ID." },
        { status: 400 }
      )
    }

    const body = (await request.json()) as {
      roleId?: number
      prompt?: string
      options?: string[]
      correctOptionIndex?: number
      explanation?: string | null
      points?: number
      isActive?: boolean
    }

    const updates: Record<string, unknown> = {}
    if (Number.isInteger(body.roleId) && (body.roleId ?? 0) > 0) {
      updates.roleId = body.roleId
    }
    if (typeof body.prompt === "string" && body.prompt.trim()) {
      updates.prompt = body.prompt.trim()
    }
    if (Array.isArray(body.options)) {
      const cleaned = body.options.map((o) => String(o).trim()).filter(Boolean)
      if (cleaned.length < 2) {
        return NextResponse.json(
          { error: "At least 2 options are required." },
          { status: 400 }
        )
      }
      updates.options = cleaned
    }
    if (typeof body.correctOptionIndex === "number") {
      updates.correctOptionIndex = body.correctOptionIndex
    }
    if (body.explanation !== undefined) {
      updates.explanation = body.explanation?.trim() || null
    }
    if (Number.isInteger(body.points) && (body.points ?? 0) > 0) {
      updates.points = body.points
    }
    if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: updates,
    })

    return NextResponse.json({ question: updated })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update question."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const questionId = Number(id)
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json(
        { error: "Invalid question ID." },
        { status: 400 }
      )
    }

    await prisma.question.delete({ where: { id: questionId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete question."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

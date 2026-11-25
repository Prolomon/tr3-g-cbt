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
    const roleId = Number(id)
    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json({ error: "Invalid role ID." }, { status: 400 })
    }

    const body = (await request.json()) as {
      name?: string
      description?: string
      allowRetake?: boolean
    }

    const updates: {
      name?: string
      description?: string
      allowRetake?: boolean
    } = {}
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim()
    }
    if (typeof body.description === "string") {
      updates.description = body.description.trim()
    }
    if (typeof body.allowRetake === "boolean") {
      updates.allowRetake = body.allowRetake
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      )
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: updates,
    })

    return NextResponse.json({ role: updated })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update role."
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
    const roleId = Number(id)
    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json({ error: "Invalid role ID." }, { status: 400 })
    }

    await prisma.role.delete({ where: { id: roleId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete role."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

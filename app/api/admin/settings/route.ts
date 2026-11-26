import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.assessmentSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load settings."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      useGeneralQuestionCount?: boolean
      generalQuestionCount?: number | null
      useGeneralTimeLimit?: boolean
      generalTimeLimitMinutes?: number | null
      useGeneralRetake?: boolean
      generalAllowRetake?: boolean
      ignoreRoleFilter?: boolean
    }

    const useGeneralQuestionCount = Boolean(body.useGeneralQuestionCount)
    const generalQuestionCount =
      typeof body.generalQuestionCount === "number" &&
      Number.isInteger(body.generalQuestionCount) &&
      body.generalQuestionCount > 0
        ? body.generalQuestionCount
        : null

    const useGeneralTimeLimit = Boolean(body.useGeneralTimeLimit)
    const generalTimeLimitMinutes =
      typeof body.generalTimeLimitMinutes === "number" &&
      Number.isInteger(body.generalTimeLimitMinutes) &&
      body.generalTimeLimitMinutes > 0
        ? body.generalTimeLimitMinutes
        : null

    const useGeneralRetake = Boolean(body.useGeneralRetake)
    const generalAllowRetake = Boolean(body.generalAllowRetake)
    const ignoreRoleFilter = Boolean(body.ignoreRoleFilter)

    const settings = await prisma.assessmentSettings.upsert({
      where: { id: 1 },
      update: {
        useGeneralQuestionCount,
        generalQuestionCount,
        useGeneralTimeLimit,
        generalTimeLimitMinutes,
        useGeneralRetake,
        generalAllowRetake,
        ignoreRoleFilter,
      },
      create: {
        id: 1,
        useGeneralQuestionCount,
        generalQuestionCount,
        useGeneralTimeLimit,
        generalTimeLimitMinutes,
        useGeneralRetake,
        generalAllowRetake,
        ignoreRoleFilter,
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update settings."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

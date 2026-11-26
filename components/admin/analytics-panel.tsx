"use client"

import * as React from "react"
import { PieChart, Pie, Cell } from "recharts"
import { Users, CheckCircle2, MailCheck, TrendingUp, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { AdvisorChip } from "@/components/advisor-chip"

interface RoleItem {
  id: number
  name: string
}

interface AnalyticsData {
  summary: {
    totalSubmissions: number
    averagePercentage: number
    totalAnswers: number
    correctAnswers: number
    incorrectAnswers: number
    correctRate: number
    emailsSentCount: number
    emailDeliveryRate: number
  }
  pieData: Array<{
    key: string
    label: string
    value: number
    fill: string
  }>
  roleBreakdown: Array<{
    roleId: number
    roleName: string
    submissionsCount: number
    averagePercentage: number
  }>
  advisorBreakdown: Array<{
    advisorChip: string
    count: number
  }>
}

const pieChartConfig = {
  correct: {
    label: "Correct Answers",
    color: "#3f7a22",
  },
  incorrect: {
    label: "Incorrect Answers",
    color: "#0b3a6c",
  },
} satisfies ChartConfig

export function AnalyticsPanel({
  roles,
  refreshKey,
}: {
  roles: RoleItem[]
  refreshKey: number
}) {
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const query = roleFilter !== "all" ? `?roleId=${roleFilter}` : ""
        const res = await fetch(`/api/analytics${query}`)
        if (!res.ok) return
        const json = (await res.json()) as AnalyticsData
        if (active) setData(json)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [roleFilter, refreshKey])

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-blue-950">
            Assessment Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Monitor answer accuracy rates, role performance, and Brevo email
            delivery.
          </p>
        </div>

        <Select
          value={roleFilter}
          onValueChange={(val) => val && setRoleFilter(val)}
        >
          <SelectTrigger className="w-56 bg-white">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">
              Total Submissions
            </CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-950">
              {loading ? "—" : summary?.totalSubmissions ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">
              Average Score
            </CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-950">
              {loading ? "—" : `${summary?.averagePercentage ?? 0}%`}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">
              Correct Answer Rate
            </CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-600">
              {loading ? "—" : `${summary?.correctRate ?? 0}%`}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {summary?.correctAnswers ?? 0} / {summary?.totalAnswers ?? 0}{" "}
              answers
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">
              Brevo Emails Sent
            </CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MailCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-950">
              {loading ? "—" : `${summary?.emailDeliveryRate ?? 0}%`}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {summary?.emailsSentCount ?? 0} delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart + Role/Advisor Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-blue-100 bg-white shadow-xs">
          <CardHeader className="border-b border-blue-50">
            <CardTitle className="text-base text-blue-950">
              Answer Rate Distribution (Pie Chart)
            </CardTitle>
            <CardDescription>
              Ratio of correct vs. incorrect answers across graded submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-blue-600" />
              </div>
            ) : (summary?.totalAnswers ?? 0) === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-sm text-slate-500">
                No graded answers yet. Submissions will appear here.
              </div>
            ) : (
              <ChartContainer
                config={pieChartConfig}
                className="mx-auto aspect-square max-h-[280px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={data?.pieData}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={55}
                    outerRadius={95}
                    strokeWidth={3}
                  >
                    {data?.pieData.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="key" />}
                    className="-translate-y-2 flex-wrap gap-3"
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-blue-100 bg-white shadow-xs">
            <CardHeader className="border-b border-blue-50">
              <CardTitle className="text-base text-blue-950">
                Performance by Role
              </CardTitle>
              <CardDescription>
                Average score and submission volume per role.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {!data?.roleBreakdown.length ? (
                <p className="text-sm text-slate-500">
                  No roles configured yet.
                </p>
              ) : (
                data.roleBreakdown.map((item) => (
                  <div key={item.roleId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-blue-950">
                        {item.roleName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.submissionsCount} submission
                        {item.submissionsCount === 1 ? "" : "s"} •{" "}
                        <strong className="text-blue-700">
                          {item.averagePercentage}%
                        </strong>
                      </span>
                    </div>
                    <Progress value={item.averagePercentage} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white shadow-xs">
            <CardHeader className="border-b border-blue-50">
              <CardTitle className="text-base text-blue-950">
                Digital Advisor Chip Summary
              </CardTitle>
              <CardDescription>
                Distribution of encouraging advisor badges awarded.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 pt-5">
              {!data?.advisorBreakdown.length ? (
                <p className="text-sm text-slate-500">
                  No advisor chips awarded yet.
                </p>
              ) : (
                data.advisorBreakdown.map((item) => (
                  <div
                    key={item.advisorChip}
                    className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2"
                  >
                    <AdvisorChip label={item.advisorChip} compact />
                    <span className="text-sm font-bold text-blue-950">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Award, Sparkles, TrendingUp, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AdvisorChipProps {
  label: string
  message?: string
  compact?: boolean
}

function getChipStyle(label: string) {
  const normalized = label.toLowerCase()
  if (normalized.includes("excellent")) {
    return {
      badge: "bg-blue-600 text-white border-blue-600",
      card: "border-blue-200 bg-blue-50/80 text-blue-950",
      icon: Sparkles,
    }
  }
  if (normalized.includes("great")) {
    return {
      badge: "bg-blue-500 text-white border-blue-500",
      card: "border-blue-200 bg-blue-50/50 text-blue-950",
      icon: Award,
    }
  }
  if (normalized.includes("better")) {
    return {
      badge: "bg-white text-blue-700 border-blue-300",
      card: "border-blue-200 bg-white text-blue-950",
      icon: TrendingUp,
    }
  }
  return {
    badge: "bg-slate-100 text-slate-800 border-slate-300",
    card: "border-slate-200 bg-slate-50 text-slate-900",
    icon: BookOpen,
  }
}

export function AdvisorChip({
  label,
  message,
  compact = false,
}: AdvisorChipProps) {
  const style = getChipStyle(label)
  const Icon = style.icon

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn("gap-1 px-2.5 py-0.5 font-semibold", style.badge)}
      >
        <Icon className="size-3" />
        <span>{label}</span>
      </Badge>
    )
  }

  return (
    <div className={cn("rounded-xl border p-4 shadow-xs", style.card)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-blue-700 uppercase">
          Digital Advisor Chip
        </span>
        <Badge
          variant="outline"
          className={cn("gap-1.5 px-3 py-1 text-xs font-bold", style.badge)}
        >
          <Icon className="size-3.5" />
          <span>{label}</span>
        </Badge>
      </div>
      {message ? (
        <p className="mt-2 text-sm leading-relaxed text-blue-900/90">
          {message}
        </p>
      ) : null}
    </div>
  )
}

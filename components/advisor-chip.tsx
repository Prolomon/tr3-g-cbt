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
      badge: "bg-[#3f7a22] text-white border-[#3f7a22]",
      card: "border-[#3f7a22]/30 bg-[#3f7a22]/10 text-foreground",
      icon: Sparkles,
    }
  }
  if (normalized.includes("great")) {
    return {
      badge: "bg-[#0b3a6c] text-white border-[#0b3a6c]",
      card: "border-[#0b3a6c]/30 bg-[#0b3a6c]/10 text-foreground",
      icon: Award,
    }
  }
  if (normalized.includes("better")) {
    return {
      badge: "bg-card text-[#3f7a22] border-[#3f7a22]/40",
      card: "border-border bg-card text-foreground",
      icon: TrendingUp,
    }
  }
  return {
    badge: "bg-secondary text-secondary-foreground border-border",
    card: "border-border bg-card text-foreground",
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

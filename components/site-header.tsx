"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, ShieldCheck, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  return (
    <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/20 transition-transform group-hover:scale-[1.02]">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-bold tracking-tight text-blue-950">
              TR3-G CBT
            </span>
            <p className="hidden text-xs font-medium text-blue-600/80 sm:block">
              Enterprise Assessment &amp; Advisor Platform
            </p>
          </div>
        </Link>

        <nav className="flex items-center rounded-xl border border-blue-100 bg-blue-50/60 p-1">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
              !isAdmin
                ? "bg-white text-blue-700 shadow-xs"
                : "text-blue-900/70 hover:text-blue-950"
            )}
          >
            <ClipboardList className="size-4" />
            <span>Public Test</span>
          </Link>
          <Link
            href="/admin"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
              isAdmin
                ? "bg-white text-blue-700 shadow-xs"
                : "text-blue-900/70 hover:text-blue-950"
            )}
          >
            <ShieldCheck className="size-4" />
            <span>Admin Portal</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

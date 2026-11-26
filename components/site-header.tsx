"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ShieldCheck, ClipboardList, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/tr3-g.webp"
            alt="TR3-G Innovations Limited"
            className="h-9 w-auto object-contain"
          />
          <div className="hidden border-l border-border pl-3 leading-tight sm:block">
            <span className="text-sm font-bold tracking-tight text-foreground">
              CBT Assessment Portal
            </span>
            <p className="font-mono text-[11px] tracking-wide text-primary uppercase">
              TR3-G Innovations
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <nav className="flex items-center rounded-xl border border-border bg-secondary/70 p-1">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
                !isAdmin
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck className="size-4" />
              <span>Admin Portal</span>
            </Link>
          </nav>

          <button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle light and dark theme"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Sun className="hidden size-4 dark:block" />
            <Moon className="block size-4 dark:hidden" />
          </button>
        </div>
      </div>
    </header>
  )
}

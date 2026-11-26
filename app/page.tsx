import { SiteHeader } from "@/components/site-header"
import { PublicCbtPortal } from "@/components/public-cbt-portal"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PublicCbtPortal />
      </main>
    </div>
  )
}

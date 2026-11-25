import { SiteHeader } from "@/components/site-header"
import { PublicCbtPortal } from "@/components/public-cbt-portal"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white">
      <SiteHeader />
      <main>
        <PublicCbtPortal />
      </main>
    </div>
  )
}

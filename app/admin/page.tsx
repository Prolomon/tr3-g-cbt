import { SiteHeader } from "@/components/site-header"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-white">
      <SiteHeader />
      <main>
        <AdminDashboard />
      </main>
    </div>
  )
}

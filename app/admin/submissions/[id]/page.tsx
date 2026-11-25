import { SiteHeader } from "@/components/site-header"
import { SubmissionReviewPage } from "@/components/admin/submission-review-page"

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-white">
      <SiteHeader />
      <main>
        <SubmissionReviewPage submissionId={id} />
      </main>
    </div>
  )
}

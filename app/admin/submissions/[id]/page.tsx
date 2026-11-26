import { SiteHeader } from "@/components/site-header"
import { SubmissionReviewPage } from "@/components/admin/submission-review-page"

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <SubmissionReviewPage submissionId={id} />
      </main>
    </div>
  )
}

export interface BrevoReviewItem {
  questionType: "objective" | "theory"
  prompt: string
  selectedOption: string
  correctOption: string
  isCorrect: boolean
  pointsAwarded: number
  maxPoints: number
  explanation?: string | null
}

export interface SendScoreEmailInput {
  toEmail: string
  toName: string
  roleName: string
  score: number
  totalPoints: number
  percentage: number
  advisorChip: string
  advisorMessage: string
  reviewItems: BrevoReviewItem[]
}

export interface SendScoreEmailResult {
  sent: boolean
  error?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Sends the candidate's CBT score, Digital Advisor Chip, and answer review
 * using the Brevo Transactional Email API v3.
 */
export async function sendScoreEmail(
  input: SendScoreEmailInput
): Promise<SendScoreEmailResult> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || "CBT Assessment Portal"

  if (!apiKey || !senderEmail) {
    return {
      sent: false,
      error:
        "Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env.local.",
    }
  }

  const reviewRowsHtml = input.reviewItems
    .map((item, idx) => {
      const statusBadge =
        item.questionType === "theory"
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:600;">Theory: ${item.pointsAwarded}/${item.maxPoints} pts</span>`
          : item.isCorrect
            ? '<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:600;">Correct</span>'
            : '<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:600;">Incorrect</span>'

      const answerLinesHtml =
        item.questionType === "theory"
          ? `<div style="font-size:13px;color:#334155;margin-top:4px;"><strong>Your Written Answer:</strong><br/>${escapeHtml(item.selectedOption)}</div>`
          : `<div style="font-size:13px;color:#334155;"><strong>Your Answer:</strong> ${escapeHtml(item.selectedOption)}</div>
             <div style="font-size:13px;color:#1d4ed8;"><strong>Correct Answer:</strong> ${escapeHtml(item.correctOption)}</div>`

      const explanationHtml = item.explanation
        ? `<p style="margin:6px 0 0;font-size:12px;color:#475569;"><strong>Note:</strong> ${escapeHtml(item.explanation)}</p>`
        : ""

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <div style="font-weight:600;color:#0f172a;margin-bottom:4px;">
              Q${idx + 1}. ${escapeHtml(item.prompt)} ${statusBadge}
            </div>
            ${answerLinesHtml}
            ${explanationHtml}
          </td>
        </tr>
      `
    })
    .join("")

  const htmlContent = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#eef2f6;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d1d9e2;border-radius:12px;overflow:hidden;">
        <div style="background:#062950;color:#ffffff;padding:24px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">Assessment Result & Advisor Review</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#8fa6be;">Role: ${escapeHtml(input.roleName)}</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;font-size:15px;color:#0a1e33;">
            Hello <strong>${escapeHtml(input.toName)}</strong>,
          </p>
          <div style="background:#f7fafc;border:1px solid #d1d9e2;border-radius:10px;padding:16px;margin-bottom:20px;">
            <div style="font-size:13px;color:#0b3a6c;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
              Your Score
            </div>
            <div style="font-size:28px;font-weight:800;color:#3f7a22;margin:4px 0;">
              ${input.score} / ${input.totalPoints} (${input.percentage}%)
            </div>
            <div style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;background:#3f7a22;color:#ffffff;font-size:12px;font-weight:700;">
              Digital Advisor Chip: ${escapeHtml(input.advisorChip)}
            </div>
            <p style="margin:10px 0 0;font-size:14px;color:#0a1e33;line-height:1.5;">
              ${escapeHtml(input.advisorMessage)}
            </p>
          </div>
          <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Question-by-Question Review</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;">
            ${reviewRowsHtml}
          </table>
        </div>
        <div style="background:#f1f5f9;padding:16px 24px;font-size:12px;color:#64748b;text-align:center;">
          Sent automatically by ${escapeHtml(senderName)}
        </div>
      </div>
    </div>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: input.toEmail, name: input.toName }],
        subject: `Your ${input.roleName} Assessment Score: ${input.percentage}% (${input.advisorChip})`,
        htmlContent,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return {
        sent: false,
        error: `Brevo API error (${response.status}): ${errText.slice(0, 200)}`,
      }
    }

    return { sent: true }
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Unknown Brevo network error",
    }
  }
}

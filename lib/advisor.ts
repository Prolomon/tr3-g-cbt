export type AdvisorTier = "excellent" | "great" | "better" | "practice"

export interface AdvisorFeedback {
  tier: AdvisorTier
  chipLabel: string
  message: string
}

/**
 * Generates a digital advisor chip label and encouraging message
 * based on the candidate's percentage score.
 */
export function getAdvisorFeedback(percentage: number): AdvisorFeedback {
  if (percentage >= 85) {
    return {
      tier: "excellent",
      chipLabel: "Excellent",
      message:
        "Outstanding mastery! Your answers demonstrate strong command and readiness for this role.",
    }
  }
  if (percentage >= 70) {
    return {
      tier: "great",
      chipLabel: "Great Job",
      message:
        "Solid performance! Review the few missed questions below to sharpen your edge even further.",
    }
  }
  if (percentage >= 50) {
    return {
      tier: "better",
      chipLabel: "You Can Do Better",
      message:
        "Good effort! Take a moment to review the correct answers below—you are well on your way to mastery.",
    }
  }
  return {
    tier: "practice",
    chipLabel: "Keep Pushing",
    message:
      "Don't be discouraged! Use the answer key and explanations below as a study guide, and come back stronger.",
  }
}

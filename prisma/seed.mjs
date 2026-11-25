import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seed() {
  const cs = await prisma.role.upsert({
    where: { name: "Customer Service" },
    update: {},
    create: {
      name: "Customer Service",
      description:
        "Frontline support, ticket resolution, and client communication",
    },
  })

  const sup = await prisma.role.upsert({
    where: { name: "Supervisor" },
    update: {},
    create: {
      name: "Supervisor",
      description:
        "Team leadership, escalation handling, and quality assurance",
    },
  })

  const tech = await prisma.role.upsert({
    where: { name: "Technical Support" },
    update: {},
    create: {
      name: "Technical Support",
      description:
        "Troubleshooting product issues and escalations (objective-only demo)",
    },
  })

  const csCount = await prisma.question.count({ where: { roleId: cs.id } })
  if (csCount === 0) {
    await prisma.question.createMany({
      data: [
        {
          roleId: cs.id,
          questionType: "objective",
          prompt:
            "When a customer reaches out visibly frustrated about a delayed order, what should you do first?",
          options: [
            "Acknowledge their frustration with empathy and apologize sincerely",
            "Immediately transfer them to another department",
            "Explain company policy before listening to their issue",
            "Ask them to send an email instead",
          ],
          correctOptionIndex: 0,
          explanation:
            "Leading with empathy de-escalates tension and builds trust before troubleshooting.",
          points: 1,
          isActive: true,
        },
        {
          roleId: cs.id,
          questionType: "objective",
          prompt:
            "Which metric best measures how quickly a support agent responds to a customer's initial inquiry?",
          options: [
            "First Response Time (FRT)",
            "Net Promoter Score (NPS)",
            "Customer Lifetime Value (CLV)",
            "Churn Rate",
          ],
          correctOptionIndex: 0,
          explanation:
            "First Response Time (FRT) tracks the time between ticket creation and the first agent reply.",
          points: 1,
          isActive: true,
        },
        {
          roleId: cs.id,
          questionType: "objective",
          prompt:
            "If you do not immediately know the answer to a customer's technical question, what is the best practice?",
          options: [
            "Guess the most likely answer so the call ends quickly",
            "Be transparent, let them know you are checking, and follow up within a clear timeframe",
            "Close the ticket without replying",
            "Tell the customer to search the FAQ themselves",
          ],
          correctOptionIndex: 1,
          explanation:
            "Transparency with a clear follow-up timeline preserves credibility and customer confidence.",
          points: 1,
          isActive: true,
        },
        {
          roleId: cs.id,
          questionType: "theory",
          prompt:
            "Describe how you would handle a VIP customer demanding an immediate refund outside the standard 14-day return window.",
          options: [],
          correctOptionIndex: -1,
          explanation:
            "Look for empathy, policy verification, checking account history, offering a constructive alternative or escalating to a supervisor.",
          points: 5,
          isActive: true,
        },
      ],
    })
  }

  const supCount = await prisma.question.count({ where: { roleId: sup.id } })
  if (supCount === 0) {
    await prisma.question.createMany({
      data: [
        {
          roleId: sup.id,
          questionType: "objective",
          prompt:
            "During a shift, two team members disagree on how to prioritize an urgent escalation. As a supervisor, what is your best first step?",
          options: [
            "Facilitate a brief, objective review based on SLA impact and customer urgency",
            "Ignore it and let them figure it out",
            "Reassign both agents to other tasks without explanation",
            "Escalate the disagreement directly to the CEO",
          ],
          correctOptionIndex: 0,
          explanation:
            "Aligning the team around SLA priority resolves conflict constructively and protects service levels.",
          points: 1,
          isActive: true,
        },
        {
          roleId: sup.id,
          questionType: "objective",
          prompt:
            "What is the primary purpose of regular 1-on-1 coaching sessions with frontline agents?",
          options: [
            "To review performance trends, give actionable feedback, and support skill growth",
            "To micromanage every single keystroke",
            "To replace team-wide announcements",
            "To reduce break times",
          ],
          correctOptionIndex: 0,
          explanation:
            "Structured coaching builds agent confidence, quality consistency, and retention.",
          points: 1,
          isActive: true,
        },
        {
          roleId: sup.id,
          questionType: "theory",
          prompt:
            "A team's average resolution time has increased by 30% over the past two weeks. Outline your step-by-step plan to diagnose and address the issue.",
          options: [],
          correctOptionIndex: -1,
          explanation:
            "Look for data/ticket audit, identifying bottlenecks, checking tool/process changes, coaching, and monitoring recovery.",
          points: 5,
          isActive: true,
        },
      ],
    })
  }

  const techCount = await prisma.question.count({ where: { roleId: tech.id } })
  if (techCount === 0) {
    await prisma.question.createMany({
      data: [
        {
          roleId: tech.id,
          questionType: "objective",
          prompt:
            "A user reports a 502 Bad Gateway error after a deployment. Which component is most likely failing to respond?",
          options: [
            "The upstream application server behind the reverse proxy",
            "The user's local keyboard driver",
            "The browser's CSS stylesheet",
            "The user's monitor resolution",
          ],
          correctOptionIndex: 0,
          explanation:
            "A 502 Bad Gateway indicates the proxy/gateway received an invalid or no response from the upstream server.",
          points: 1,
          isActive: true,
        },
        {
          roleId: tech.id,
          questionType: "objective",
          prompt:
            "What is the first thing you should verify when a user cannot log in after a password reset?",
          options: [
            "Whether they are using the newest reset link/email and caps lock is off",
            "Reinstall their operating system",
            "Delete their account immediately",
            "Ask them to wait 30 days",
          ],
          correctOptionIndex: 0,
          explanation:
            "Checking for expired reset links and input typos resolves most post-reset login issues quickly.",
          points: 1,
          isActive: true,
        },
      ],
    })
  }

  const totalRoles = await prisma.role.count()
  const totalQuestions = await prisma.question.count()
  console.log(`Seed complete! Roles: ${totalRoles}, Questions: ${totalQuestions}`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

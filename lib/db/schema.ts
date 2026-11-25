import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core"

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  questionType: text("question_type").default("objective").notNull(), // 'objective' | 'theory'
  prompt: text("prompt").notNull(),
  options: jsonb("options").$type<string[]>().default([]).notNull(),
  correctOptionIndex: integer("correct_option_index").default(-1).notNull(),
  explanation: text("explanation"),
  points: integer("points").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalPoints: integer("total_points").notNull(),
  percentage: integer("percentage").notNull(),
  gradingStatus: text("grading_status").default("graded").notNull(), // 'graded' | 'pending_review'
  advisorChip: text("advisor_chip").notNull(),
  advisorMessage: text("advisor_message").notNull(),
  emailSent: boolean("email_sent").default(false).notNull(),
  emailError: text("email_error"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
})

export const submissionAnswers = pgTable("submission_answers", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedOptionIndex: integer("selected_option_index").default(-1).notNull(),
  theoryAnswer: text("theory_answer"),
  pointsAwarded: integer("points_awarded").default(0).notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
})

export type RoleRow = typeof roles.$inferSelect
export type QuestionRow = typeof questions.$inferSelect
export type SubmissionRow = typeof submissions.$inferSelect
export type SubmissionAnswerRow = typeof submissionAnswers.$inferSelect

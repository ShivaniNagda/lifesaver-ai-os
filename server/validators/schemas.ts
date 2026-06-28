import { z } from "zod";

export const RegisterSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6)
});

export const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  dueDate: z.string().optional().default(""),
  urgency: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  status: z.enum(["pending", "completed"]).optional().default("pending"),
  completed: z.boolean().optional().default(false),
  userEmail: z.string().optional().default(""),
  notificationStatus: z.string().optional().default("pending")
});

export const GoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  category: z.string().optional().default("work"),
  targetDate: z.string().optional().default(""),
  progress: z.number().min(0).max(100).optional().default(0),
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean()
  })).optional().default([]),
  status: z.enum(["active", "completed", "delayed"]).optional().default("active")
});

export const HabitSchema = z.object({
  title: z.string().min(1),
  frequency: z.string().optional().default("daily"),
  category: z.string().optional().default("health"),
  streak: z.number().optional().default(0),
  history: z.record(z.string(), z.boolean()).optional().default({})
});

export const CalendarEventSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  category: z.enum(["work", "study", "billing", "personal"]).optional().default("work"),
  description: z.string().optional().default("")
});

export const SettingsSchema = z.object({
  workHoursStart: z.string().optional(),
  workHoursEnd: z.string().optional(),
  focusLevel: z.string().optional(),
  pushEnabled: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
  burnoutTriggers: z.boolean().optional(),
  modelType: z.string().optional(),
  disruptionGrade: z.string().optional(),
  pacingInterval: z.string().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  browserNotificationsEnabled: z.boolean().optional(),
  soundAlertsEnabled: z.boolean().optional(),
  aiSuggestionsEnabled: z.boolean().optional(),
  snoozeDuration: z.number().optional(),
  reminder24hEnabled: z.boolean().optional(),
  reminder12hEnabled: z.boolean().optional(),
  reminder6hEnabled: z.boolean().optional(),
  reminder3hEnabled: z.boolean().optional(),
  reminder1hEnabled: z.boolean().optional(),
  reminder30mEnabled: z.boolean().optional(),
  reminder10mEnabled: z.boolean().optional(),
  reminderReachedEnabled: z.boolean().optional(),
  reminderMissedEnabled: z.boolean().optional()
});

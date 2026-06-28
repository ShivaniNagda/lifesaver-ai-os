import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  urgency: "low" | "medium" | "high" | "critical";
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "completed";
  completed: boolean;
  userEmail: string;
  notificationStatus: string; // e.g. "pending", "notified_24h", "notified_3h", "notified_30m", "notified_missed"
  lastReminderSent: Date | null;
  missedReminderSent: boolean;
  emailSentHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    urgency: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    completed: { type: Boolean, default: false },
    userEmail: { type: String, default: "" },
    notificationStatus: { type: String, default: "pending" },
    lastReminderSent: { type: Date, default: null },
    missedReminderSent: { type: Boolean, default: false },
    emailSentHistory: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const TaskModel = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  userId: string;
  title: string;
  dueDate: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    dueDate: { type: String, default: "" },
    urgency: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
  },
  {
    timestamps: true,
  }
);

export const TaskModel = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

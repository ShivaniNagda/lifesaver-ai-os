import mongoose, { Schema, Document } from "mongoose";

export interface IMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface IGoal extends Document {
  userId: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  milestones: IMilestone[];
  status: "active" | "completed" | "delayed";
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const GoalSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "work" },
    targetDate: { type: String, default: "" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: [MilestoneSchema],
    status: { type: String, enum: ["active", "completed", "delayed"], default: "active" }
  },
  {
    timestamps: true,
  }
);

export const GoalModel = mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

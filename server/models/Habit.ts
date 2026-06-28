import mongoose, { Schema, Document } from "mongoose";

export interface IHabit extends Document {
  userId: string;
  title: string;
  frequency: string;
  category: string;
  streak: number;
  history: Record<string, boolean>; // Maps YYYY-MM-DD -> completed state
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    frequency: { type: String, default: "daily" },
    category: { type: String, default: "health" },
    streak: { type: Number, default: 0 },
    history: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

export const HabitModel = mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);

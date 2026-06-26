import mongoose, { Schema, Document } from "mongoose";

export interface IHabit extends Document {
  userId: string;
  title: string;
  frequency: string;
  category: string;
  streak: number;
  history: string[]; // List of YYYY-MM-DD completion dates
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
    history: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const HabitModel = mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);

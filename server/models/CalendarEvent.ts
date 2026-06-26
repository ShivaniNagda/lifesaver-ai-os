import mongoose, { Schema, Document } from "mongoose";

export interface ICalendarEvent extends Document {
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  category: "work" | "study" | "billing" | "personal";
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    category: { type: String, enum: ["work", "study", "billing", "personal"], default: "work" },
    description: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const CalendarEventModel = mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);

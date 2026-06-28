import mongoose, { Schema, Document } from "mongoose";

export interface IScheduleScan extends Document {
  userId: string;
  originalImage: string; // Base64 string or image preview data URL
  ocrText: string;       // Text extracted from the schedule
  aiOutput: string;      // JSON string representation of the AI-structured task array
  createdTasksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleScanSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    originalImage: { type: String, default: "" },
    ocrText: { type: String, default: "" },
    aiOutput: { type: String, default: "[]" },
    createdTasksCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const ScheduleScanModel = mongoose.models.ScheduleScan || mongoose.model<IScheduleScan>("ScheduleScan", ScheduleScanSchema);

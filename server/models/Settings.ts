import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  userId: string;
  workHoursStart: string;
  workHoursEnd: string;
  focusLevel: string;
  pushEnabled: boolean;
  emailAlerts: boolean;
  burnoutTriggers: boolean;
  modelType: string;
  disruptionGrade: string;
  pacingInterval: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    workHoursStart: { type: String, default: "08:00" },
    workHoursEnd: { type: String, default: "18:00" },
    focusLevel: { type: String, default: "max" },
    pushEnabled: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true },
    burnoutTriggers: { type: Boolean, default: true },
    modelType: { type: String, default: "gemini-1.5-pro" },
    disruptionGrade: { type: String, default: "high" },
    pacingInterval: { type: String, default: "45m" },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

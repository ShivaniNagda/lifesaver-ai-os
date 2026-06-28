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
  emailNotificationsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  soundAlertsEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  snoozeDuration: number;
  reminder24hEnabled: boolean;
  reminder12hEnabled: boolean;
  reminder6hEnabled: boolean;
  reminder3hEnabled: boolean;
  reminder1hEnabled: boolean;
  reminder30mEnabled: boolean;
  reminder10mEnabled: boolean;
  reminderReachedEnabled: boolean;
  reminderMissedEnabled: boolean;
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
    emailNotificationsEnabled: { type: Boolean, default: true },
    browserNotificationsEnabled: { type: Boolean, default: true },
    soundAlertsEnabled: { type: Boolean, default: true },
    aiSuggestionsEnabled: { type: Boolean, default: true },
    snoozeDuration: { type: Number, default: 15 },
    reminder24hEnabled: { type: Boolean, default: true },
    reminder12hEnabled: { type: Boolean, default: true },
    reminder6hEnabled: { type: Boolean, default: true },
    reminder3hEnabled: { type: Boolean, default: true },
    reminder1hEnabled: { type: Boolean, default: true },
    reminder30mEnabled: { type: Boolean, default: true },
    reminder10mEnabled: { type: Boolean, default: true },
    reminderReachedEnabled: { type: Boolean, default: true },
    reminderMissedEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string;
  taskId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  deliveryStatus: string;
  emailSent: boolean;
  browserSent: boolean;
  soundPlayed: boolean;
  aiRecoveryPlan: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    taskId: { type: String, default: "" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    read: { type: Boolean, default: false },
    deliveryStatus: { type: String, default: "delivered" },
    emailSent: { type: Boolean, default: false },
    browserSent: { type: Boolean, default: false },
    soundPlayed: { type: Boolean, default: false },
    aiRecoveryPlan: { type: String, default: "" },
    priority: { type: String, default: "medium" },
  },
  {
    timestamps: true,
  }
);

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

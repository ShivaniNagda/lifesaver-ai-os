import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  microAction?: string;
  timestamp: string;
}

export interface IAIConversation extends Document {
  userId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  microAction: { type: String, default: "" },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

const AIConversationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    messages: [ChatMessageSchema],
  },
  {
    timestamps: true,
  }
);

export const AIConversationModel = mongoose.models.AIConversation || mongoose.model<IAIConversation>("AIConversation", AIConversationSchema);

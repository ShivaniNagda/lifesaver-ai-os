import mongoose, { Schema, Document } from "mongoose";

export interface IAgentLog extends Document {
  userId: string;
  agent: string;
  message: string;
  timestamp: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentLogSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    agent: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: String, default: "NOW" },
  },
  {
    timestamps: true,
  }
);

export const AgentLogModel = mongoose.models.AgentLog || mongoose.model<IAgentLog>("AgentLog", AgentLogSchema);

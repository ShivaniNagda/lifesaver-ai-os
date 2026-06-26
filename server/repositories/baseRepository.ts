import { getIsMongoConnected } from "../config/db";
import { JsonDb } from "../utils/jsonDb";
import { UserModel } from "../models/User";
import { TaskModel } from "../models/Task";
import { GoalModel } from "../models/Goal";
import { HabitModel } from "../models/Habit";
import { CalendarEventModel } from "../models/CalendarEvent";
import { NotificationModel } from "../models/Notification";
import { SettingsModel } from "../models/Settings";
import { AgentLogModel } from "../models/AgentLog";
import { AIConversationModel } from "../models/AIConversation";

export class BaseRepository<M extends any, T extends { id?: string; _id?: string; createdAt?: Date | string; updatedAt?: Date | string }> {
  private jsonDb: JsonDb<any>;
  private mongooseModel: any;

  constructor(collectionName: string, mongooseModel: any) {
    this.jsonDb = new JsonDb<any>(collectionName);
    this.mongooseModel = mongooseModel;
  }

  public async find(query: any = {}): Promise<any[]> {
    if (getIsMongoConnected()) {
      return this.mongooseModel.find(query).lean();
    } else {
      const dbQuery: any = {};
      for (const k in query) {
        if (typeof query[k] === "object" && query[k] !== null && "$oid" in query[k]) {
          dbQuery[k] = query[k].$oid;
        } else {
          dbQuery[k] = query[k];
        }
      }
      return this.jsonDb.find(dbQuery);
    }
  }

  public async findOne(query: any): Promise<any | null> {
    if (getIsMongoConnected()) {
      return this.mongooseModel.findOne(query).lean();
    } else {
      return this.jsonDb.findOne(query);
    }
  }

  public async findById(id: string): Promise<any | null> {
    if (getIsMongoConnected()) {
      return this.mongooseModel.findById(id).lean();
    } else {
      return this.jsonDb.findById(id);
    }
  }

  public async create(data: any): Promise<any> {
    if (getIsMongoConnected()) {
      const doc = new this.mongooseModel(data);
      await doc.save();
      return doc.toObject();
    } else {
      return this.jsonDb.create(data);
    }
  }

  public async findByIdAndUpdate(id: string, update: any): Promise<any | null> {
    if (getIsMongoConnected()) {
      return this.mongooseModel.findByIdAndUpdate(id, update, { new: true }).lean();
    } else {
      return this.jsonDb.findByIdAndUpdate(id, update);
    }
  }

  public async findOneAndUpdate(query: any, update: any): Promise<any | null> {
    if (getIsMongoConnected()) {
      return this.mongooseModel.findOneAndUpdate(query, update, { new: true, upsert: true }).lean();
    } else {
      const existing = await this.jsonDb.findOne(query);
      if (existing) {
        return this.jsonDb.findByIdAndUpdate(existing.id, update);
      } else {
        return this.jsonDb.create({ ...query, ...update });
      }
    }
  }

  public async findByIdAndDelete(id: string): Promise<any | null> {
    if (getIsMongoConnected()) {
      return this.mongooseModel.findByIdAndDelete(id).lean();
    } else {
      return this.jsonDb.findByIdAndDelete(id);
    }
  }

  public async deleteMany(query: any): Promise<{ deletedCount: number }> {
    if (getIsMongoConnected()) {
      const result = await this.mongooseModel.deleteMany(query);
      return { deletedCount: result.deletedCount || 0 };
    } else {
      return this.jsonDb.deleteMany(query);
    }
  }
}

export const UserRepository = new BaseRepository("users", UserModel);
export const TaskRepository = new BaseRepository("tasks", TaskModel);
export const GoalRepository = new BaseRepository("goals", GoalModel);
export const HabitRepository = new BaseRepository("habits", HabitModel);
export const CalendarEventRepository = new BaseRepository("calendar_events", CalendarEventModel);
export const NotificationRepository = new BaseRepository("notifications", NotificationModel);
export const SettingsRepository = new BaseRepository("settings", SettingsModel);
export const AgentLogRepository = new BaseRepository("agent_logs", AgentLogModel);
export const AIConversationRepository = new BaseRepository("ai_conversations", AIConversationModel);

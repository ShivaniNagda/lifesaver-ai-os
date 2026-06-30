import mongoose from "mongoose";
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
import { ScheduleScanModel } from "../models/ScheduleScan";

export class BaseRepository<M extends any, T extends { id?: string; _id?: string; createdAt?: Date | string; updatedAt?: Date | string }> {
  private jsonDb: JsonDb<any>;
  private mongooseModel: any;

  constructor(collectionName: string, mongooseModel: any) {
    this.jsonDb = new JsonDb<any>(collectionName);
    this.mongooseModel = mongooseModel;
  }

  public async find(query: any = {}): Promise<any[]> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository find Called] Collection: ${this.mongooseModel.modelName || 'LocalJSON'} | Connection: ${isMongo ? 'MongoDB' : 'Fallback Local JSON'} | Query:`, JSON.stringify(query));
    if (isMongo) {
      try {
        const results = await this.mongooseModel.find(query).lean();
        console.log(`[Repository find Successful] Found ${results.length} items in MongoDB.`);
        return results.map((r: any) => r ? { ...r, id: r._id.toString() } : r);
      } catch (err: any) {
        console.error(`[Repository find Failed] MongoDB find error:`, err);
        throw err;
      }
    } else {
      const dbQuery: any = {};
      for (const k in query) {
        if (typeof query[k] === "object" && query[k] !== null && "$oid" in query[k]) {
          dbQuery[k] = query[k].$oid;
        } else {
          dbQuery[k] = query[k];
        }
      }
      const results = await this.jsonDb.find(dbQuery);
      console.log(`[Repository find Successful] Found ${results.length} items in Fallback Local JSON file.`);
      return results;
    }
  }

  public async findOne(query: any): Promise<any | null> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository findOne Called] Collection: ${this.mongooseModel.modelName || 'LocalJSON'} | Connection: ${isMongo ? 'MongoDB' : 'Fallback Local JSON'} | Query:`, JSON.stringify(query));
    if (isMongo) {
      try {
        const result = await this.mongooseModel.findOne(query).lean();
        console.log(`[Repository findOne Successful] Found item: ${result ? (result._id || result.id) : 'null'}`);
        return result ? { ...result, id: result._id.toString() } : null;
      } catch (err: any) {
        console.error(`[Repository findOne Failed] MongoDB findOne error:`, err);
        throw err;
      }
    } else {
      const result = await this.jsonDb.findOne(query);
      console.log(`[Repository findOne Successful] Found item: ${result ? result.id : 'null'}`);
      return result;
    }
  }

  public async findById(id: string): Promise<any | null> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository findById Called] Collection: ${this.mongooseModel.modelName || 'LocalJSON'} | Connection: ${isMongo ? 'MongoDB' : 'Fallback Local JSON'} | ID: ${id}`);
    if (isMongo) {
      if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        console.log(`[Repository findById] ID is not a valid ObjectId: "${id}". Returning null.`);
        return null;
      }
      try {
        const result = await this.mongooseModel.findById(id).lean();
        console.log(`[Repository findById Successful] Found item: ${result ? 'yes' : 'no'}`);
        return result ? { ...result, id: result._id.toString() } : null;
      } catch (err: any) {
        console.error(`[Repository findById Failed] MongoDB findById error:`, err);
        throw err;
      }
    } else {
      const result = await this.jsonDb.findById(id);
      console.log(`[Repository findById Successful] Found item: ${result ? 'yes' : 'no'}`);
      return result;
    }
  }

  public async create(data: any): Promise<any> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository Save Called] Collection: ${this.mongooseModel.modelName || 'LocalJSON'} | Connection: ${isMongo ? 'MongoDB' : 'Fallback Local JSON'} | Payload:`, JSON.stringify(data));
    if (isMongo) {
      try {
        const doc = new this.mongooseModel(data);
        await doc.save();
        console.log(`[Repository Save Successful] Successfully stored document in MongoDB. ID: ${doc._id}`);
        const obj = doc.toObject();
        return { ...obj, id: obj._id.toString() };
      } catch (err: any) {
        console.error(`[Repository Save Failed] MongoDB doc.save() error:`, err, "Attempting self-healing fallback to local JSON db...");
        try {
          const doc = await this.jsonDb.create(data);
          console.log(`[Repository Save Fallback Successful] Successfully saved item in Fallback Local JSON database. ID: ${doc.id}`);
          return doc;
        } catch (fallbackErr: any) {
          console.error(`[Repository Save Fallback Failed] Local JSON database write error:`, fallbackErr);
          throw err;
        }
      }
    } else {
      try {
        const doc = await this.jsonDb.create(data);
        console.log(`[Repository Save Successful] Successfully stored item in Fallback Local JSON database. ID: ${doc.id}`);
        return doc;
      } catch (err: any) {
        console.error(`[Repository Save Failed] Local JSON database write error:`, err);
        throw err;
      }
    }
  }

  public async findByIdAndUpdate(id: string, update: any): Promise<any | null> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository findByIdAndUpdate Called] Collection: ${this.mongooseModel.modelName || 'LocalJSON'} | Connection: ${isMongo ? 'MongoDB' : 'Fallback Local JSON'} | ID: ${id} | Update:`, JSON.stringify(update));
    if (isMongo) {
      if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        console.log(`[Repository findByIdAndUpdate] ID is not a valid ObjectId: "${id}". Returning null.`);
        return null;
      }
      try {
        const result = await this.mongooseModel.findByIdAndUpdate(id, update, { new: true }).lean();
        console.log(`[Repository findByIdAndUpdate Successful] Updated in MongoDB: ${result ? 'yes' : 'no'}`);
        return result ? { ...result, id: result._id.toString() } : null;
      } catch (err: any) {
        console.error(`[Repository findByIdAndUpdate Failed] MongoDB error:`, err);
        throw err;
      }
    } else {
      const result = await this.jsonDb.findByIdAndUpdate(id, update);
      console.log(`[Repository findByIdAndUpdate Successful] Updated in Fallback Local JSON: ${result ? 'yes' : 'no'}`);
      return result;
    }
  }

  public async findOneAndUpdate(query: any, update: any): Promise<any | null> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository findOneAndUpdate Called] Collection: ${this.mongooseModel.modelName || 'LocalJSON'} | Connection: ${isMongo ? 'MongoDB' : 'Fallback Local JSON'} | Query:`, JSON.stringify(query));
    if (isMongo) {
      try {
        const result = await this.mongooseModel.findOneAndUpdate(query, update, { new: true, upsert: true }).lean();
        console.log(`[Repository findOneAndUpdate Successful] Handled in MongoDB.`);
        return result ? { ...result, id: result._id.toString() } : null;
      } catch (err: any) {
        console.error(`[Repository findOneAndUpdate Failed] MongoDB error:`, err);
        throw err;
      }
    } else {
      const existing = await this.jsonDb.findOne(query);
      if (existing) {
        const result = await this.jsonDb.findByIdAndUpdate(existing.id, update);
        console.log(`[Repository findOneAndUpdate Successful] Handled existing in Fallback Local JSON.`);
        return result;
      } else {
        const result = await this.jsonDb.create({ ...query, ...update });
        console.log(`[Repository findOneAndUpdate Successful] Created new in Fallback Local JSON.`);
        return result;
      }
    }
  }

  public async findByIdAndDelete(id: string): Promise<any | null> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository findByIdAndDelete Called] ID: ${id}`);
    if (isMongo) {
      if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        console.log(`[Repository findByIdAndDelete] ID is not a valid ObjectId: "${id}". Returning null.`);
        return null;
      }
      try {
        const result = await this.mongooseModel.findByIdAndDelete(id).lean();
        console.log(`[Repository findByIdAndDelete Successful] Deleted in MongoDB: ${result ? 'yes' : 'no'}`);
        return result ? { ...result, id: result._id.toString() } : null;
      } catch (err: any) {
        console.error(`[Repository findByIdAndDelete Failed] MongoDB error:`, err);
        throw err;
      }
    } else {
      const result = await this.jsonDb.findByIdAndDelete(id);
      console.log(`[Repository findByIdAndDelete Successful] Deleted in Fallback Local JSON: ${result ? 'yes' : 'no'}`);
      return result;
    }
  }

  public async deleteMany(query: any): Promise<{ deletedCount: number }> {
    const isMongo = getIsMongoConnected();
    console.log(`[Repository deleteMany Called] Query:`, JSON.stringify(query));
    if (isMongo) {
      try {
        const result = await this.mongooseModel.deleteMany(query);
        console.log(`[Repository deleteMany Successful] MongoDB deleted: ${result.deletedCount || 0}`);
        return { deletedCount: result.deletedCount || 0 };
      } catch (err: any) {
        console.error(`[Repository deleteMany Failed] MongoDB error:`, err);
        throw err;
      }
    } else {
      const result = await this.jsonDb.deleteMany(query);
      console.log(`[Repository deleteMany Successful] Fallback Local JSON deleted: ${result.deletedCount}`);
      return result;
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
export const ScheduleScanRepository = new BaseRepository("schedule_scans", ScheduleScanModel);

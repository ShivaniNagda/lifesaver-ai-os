import mongoose from "mongoose";

let isMongoConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("[Database Console] MONGODB_URI is not defined. Falling back to robust local JSON persistence.");
    isMongoConnected = false;
    return false;
  }

  try {
    console.log("[Database Console] Attempting connection to MongoDB...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000, // Fast timeout to avoid long hangs
    });
    isMongoConnected = true;
    console.log("[Database Console] MongoDB connected successfully.");

    // Clean up any rigid unique indexes on collections to prevent save failures due to index collisions
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        const collectionsToDropIndexes = [
          "agent_logs", "agentlogs", "tasks", "goals", "habits", 
          "calendar_events", "calendarevents", "notifications", "settings",
          "ai_conversations", "aiconversations", "schedule_scans", "schedulescans"
        ];

        for (const colName of collectionsToDropIndexes) {
          if (collectionNames.includes(colName)) {
            try {
              await db.collection(colName).dropIndexes();
              console.log(`[Database Console] Cleaned indexes on collection "${colName}".`);
            } catch (err: any) {
              // Ignore if there's no indexes to drop or index doesn't exist
            }
          }
        }
      }
    } catch (indexErr: any) {
      console.warn("[Database Console] Non-blocking index cleanup warning:", indexErr.message || indexErr);
    }

    return true;
  } catch (error: any) {
    console.warn(`[Database Console] Connection to MongoDB failed: ${error.message || error}. Falling back to local JSON persistence.`);
    isMongoConnected = false;
    return false;
  }
}

export function getIsMongoConnected(): boolean {
  return isMongoConnected;
}

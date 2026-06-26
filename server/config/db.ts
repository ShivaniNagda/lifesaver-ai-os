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

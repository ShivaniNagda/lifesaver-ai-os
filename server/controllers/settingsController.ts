import { Response } from "express";
import { SettingsRepository, UserRepository } from "../repositories/baseRepository";
import { SettingsSchema } from "../validators/schemas";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { getIsMongoConnected } from "../config/db";

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    let settings = await SettingsRepository.findOne({ userId });
    if (!settings) {
      // Create default settings if they don't exist
      settings = await SettingsRepository.create({
        userId,
        workHoursStart: "08:00",
        workHoursEnd: "18:00",
        focusLevel: "max",
        pushEnabled: true,
        emailAlerts: true,
        burnoutTriggers: true,
        modelType: "gemini-1.5-pro",
        disruptionGrade: "high",
        pacingInterval: "45m"
      });
    }
    const settingsObj = (settings && typeof settings.toObject === "function") ? settings.toObject() : settings;
    return res.json({
      ...settingsObj,
      isMongoConnected: getIsMongoConnected()
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch settings." });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = SettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.format() });
    }

    let settings = await SettingsRepository.findOne({ userId });
    if (!settings) {
      settings = await SettingsRepository.create({
        userId,
        ...parsed.data
      });
    } else {
      settings = await SettingsRepository.findOneAndUpdate({ userId }, parsed.data);
    }
    const settingsObj = (settings && typeof settings.toObject === "function") ? settings.toObject() : settings;
    return res.json({
      ...settingsObj,
      isMongoConnected: getIsMongoConnected()
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update settings." });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { username, role } = req.body;
    const updateObj: any = {};
    if (username) updateObj.username = username;
    if (role) updateObj.role = role;

    const user = await UserRepository.findByIdAndUpdate(userId, updateObj);
    return res.json({
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update profile." });
  }
}

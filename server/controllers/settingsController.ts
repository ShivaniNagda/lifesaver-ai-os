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
        pacingInterval: "45m",
        emailNotificationsEnabled: true,
        browserNotificationsEnabled: true,
        soundAlertsEnabled: true,
        aiSuggestionsEnabled: true,
        snoozeDuration: 15,
        reminder24hEnabled: true,
        reminder12hEnabled: true,
        reminder6hEnabled: true,
        reminder3hEnabled: true,
        reminder1hEnabled: true,
        reminder30mEnabled: true,
        reminder10mEnabled: true,
        reminderReachedEnabled: true,
        reminderMissedEnabled: true
      });
    }
    const settingsObj = (settings && typeof settings.toObject === "function") ? settings.toObject() : settings;
    return res.json({
      ...settingsObj,
      isMongoConnected: getIsMongoConnected(),
      smtpConfigStatus: {
        EMAIL_SERVICE: process.env.EMAIL_SERVICE || "",
        EMAIL_HOST: process.env.EMAIL_HOST || "",
        EMAIL_PORT: process.env.EMAIL_PORT || "",
        EMAIL_USER: process.env.EMAIL_USER || "",
        isPassConfigured: !!process.env.EMAIL_PASS
      }
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
      isMongoConnected: getIsMongoConnected(),
      smtpConfigStatus: {
        EMAIL_SERVICE: process.env.EMAIL_SERVICE || "",
        EMAIL_HOST: process.env.EMAIL_HOST || "",
        EMAIL_PORT: process.env.EMAIL_PORT || "",
        EMAIL_USER: process.env.EMAIL_USER || "",
        isPassConfigured: !!process.env.EMAIL_PASS
      }
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
      role: user.role,
      profileImage: user.profileImage || ""
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update profile." });
  }
}

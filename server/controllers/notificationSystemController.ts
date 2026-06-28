import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { getSentEmailsHistory, sendNotificationEmail, buildSaaSEmailHTML, checkAndSendReminders } from "../services/notificationService";
import { SettingsRepository, UserRepository } from "../repositories/baseRepository";

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const history = await getSentEmailsHistory(userId);
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch email notification history" });
  }
}

export async function sendTestEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await UserRepository.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const aiRec = "You have integrated the notification settings successfully! This test email verifies that your automated email dispatch triggers, handles local development queues gracefully, and logs status data perfectly.";
    const subject = "⚡ LifeSaver OS: Smart Deadline Notification Test Run";
    const html = buildSaaSEmailHTML(
      user.username || "Executive",
      "Deploy Smart Notification Core Engine",
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      "critical",
      "48 hours remaining (Live Preview)",
      aiRec,
      subject
    );

    const ok = await sendNotificationEmail(userId, user.email, subject, html, "Deploy Smart Notification Core Engine", "test_email");
    return res.json({ success: ok, message: "Test email trigger completed", email: user.email });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to send test email" });
  }
}

export async function updatePreferences(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      emailNotificationsEnabled,
      browserNotificationsEnabled,
      soundAlertsEnabled,
      aiSuggestionsEnabled,
      snoozeDuration,
      reminder24hEnabled,
      reminder12hEnabled,
      reminder6hEnabled,
      reminder3hEnabled,
      reminder1hEnabled,
      reminder30mEnabled,
      reminder10mEnabled,
      reminderReachedEnabled,
      reminderMissedEnabled
    } = req.body;

    const updateData: any = {};
    if (emailNotificationsEnabled !== undefined) updateData.emailNotificationsEnabled = emailNotificationsEnabled;
    if (browserNotificationsEnabled !== undefined) updateData.browserNotificationsEnabled = browserNotificationsEnabled;
    if (soundAlertsEnabled !== undefined) updateData.soundAlertsEnabled = soundAlertsEnabled;
    if (aiSuggestionsEnabled !== undefined) updateData.aiSuggestionsEnabled = aiSuggestionsEnabled;
    if (snoozeDuration !== undefined) updateData.snoozeDuration = snoozeDuration;
    if (reminder24hEnabled !== undefined) updateData.reminder24hEnabled = reminder24hEnabled;
    if (reminder12hEnabled !== undefined) updateData.reminder12hEnabled = reminder12hEnabled;
    if (reminder6hEnabled !== undefined) updateData.reminder6hEnabled = reminder6hEnabled;
    if (reminder3hEnabled !== undefined) updateData.reminder3hEnabled = reminder3hEnabled;
    if (reminder1hEnabled !== undefined) updateData.reminder1hEnabled = reminder1hEnabled;
    if (reminder30mEnabled !== undefined) updateData.reminder30mEnabled = reminder30mEnabled;
    if (reminder10mEnabled !== undefined) updateData.reminder10mEnabled = reminder10mEnabled;
    if (reminderReachedEnabled !== undefined) updateData.reminderReachedEnabled = reminderReachedEnabled;
    if (reminderMissedEnabled !== undefined) updateData.reminderMissedEnabled = reminderMissedEnabled;

    let settings = await SettingsRepository.findOne({ userId });
    if (!settings) {
      settings = await SettingsRepository.create({
        userId,
        ...updateData
      });
    } else {
      settings = await SettingsRepository.findOneAndUpdate({ userId }, updateData);
    }

    return res.json(settings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update notification settings" });
  }
}

export async function triggerManualCheck(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Run the reminder checks
    await checkAndSendReminders();

    return res.json({ message: "Manual deadline reminder check completed successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Manual check trigger failed" });
  }
}

import { Response } from "express";
import { NotificationRepository } from "../repositories/baseRepository";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await NotificationRepository.find({ userId });
    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch notifications." });
  }
}

export async function createNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const newNotification = await NotificationRepository.create({
      userId,
      title: req.body.title || "Alert",
      message: req.body.message || "",
      type: req.body.type || "info",
      read: false
    });
    return res.status(201).json(newNotification);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create notification." });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notification = await NotificationRepository.findById(id);
    if (!notification) return res.status(404).json({ error: "Notification not found." });
    if (notification.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    const updated = await NotificationRepository.findByIdAndUpdate(id, { read: true });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to mark notification as read." });
  }
}

export async function deleteNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notification = await NotificationRepository.findById(id);
    if (!notification) return res.status(404).json({ error: "Notification not found." });
    if (notification.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    await NotificationRepository.findByIdAndDelete(id);
    return res.json({ message: "Notification deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete notification." });
  }
}

export async function updateDeliveryStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { browserSent, soundPlayed, deliveryStatus } = req.body;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notification = await NotificationRepository.findById(id);
    if (!notification) return res.status(404).json({ error: "Notification not found." });
    if (notification.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    const updateObj: any = {};
    if (browserSent !== undefined) updateObj.browserSent = browserSent;
    if (soundPlayed !== undefined) updateObj.soundPlayed = soundPlayed;
    if (deliveryStatus !== undefined) updateObj.deliveryStatus = deliveryStatus;

    const updated = await NotificationRepository.findByIdAndUpdate(id, updateObj);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update delivery status." });
  }
}

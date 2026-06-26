import { Response } from "express";
import { CalendarEventRepository } from "../repositories/baseRepository";
import { CalendarEventSchema } from "../validators/schemas";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export async function getEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const events = await CalendarEventRepository.find({ userId });
    return res.json(events);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch calendar events." });
  }
}

export async function createEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = CalendarEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.format() });
    }

    const newEvent = await CalendarEventRepository.create({
      userId,
      ...parsed.data
    });
    return res.status(201).json(newEvent);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create calendar event." });
  }
}

export async function updateEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const event = await CalendarEventRepository.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    const updatedEvent = await CalendarEventRepository.findByIdAndUpdate(id, req.body);
    return res.json(updatedEvent);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update calendar event." });
  }
}

export async function deleteEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const event = await CalendarEventRepository.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    await CalendarEventRepository.findByIdAndDelete(id);
    return res.json({ message: "Calendar event deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete calendar event." });
  }
}

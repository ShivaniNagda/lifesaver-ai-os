import { Response } from "express";
import { HabitRepository } from "../repositories/baseRepository";
import { HabitSchema } from "../validators/schemas";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export async function getHabits(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const habits = await HabitRepository.find({ userId });
    return res.json(habits);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch habits." });
  }
}

export async function createHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = HabitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.format() });
    }

    const newHabit = await HabitRepository.create({
      userId,
      ...parsed.data
    });
    return res.status(201).json(newHabit);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create habit." });
  }
}

export async function updateHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const habit = await HabitRepository.findById(id);
    if (!habit) return res.status(404).json({ error: "Habit not found." });
    if (habit.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    const updatedHabit = await HabitRepository.findByIdAndUpdate(id, req.body);
    return res.json(updatedHabit);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update habit." });
  }
}

export async function deleteHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const habit = await HabitRepository.findById(id);
    if (!habit) return res.status(404).json({ error: "Habit not found." });
    if (habit.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    await HabitRepository.findByIdAndDelete(id);
    return res.json({ message: "Habit deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete habit." });
  }
}

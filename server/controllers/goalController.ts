import { Response } from "express";
import { GoalRepository } from "../repositories/baseRepository";
import { GoalSchema } from "../validators/schemas";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export async function getGoals(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const goals = await GoalRepository.find({ userId });
    return res.json(goals);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch goals." });
  }
}

export async function createGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = GoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.format() });
    }

    const newGoal = await GoalRepository.create({
      userId,
      ...parsed.data
    });
    return res.status(201).json(newGoal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create goal." });
  }
}

export async function updateGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const goal = await GoalRepository.findById(id);
    if (!goal) return res.status(404).json({ error: "Goal not found." });
    if (goal.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    const updatedGoal = await GoalRepository.findByIdAndUpdate(id, req.body);
    return res.json(updatedGoal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update goal." });
  }
}

export async function deleteGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const goal = await GoalRepository.findById(id);
    if (!goal) return res.status(404).json({ error: "Goal not found." });
    if (goal.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    await GoalRepository.findByIdAndDelete(id);
    return res.json({ message: "Goal deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete goal." });
  }
}

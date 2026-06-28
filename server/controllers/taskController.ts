import { Response } from "express";
import { TaskRepository } from "../repositories/baseRepository";
import { TaskSchema } from "../validators/schemas";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export async function getTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const tasks = await TaskRepository.find({ userId });
    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch tasks." });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  console.log(`[Controller Entered] createTask | User: ${req.user?.email || 'Unknown'}`);
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.warn(`[Controller Blocked] No userId found in req.user`);
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`[Controller req.body] Payload:`, JSON.stringify(req.body));
    const parsed = TaskSchema.safeParse(req.body);
    if (!parsed.success) {
      console.warn(`[Controller Validation Failed] Errors:`, parsed.error.format());
      return res.status(400).json({ error: "Validation failed", details: parsed.error.format() });
    }

    console.log(`[Controller Validation Passed] Validated Data:`, JSON.stringify(parsed.data));
    const newTask = await TaskRepository.create({
      userId,
      ...parsed.data
    });
    
    console.log(`[Controller Response Returned] Status: 201 | Created Task ID: ${newTask.id || newTask._id}`);
    return res.status(201).json(newTask);
  } catch (error: any) {
    console.error(`[Controller Failed] createTask error:`, error);
    return res.status(500).json({ error: error.message || "Failed to create task." });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const task = await TaskRepository.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found." });
    if (task.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    const updatedTask = await TaskRepository.findByIdAndUpdate(id, req.body);
    return res.json(updatedTask);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update task." });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const task = await TaskRepository.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found." });
    if (task.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    await TaskRepository.findByIdAndDelete(id);
    return res.json({ message: "Task deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete task." });
  }
}

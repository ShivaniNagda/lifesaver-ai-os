import express from "express";
import { register, login, forgotPassword, resetPassword, getMe, logout } from "../controllers/authController";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController";
import { getGoals, createGoal, updateGoal, deleteGoal } from "../controllers/goalController";
import { getHabits, createHabit, updateHabit, deleteHabit } from "../controllers/habitController";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../controllers/calendarController";
import { getNotifications, createNotification, markAsRead, deleteNotification } from "../controllers/notificationController";
import { getSettings, updateSettings, updateProfile } from "../controllers/settingsController";
import { processAgentOS, negotiateExtension, twinChat, prepareExam, getTwinChatLogs, getAgentLogs } from "../controllers/aiController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { TaskRepository, GoalRepository, HabitRepository, CalendarEventRepository } from "../repositories/baseRepository";

const router = express.Router();

// -----------------------------------------------------------------
// AUTHENTICATION
// -----------------------------------------------------------------
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.get("/auth/me", authMiddleware, getMe);

// -----------------------------------------------------------------
// TASKS (SECURE CRUD)
// -----------------------------------------------------------------
router.get("/tasks", authMiddleware, getTasks);
router.post("/tasks", authMiddleware, createTask);
router.put("/tasks/:id", authMiddleware, updateTask);
router.delete("/tasks/:id", authMiddleware, deleteTask);

// -----------------------------------------------------------------
// GOALS (SECURE CRUD)
// -----------------------------------------------------------------
router.get("/goals", authMiddleware, getGoals);
router.post("/goals", authMiddleware, createGoal);
router.put("/goals/:id", authMiddleware, updateGoal);
router.delete("/goals/:id", authMiddleware, deleteGoal);

// -----------------------------------------------------------------
// HABITS (SECURE CRUD)
// -----------------------------------------------------------------
router.get("/habits", authMiddleware, getHabits);
router.post("/habits", authMiddleware, createHabit);
router.put("/habits/:id", authMiddleware, updateHabit);
router.delete("/habits/:id", authMiddleware, deleteHabit);

// -----------------------------------------------------------------
// CALENDAR EVENTS (SECURE CRUD)
// -----------------------------------------------------------------
router.get("/calendar", authMiddleware, getEvents);
router.post("/calendar", authMiddleware, createEvent);
router.put("/calendar/:id", authMiddleware, updateEvent);
router.delete("/calendar/:id", authMiddleware, deleteEvent);

// -----------------------------------------------------------------
// AI OPERATIONS (SECURE ENGINES)
// -----------------------------------------------------------------
router.post("/ai/process", authMiddleware, processAgentOS);
router.post("/ai/negotiate", authMiddleware, negotiateExtension);
router.post("/ai/twin-chat", authMiddleware, twinChat);
router.post("/ai/prepare", authMiddleware, prepareExam);
router.get("/ai/chat-logs", authMiddleware, getTwinChatLogs);
router.get("/ai/agent-logs", authMiddleware, getAgentLogs);

// -----------------------------------------------------------------
// NOTIFICATIONS (SECURE CRUD)
// -----------------------------------------------------------------
router.get("/notifications", authMiddleware, getNotifications);
router.post("/notifications", authMiddleware, createNotification);
router.put("/notifications/:id/read", authMiddleware, markAsRead);
router.delete("/notifications/:id", authMiddleware, deleteNotification);

// -----------------------------------------------------------------
// SETTINGS & PROFILE
// -----------------------------------------------------------------
router.get("/settings", authMiddleware, getSettings);
router.put("/settings", authMiddleware, updateSettings);
router.put("/profile", authMiddleware, updateProfile);

// -----------------------------------------------------------------
// ANALYTICS (DASHBOARD HIGHLIGHTS)
// -----------------------------------------------------------------
router.get("/analytics/dashboard", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const tasks = await TaskRepository.find({ userId });
    const goals = await GoalRepository.find({ userId });
    const habits = await HabitRepository.find({ userId });
    const events = await CalendarEventRepository.find({ userId });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalGoals = goals.length;
    const averageGoalProgress = totalGoals > 0 
      ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / totalGoals) 
      : 0;

    const totalHabits = habits.length;
    const averageHabitStreak = totalHabits > 0 
      ? Math.round(habits.reduce((sum, h) => sum + (h.streak || 0), 0) / totalHabits) 
      : 0;

    return res.json({
      totalTasks,
      completedTasks,
      taskCompletionRate,
      totalGoals,
      averageGoalProgress,
      totalHabits,
      averageHabitStreak,
      calendarCount: events.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to calculate analytics parameters." });
  }
});

export default router;

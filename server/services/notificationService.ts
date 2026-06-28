import nodemailer from "nodemailer";
import cron from "node-cron";
import { GoogleGenAI } from "@google/genai";
import { TaskRepository, UserRepository, SettingsRepository, NotificationRepository, GoalRepository, HabitRepository, CalendarEventRepository } from "../repositories/baseRepository";
import { JsonDb } from "../utils/jsonDb";
import path from "path";

// Persistence for simulated/sent emails in development
const sentEmailsDb = new JsonDb<any>("sent_emails");
const dailySummariesDb = new JsonDb<any>("daily_summaries");

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to static templates for AI coaching.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to parse due dates robustly
export function getTaskDueDate(dueDateStr: string): Date | null {
  if (!dueDateStr) return null;
  if (dueDateStr.includes("T") || dueDateStr.includes(" ")) {
    const d = new Date(dueDateStr);
    if (!isNaN(d.getTime())) return d;
  }
  const parts = dueDateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    // Treat YYYY-MM-DD as due at 6 PM local time
    const d = new Date(year, month, day, 18, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(dueDateStr);
  return isNaN(d.getTime()) ? null : d;
}

// Generate personalized recommendations using Gemini AI
export async function getAIRecommendation(taskTitle: string, urgency: string, type: string, description: string): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    return getStaticRecommendation(urgency, type);
  }

  const prompt = `You are the executive AI Coach in LifeSaver AI OS.
Task: "${taskTitle}"
Description: "${description || "None"}"
Urgency Level: "${urgency}"
Reminder Category: "${type}" (Options: "24h_before", "3h_before", "30m_before", "missed")

Provide a brief, highly personalized, and action-oriented recommendation or recovery plan for this task.
Include a specific tip (e.g. time management, rescheduling lower priorities, Pomodoro focus).
Keep it within 2 sentences, encouraging and concise. Return plain text only.`;

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (error: any) {
      console.warn(`Gemini AI recommendation generation failed with model ${currentModel}:`, error.message || error);
      const isTransient = error.status === 503 || 
                          error.message?.includes("503") || 
                          error.message?.includes("UNAVAILABLE") || 
                          error.message?.includes("high demand") ||
                          error.status === 429;
      if (isTransient && i < modelsToTry.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      break;
    }
  }
  return getStaticRecommendation(urgency, type);
}

function getStaticRecommendation(urgency: string, type: string): string {
  if (type === "24h_before") {
    return `You have 24 hours left. Start with a 25-minute Pomodoro block today to secure initial momentum. Since urgency is ${urgency}, prioritize this over secondary tasks.`;
  } else if (type === "3h_before") {
    return `Only 3 hours remain. Consider deferring non-urgent meetings or emails to focus exclusively on finishing this task now.`;
  } else if (type === "30m_before") {
    return `Final 30 minutes! Close all distraction tabs, put your phone in focus mode, and push through this final stretch.`;
  } else {
    return `Deadline missed. Take a deep breath: update the schedule to set a realistic new target time, and focus on active recovery instead of stress.`;
  }
}

// Create Nodemailer Transporter
async function getTransporter() {
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    if (service) {
      return nodemailer.createTransport({
        service,
        auth: { user, pass }
      });
    } else if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    }
  }
  return null;
}

// Build beautiful responsive SaaS email templates
export function buildSaaSEmailHTML(
  username: string,
  taskTitle: string,
  dueDateStr: string,
  urgency: string,
  timeText: string,
  aiRecommendation: string,
  subject: string
): string {
  const urgencyColors: Record<string, string> = {
    low: "#10B981",
    medium: "#3B82F6",
    high: "#F59E0B",
    critical: "#EF4444",
  };
  const color = urgencyColors[urgency.toLowerCase()] || "#6366F1";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #0f172a;
        color: #e2e8f0;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        background-color: #0f172a;
        padding: 40px 20px;
        box-sizing: border-box;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #1e293b;
        border-radius: 12px;
        border: 1px solid #334155;
        overflow: hidden;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      }
      .header {
        background-color: #0f172a;
        padding: 24px;
        text-align: center;
        border-bottom: 1px solid #334155;
      }
      .logo {
        font-size: 20px;
        font-weight: bold;
        color: #6366f1;
        letter-spacing: 1px;
      }
      .content {
        padding: 32px 24px;
      }
      h1 {
        font-size: 22px;
        color: #ffffff;
        margin-top: 0;
        margin-bottom: 16px;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
        color: #94a3b8;
        margin-top: 0;
        margin-bottom: 20px;
      }
      .task-card {
        background-color: #0f172a;
        border-radius: 8px;
        border: 1px solid #334155;
        padding: 20px;
        margin-bottom: 24px;
      }
      .task-title {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 12px 0;
      }
      .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        color: #ffffff;
        margin-bottom: 12px;
      }
      .meta-item {
        font-size: 14px;
        color: #94a3b8;
        margin-bottom: 6px;
      }
      .meta-label {
        font-weight: bold;
        color: #cbd5e1;
      }
      .ai-box {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
        border-left: 4px solid #6366f1;
        border-radius: 6px;
        padding: 16px;
        margin-top: 24px;
        margin-bottom: 24px;
      }
      .ai-title {
        font-size: 14px;
        font-weight: bold;
        color: #818cf8;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
      }
      .ai-text {
        font-size: 13.5px;
        color: #cbd5e1;
        margin: 0;
        font-style: italic;
      }
      .cta-btn {
        display: inline-block;
        background-color: #6366f1;
        color: #ffffff !important;
        text-decoration: none;
        padding: 12px 28px;
        font-size: 15px;
        font-weight: bold;
        border-radius: 6px;
        text-align: center;
        transition: background-color 0.2s;
        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
      }
      .footer {
        background-color: #0f172a;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #334155;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <div class="logo">⚡ LIFESAVER AI OS</div>
        </div>
        <div class="content">
          <h1>Hello, ${username}!</h1>
          <p>This is an automated intelligent update regarding your upcoming commitment. LifeSaver OS is actively tracking your schedule to ensure peak productivity.</p>
          
          <div class="task-card">
            <span class="badge" style="background-color: ${color};">${urgency}</span>
            <div class="task-title">${taskTitle}</div>
            <div class="meta-item"><span class="meta-label">Due Date:</span> ${dueDateStr}</div>
            <div class="meta-item"><span class="meta-label">Remaining Time:</span> ${timeText}</div>
          </div>
  
          <div class="ai-box">
            <div class="ai-title">🤖 AI Executive Coach Recommendation</div>
            <p class="ai-text">"${aiRecommendation}"</p>
          </div>
  
          <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
            <a href="${process.env.APP_URL || "https://ai.studio/build"}" class="cta-btn">Open Dashboard</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 LifeSaver AI OS. Deployed securely in sandbox environment.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Send actual email or log in DB
export async function sendNotificationEmail(
  userId: string,
  userEmail: string,
  subject: string,
  html: string,
  taskTitle: string,
  type: string
): Promise<boolean> {
  const sentAt = new Date().toISOString();
  console.log(`[SMTP Engine] Sending ${type} email to ${userEmail} with subject: "${subject}"`);

  let success = false;
  let statusMessage = "Sent successfully via SMTP";

  try {
    const transporter = await getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_USER || "LifeSaver OS"}" <${process.env.EMAIL_USER || "no-reply@lifesaver.ai"}>`,
        to: userEmail,
        subject,
        html,
      });
      success = true;
    } else {
      statusMessage = "Simulated delivery (SMTP details unconfigured)";
      success = true; // Still mark as success so the app behaves seamlessly in preview
    }
  } catch (error: any) {
    console.error("Nodemailer transmission failed:", error.message || error);
    statusMessage = `Failed: ${error.message || "Unknown SMTP Error"}`;
    success = false;
  }

  // Persist to local log so Dashboard can retrieve notification logs immediately
  await sentEmailsDb.create({
    userId,
    userEmail,
    subject,
    taskTitle,
    type,
    success,
    statusMessage,
    sentAt,
    html,
  });

  // Create an in-app notification card as well
  try {
    await NotificationRepository.create({
      userId,
      title: subject,
      message: `Email alert regarding your task: "${taskTitle}" (${statusMessage})`,
      type: "email_log",
      read: false,
    });
  } catch (err) {
    console.error("Failed to write in-app notification:", err);
  }

  return success;
}

// Run the core reminder checking loop
export async function checkAndSendReminders(): Promise<void> {
  console.log(`[Notification Scheduler] Checking for upcoming deadlines at ${new Date().toISOString()}`);
  try {
    const pendingTasks = await TaskRepository.find({ status: "pending" });
    const now = Date.now();

    for (const task of pendingTasks) {
      const taskDueDate = getTaskDueDate(task.dueDate);
      if (!taskDueDate) continue;

      const msRemaining = taskDueDate.getTime() - now;
      const minsRemaining = msRemaining / (1000 * 60);

      // Ensure we have a valid email for the user
      let email = task.userEmail;
      let username = "User";
      if (!email) {
        const user = await UserRepository.findById(task.userId);
        if (user) {
          email = user.email;
          username = user.username || "User";
          // Cache on task
          await TaskRepository.findByIdAndUpdate(task.id || task._id, { userEmail: email });
        }
      }

      if (!email) {
        console.warn(`Skipping reminders for task "${task.title}" because no user email could be found.`);
        continue;
      }

      // Load user preferences
      let settings = await SettingsRepository.findOne({ userId: task.userId });
      if (!settings) {
        settings = {
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
        };
      }

      const history = task.emailSentHistory || [];

      // Divide intervals cleanly
      const intervalKeysOrder = [
        "reminder_24h",
        "reminder_12h",
        "reminder_6h",
        "reminder_3h",
        "reminder_1h",
        "reminder_30m",
        "reminder_10m",
        "reminder_reached",
        "reminder_missed"
      ];

      let activeIntervalKey = "";
      let activeIntervalSubject = "";
      let activeIntervalType = "";
      let activeIntervalSetting = false;

      if (minsRemaining <= -15) {
        activeIntervalKey = "reminder_missed";
        activeIntervalSetting = settings.reminderMissedEnabled !== false;
        activeIntervalSubject = `Deadline Missed: ${task.title}`;
        activeIntervalType = "missed";
      } else if (minsRemaining <= 0) {
        activeIntervalKey = "reminder_reached";
        activeIntervalSetting = settings.reminderReachedEnabled !== false;
        activeIntervalSubject = `Deadline Reached: ${task.title}`;
        activeIntervalType = "reached";
      } else if (minsRemaining <= 10) {
        activeIntervalKey = "reminder_10m";
        activeIntervalSetting = settings.reminder10mEnabled !== false;
        activeIntervalSubject = `Upcoming 10-Minute Critical Warning: ${task.title}`;
        activeIntervalType = "10m_before";
      } else if (minsRemaining <= 30) {
        activeIntervalKey = "reminder_30m";
        activeIntervalSetting = settings.reminder30mEnabled !== false;
        activeIntervalSubject = `Final Reminder: ${task.title} approaching deadline`;
        activeIntervalType = "30m_before";
      } else if (minsRemaining <= 60) {
        activeIntervalKey = "reminder_1h";
        activeIntervalSetting = settings.reminder1hEnabled !== false;
        activeIntervalSubject = `Upcoming 1-Hour Urgent Reminder: ${task.title}`;
        activeIntervalType = "1h_before";
      } else if (minsRemaining <= 180) {
        activeIntervalKey = "reminder_3h";
        activeIntervalSetting = settings.reminder3hEnabled !== false;
        activeIntervalSubject = `High Priority Reminder: ${task.title}`;
        activeIntervalType = "3h_before";
      } else if (minsRemaining <= 360) {
        activeIntervalKey = "reminder_6h";
        activeIntervalSetting = settings.reminder6hEnabled !== false;
        activeIntervalSubject = `Upcoming 6-Hour Deadline Alert: ${task.title}`;
        activeIntervalType = "6h_before";
      } else if (minsRemaining <= 720) {
        activeIntervalKey = "reminder_12h";
        activeIntervalSetting = settings.reminder12hEnabled !== false;
        activeIntervalSubject = `Upcoming 12-Hour Deadline Alert: ${task.title}`;
        activeIntervalType = "12h_before";
      } else if (minsRemaining <= 1440) {
        activeIntervalKey = "reminder_24h";
        activeIntervalSetting = settings.reminder24hEnabled !== false;
        activeIntervalSubject = `Upcoming Deadline Reminder: ${task.title}`;
        activeIntervalType = "24h_before";
      }

      if (activeIntervalKey) {
        // If already triggered this active interval, skip
        if (history.includes(activeIntervalKey)) {
          continue;
        }

        // Fast-forward larger intervals as skipped to prevent backwards trigger spam
        const activeIndex = intervalKeysOrder.indexOf(activeIntervalKey);
        const keysToMark = intervalKeysOrder.slice(0, activeIndex + 1);

        // Filter out keys that we are marking as sent/skipped
        const newHistory = [...new Set([...history, ...keysToMark])];

        // Process active interval
        if (activeIntervalSetting) {
          // Generate AI Advice or Recovery plan
          const aiRec = await getAIRecommendation(task.title, task.urgency, activeIntervalType, task.description);

          // Build remaining time text
          let timeText = "";
          if (minsRemaining <= -15) {
            const overdueMins = Math.round(Math.abs(minsRemaining));
            timeText = overdueMins > 60 ? `${Math.round(overdueMins / 60)} hours overdue` : `${overdueMins} minutes overdue`;
          } else if (minsRemaining <= 0) {
            timeText = "Now Reached";
          } else {
            timeText = minsRemaining > 60 ? `${Math.round(minsRemaining / 60)} hours remaining` : `${Math.round(minsRemaining)} minutes remaining`;
          }

          let emailSentFlag = false;

          // Low-priority tasks: toast only (skip email, skip browser/sound via toastOnly setting)
          const isLowPriority = task.urgency === "low";

          if (settings.emailNotificationsEnabled && !isLowPriority) {
            const html = buildSaaSEmailHTML(username, task.title, task.dueDate, task.urgency, timeText, aiRec, activeIntervalSubject);
            await sendNotificationEmail(task.userId, email, activeIntervalSubject, html, task.title, activeIntervalType);
            emailSentFlag = true;
          }

          // Create standard DB notification for in-app alert (toast, sound, browser alert)
          let friendlyMessage = "";
          if (minsRemaining <= 0) {
            friendlyMessage = `Your task "${task.title}" is ${timeText}. AI Recovery Plan: "${aiRec}"`;
          } else {
            friendlyMessage = `Your task "${task.title}" is due in ${timeText}.`;
          }

          await NotificationRepository.create({
            userId: task.userId,
            taskId: task.id || task._id,
            title: activeIntervalSubject,
            message: friendlyMessage,
            type: minsRemaining <= 0 ? "missed_alert" : "deadline_alert",
            read: false,
            deliveryStatus: "delivered",
            emailSent: emailSentFlag,
            browserSent: false, // will be toasted/native alerted on frontend
            soundPlayed: false,  // will play sound on frontend
            aiRecoveryPlan: minsRemaining <= 0 ? aiRec : "",
            priority: task.urgency || "medium",
          });
        }

        // Update task with new history
        await TaskRepository.findByIdAndUpdate(task.id || task._id, {
          notificationStatus: `notified_${activeIntervalType}`,
          lastReminderSent: new Date(),
          emailSentHistory: newHistory,
          missedReminderSent: activeIntervalKey === "reminder_missed" ? true : task.missedReminderSent
        });
      }
    }

    // Run the morning daily summary checks as well!
    await generateDailyMorningSummaries();

  } catch (error) {
    console.error("Scheduler run iteration encountered an error:", error);
  }
}

export async function generateDailyMorningSummaries(): Promise<void> {
  console.log(`[Daily Summary Engine] Running morning brief checks...`);
  try {
    const users = await UserRepository.find({});
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    for (const user of users) {
      const userId = user.id || user._id;
      
      // 1. Check if summary already sent today
      const alreadySent = await dailySummariesDb.findOne({ userId, dateStr: todayStr });
      if (alreadySent) continue;

      // 2. Load user preferences
      let settings = await SettingsRepository.findOne({ userId });
      if (!settings) {
        settings = {
          emailNotificationsEnabled: true,
          aiSuggestionsEnabled: true,
        };
      }

      // 3. Fetch today's context
      const tasks = await TaskRepository.find({ userId, status: "pending" });
      const habits = await HabitRepository.find({ userId });
      const goals = await GoalRepository.find({ userId, status: "active" });
      const events = await CalendarEventRepository.find({ userId });

      // Filter tasks due today
      const todayTasks = tasks.filter(t => {
        const d = getTaskDueDate(t.dueDate);
        if (!d) return false;
        const dStr = d.toISOString().split("T")[0];
        return dStr === todayStr;
      });

      // Filter events scheduled today
      const todayEvents = events.filter(e => e.date === todayStr);

      // Generate AI summary
      let summaryText = "";
      const ai = getGeminiClient();
      if (ai && settings.aiSuggestionsEnabled) {
        const prompt = `You are the executive AI Productivity Assistant in LifeSaver AI OS.
Generate a morning briefing for user: "${user.username || "Executive"}".
Today's Date: ${todayStr}

Context for Today:
- Tasks Due Today: ${todayTasks.map(t => `"${t.title}" (Priority: ${t.urgency})`).join(", ") || "None"}
- Today's Meetings/Events: ${todayEvents.map(e => `"${e.title}" at ${e.startTime}`).join(", ") || "None"}
- Active Habits to Practice: ${habits.map(h => `"${h.title}" (Streak: ${h.streak || 0})`).join(", ") || "None"}
- Long-term Goals Active: ${goals.map(g => `"${g.title}" (Progress: ${g.progress || 0}%)`).join(", ") || "None"}

Write a beautiful, motivational, and highly focused morning daily summary.
Format with clean bullet points or short paragraphs.
Start with "Good Morning 👋" and end with a quick, high-impact AI advice for the day.
Keep it compact, professional, and readable in an email. Plain text or standard HTML paragraphs.`;

        const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
        let generatedText = "";
        for (let i = 0; i < modelsToTry.length; i++) {
          const currentModel = modelsToTry[i];
          try {
            const response = await ai.models.generateContent({
              model: currentModel,
              contents: prompt,
            });
            if (response && response.text) {
              generatedText = response.text.trim();
              break;
            }
          } catch (err: any) {
            console.warn(`Failed to generate morning summary via Gemini model ${currentModel}:`, err.message || err);
            const isTransient = err.status === 503 || 
                                err.message?.includes("503") || 
                                err.message?.includes("UNAVAILABLE") || 
                                err.message?.includes("high demand") ||
                                err.status === 429;
            if (isTransient && i < modelsToTry.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 300));
              continue;
            }
            break;
          }
        }
        summaryText = generatedText || getStaticMorningSummary(user.username, todayTasks, todayEvents, habits);
      } else {
        summaryText = getStaticMorningSummary(user.username, todayTasks, todayEvents, habits);
      }

      // 4. Create in-app notification of type "daily_summary"
      await NotificationRepository.create({
        userId,
        title: `Good Morning 👋 - Today's Summary (${todayStr})`,
        message: summaryText,
        type: "daily_summary",
        read: false,
        deliveryStatus: "delivered",
        emailSent: !!settings.emailNotificationsEnabled,
      });

      // 5. Send Email if enabled
      if (settings.emailNotificationsEnabled) {
        const subject = `☀️ Good Morning 👋: Your Daily Focus Summary - ${todayStr}`;
        const html = buildDailySummaryEmailHTML(user.username || "Executive", todayStr, summaryText);
        await sendNotificationEmail(userId, user.email, subject, html, "Daily Morning Briefing", "daily_summary");
      }

      // Mark as sent
      await dailySummariesDb.create({
        userId,
        dateStr: todayStr,
        sentAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Daily morning summary runner encountered an error:", error);
  }
}

function getStaticMorningSummary(username: string, tasks: any[], events: any[], habits: any[]): string {
  return `Good Morning ${username || "Executive"} 👋!\n\nHere is your layout for today:\n- ${tasks.length} pending tasks due today.\n- ${events.length} schedule meetings/events.\n- ${habits.length} habits active.\n\nAdvice: Focus on your critical tasks first thing in the morning to unlock early momentum!`;
}

function buildDailySummaryEmailHTML(username: string, dateStr: string, summaryText: string): string {
  const formattedSummary = summaryText.replace(/\n/g, "<br>");
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Good Morning Daily Summary</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #0f172a;
        color: #e2e8f0;
        margin: 0;
        padding: 0;
      }
      .wrapper {
        width: 100%;
        background-color: #0f172a;
        padding: 40px 20px;
        box-sizing: border-box;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #1e293b;
        border-radius: 12px;
        border: 1px solid #334155;
        overflow: hidden;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      }
      .header {
        background-color: #0f172a;
        padding: 24px;
        text-align: center;
        border-bottom: 1px solid #334155;
      }
      .logo {
        font-size: 20px;
        font-weight: bold;
        color: #6366f1;
        letter-spacing: 1px;
      }
      .content {
        padding: 32px 24px;
      }
      h1 {
        font-size: 22px;
        color: #ffffff;
        margin-top: 0;
        margin-bottom: 16px;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
        color: #e2e8f0;
        margin-top: 0;
        margin-bottom: 20px;
      }
      .summary-card {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
        border-radius: 8px;
        border: 1px solid #334155;
        padding: 24px;
        margin-bottom: 24px;
        line-height: 1.6;
      }
      .cta-btn {
        display: inline-block;
        background-color: #6366f1;
        color: #ffffff !important;
        text-decoration: none;
        padding: 12px 28px;
        font-size: 15px;
        font-weight: bold;
        border-radius: 6px;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
      }
      .footer {
        background-color: #0f172a;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #334155;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <div class="logo">☀️ LIFESAVER AI OS</div>
        </div>
        <div class="content">
          <h1>Good Morning, ${username}!</h1>
          <p>Here is your productivity brief for today, <strong>${dateStr}</strong>.</p>
          
          <div class="summary-card">
            <p>${formattedSummary}</p>
          </div>
  
          <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
            <a href="${process.env.APP_URL || "https://ai.studio/build"}" class="cta-btn">Review Today's Dashboard</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 LifeSaver AI OS. Keeping your schedules intact.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Get history logs for UI
export async function getSentEmailsHistory(userId: string): Promise<any[]> {
  try {
    return await sentEmailsDb.find({ userId });
  } catch (err) {
    console.error("Failed to retrieve email history:", err);
    return [];
  }
}

// Start the node-cron scheduler (runs every 5 minutes)
export function initScheduler(): void {
  // Cron expression for every 5 minutes: '*/5 * * * *'
  cron.schedule("*/5 * * * *", async () => {
    await checkAndSendReminders();
  });
  console.log("⏰ Smart AI Deadline Email Notification Scheduler successfully initialized (runs every 5 minutes)");
}

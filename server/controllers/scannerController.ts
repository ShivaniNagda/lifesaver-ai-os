import { Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { 
  ScheduleScanRepository, 
  TaskRepository, 
  CalendarEventRepository, 
  NotificationRepository 
} from "../repositories/baseRepository";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure your Gemini API key in AI Studio Secrets.");
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

// Parses data URL containing base64 data to separate mimeType and base64 string
function parseBase64Image(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    // If it's a raw base64 string without data: prefix
    return { mimeType: "image/jpeg", base64Data: dataUrl };
  }
  return {
    mimeType: matches[1],
    base64Data: matches[2]
  };
}

/**
 * Uploads a base64 image, processes it through Gemini Vision to extract raw text (OCR),
 * and creates a history log of the scan.
 */
export async function uploadImage(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data. Supported formats: JPG, JPEG, PNG, WEBP." });
    }

    console.log(`[Scanner] Received upload image. Preparing Gemini Multimodal analysis...`);
    const { mimeType, base64Data } = parseBase64Image(image);

    const ai = getGeminiClient();
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let ocrText = "";
    let lastError: any = null;

    const prompt = `Perform high-fidelity Optical Character Recognition (OCR) on this image. 
It may contain handwritten planners, printed timetables, whiteboard tasks, sticky notes, study schedules, or notebook diaries.
Extract all schedules, notes, times, dates, and checklists verbatim. Keep the structure organized.
If there is handwriting, read it carefully and preserve it. Respond with ONLY the clean extracted text. 
If no clear text can be extracted, describe any visible contents.`;

    for (const model of modelsToTry) {
      try {
        console.log(`[Scanner OCR] Attempting OCR with model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            prompt
          ]
        });

        if (response && response.text) {
          ocrText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Scanner OCR] Model ${model} failed:`, err.message || err);
        // Continue to fallback model
      }
    }

    if (!ocrText) {
      throw new Error(`Failed to extract text from schedule image: ${lastError?.message || "Unknown vision error"}`);
    }

    // Save scan entry to History
    const scanRecord = await ScheduleScanRepository.create({
      userId,
      originalImage: image,
      ocrText,
      aiOutput: "[]",
      createdTasksCount: 0
    });

    return res.status(201).json({
      id: scanRecord.id || scanRecord._id,
      ocrText,
      originalImage: image
    });

  } catch (error: any) {
    console.error("[Scanner OCR Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to process image scan." });
  }
}

/**
 * Takes raw OCR text (possibly edited by the user) and structures it into
 * clean JSON tasks and suggestions using Gemini reasoning, with relative date parsing.
 */
export async function processText(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { rawText, id } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "Missing raw text to process." });
    }

    const todayDateStr = "2026-06-28";
    const prompt = `You are an expert Productivity Orchestration Assistant. 
Analyze the following extracted schedule notes. Today's date is Sunday, June 28, 2026 (${todayDateStr}).
Detect and extract all tasks, assignments, exams, meetings, or checklists. 
Convert all relative dates (e.g. "tomorrow", "next Monday", "8 PM", "next Friday", "due Friday") into absolute "YYYY-MM-DD" dates based on today's reference date.
For each task:
- Detect a title (concise, clear action title).
- Detect dueDate in "YYYY-MM-DD" format. If no date is found, default to "${todayDateStr}".
- Detect time (e.g. "08:00 AM", "19:00", "7:00 PM"). If none found, leave empty "".
- Detect priority/urgency ("low", "medium", "high", "critical") based on terms like "urgent", "exam", "asap", "due", or critical context.
- Provide a concise description/notes.

Additionally, provide smart AI Suggestions:
1. "recommendedSchedule": An optimal hour-by-hour pacing schedule for these tasks.
2. "conflicts": Any overlapping times or overloaded days.
3. "deepWorkSessions": Ideal blocks for distraction-free focus.
4. "timeEstimation": Estimated completion time in hours.
5. "priorityOrder": Best execution sequence to avoid burnout.

Notes: Keep descriptions helpful. Respond strictly in the required JSON schema.

OCR TEXT TO PARSE:
"""
${rawText}
"""`;

    const scheduleResponseSchema = {
      type: Type.OBJECT,
      required: ["tasks", "suggestions"],
      properties: {
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["title", "dueDate", "time", "priority", "description"],
            properties: {
              title: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              time: { type: Type.STRING },
              priority: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        suggestions: {
          type: Type.OBJECT,
          required: ["recommendedSchedule", "conflicts", "deepWorkSessions", "timeEstimation", "priorityOrder"],
          properties: {
            recommendedSchedule: { type: Type.STRING },
            conflicts: { type: Type.STRING },
            deepWorkSessions: { type: Type.STRING },
            timeEstimation: { type: Type.STRING },
            priorityOrder: { type: Type.STRING }
          }
        }
      }
    };

    const ai = getGeminiClient();
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let structuredJson = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[Scanner AI Process] Structuring text with model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: scheduleResponseSchema
          }
        });

        if (response && response.text) {
          structuredJson = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Scanner AI Process] Model ${model} failed:`, err.message || err);
      }
    }

    if (!structuredJson) {
      throw new Error(`Failed to structure notes into schedule: ${lastError?.message || "Unknown processing error"}`);
    }

    const parsedOutput = JSON.parse(structuredJson);

    // If an ID was supplied, save the AI output in the history scan
    if (id) {
      await ScheduleScanRepository.findByIdAndUpdate(id, {
        ocrText: rawText, // update in case they edited it
        aiOutput: structuredJson
      });
    }

    return res.json(parsedOutput);

  } catch (error: any) {
    console.error("[Scanner AI Process Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to process and structure extracted schedule." });
  }
}

/**
 * Creates the approved tasks in the database, maps calendar events if times are specified,
 * triggers notifications, and marks the scan history as completed.
 */
export async function createScannedTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email || "";
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id, tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "No tasks provided to create." });
    }

    console.log(`[Scanner] Creating ${tasks.length} parsed tasks for user ${userId}...`);
    const createdTasks = [];
    const createdEvents = [];

    for (const task of tasks) {
      const urgencyVal = (task.priority || "medium").toLowerCase();
      const finalUrgency = ["low", "medium", "high", "critical"].includes(urgencyVal) 
        ? urgencyVal 
        : "medium";

      // 1. Create task
      const newTask = await TaskRepository.create({
        userId,
        title: task.title,
        description: task.description || `Scanned via AI Schedule Scanner. Time notes: ${task.time || "N/A"}`,
        dueDate: task.dueDate || "2026-06-28",
        urgency: finalUrgency,
        priority: finalUrgency,
        status: "pending",
        completed: false,
        userEmail,
        notificationStatus: "pending",
        lastReminderSent: null,
        missedReminderSent: false,
        emailSentHistory: []
      });
      createdTasks.push(newTask);

      // 2. Create Calendar Event if time is present
      if (task.time && task.time.trim() !== "") {
        // Simple time parsing/cleaning, e.g. "08:00 AM" or "19:00" -> HH:MM
        let startTime = "09:00";
        let endTime = "10:00";
        
        const timeMatch = task.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2];
          const ampm = timeMatch[3];
          
          if (ampm) {
            if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
            if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
          }
          
          const formattedHours = hours.toString().padStart(2, "0");
          startTime = `${formattedHours}:${minutes}`;
          
          // Default duration 1 hour
          const endHours = (hours + 1) % 24;
          endTime = `${endHours.toString().padStart(2, "0")}:${minutes}`;
        }

        const newEvent = await CalendarEventRepository.create({
          userId,
          title: task.title,
          date: task.dueDate || "2026-06-28",
          startTime,
          endTime,
          category: finalUrgency === "critical" || finalUrgency === "high" ? "deepwork" : "lecture",
          description: task.description || "Scanned via AI Schedule Scanner."
        });
        createdEvents.push(newEvent);
      }
    }

    // 3. Create a success notification
    await NotificationRepository.create({
      userId,
      title: "📋 Schedule Scanned Successfully",
      message: `Imported ${createdTasks.length} tasks and ${createdEvents.length} calendar events from your scanned planner!`,
      type: "success",
      read: false,
      taskId: createdTasks[0]?.id || createdTasks[0]?._id || null
    });

    // 4. Update the history log
    if (id) {
      await ScheduleScanRepository.findByIdAndUpdate(id, {
        createdTasksCount: createdTasks.length
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully created ${createdTasks.length} tasks and ${createdEvents.length} calendar events.`,
      taskCount: createdTasks.length,
      eventCount: createdEvents.length
    });

  } catch (error: any) {
    console.error("[Scanner Tasks Creation Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to create scanned tasks." });
  }
}

/**
 * Returns the history of scans for the authenticated user, sorted by creation timestamp.
 */
export async function getScanHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const history = await ScheduleScanRepository.find({ userId });
    
    // Sort descending by createdAt
    const sortedHistory = history.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return res.json(sortedHistory);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch scan history." });
  }
}

/**
 * Deletes a specific scan history entry.
 */
export async function deleteScanHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const scan = await ScheduleScanRepository.findById(id);
    if (!scan) return res.status(404).json({ error: "Scan record not found." });
    if (scan.userId !== userId) return res.status(403).json({ error: "Forbidden." });

    await ScheduleScanRepository.findByIdAndDelete(id);
    return res.json({ message: "Scan history entry deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete scan history entry." });
  }
}

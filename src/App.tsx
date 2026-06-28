import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Shield, AlertTriangle, CheckCircle, Brain, Terminal, 
  Calendar, Clock, User, Settings, ArrowRight, Play, ExternalLink, 
  Send, HelpCircle, Activity, ChevronRight, Zap, Target, BookOpen, 
  Hourglass, MessageSquare, Briefcase, Plus, Trash2, Mail, Mic,
  Sun, Moon, Bell, Camera, Upload, FileImage, RefreshCw, Check
} from "lucide-react";
import AICoreCanvas from "./components/AICoreCanvas";
import AgentLogsTerminal from "./components/AgentLogsTerminal";
import { 
  Task, TimelineNode, AgentLog, FutureSelfDialog, AgentOSResponse, 
  NegotiationResult, PreparationPlan, TwinChatResponse, ChatMessage 
} from "./types";
import AuthScreen from "./components/AuthScreen";
import GoalTracker from "./components/GoalTracker";
import HabitTracker from "./components/HabitTracker";
import CalendarModule from "./components/CalendarModule";
import SettingsPanel from "./components/SettingsPanel";
import VoiceAssistant from "./components/VoiceAssistant";
import NotificationsPanel from "./components/NotificationsPanel";
import AIScheduleScanner from "./components/AIScheduleScanner";
import { useToast } from "./components/ToastProvider";

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Chemistry Midterm Exam Preparation", dueDate: "2026-06-28", urgency: "critical", status: "pending" },
  { id: "2", title: "Monthly Server Hosting & Utility Payments", dueDate: "2026-06-27", urgency: "high", status: "pending" },
  { id: "3", title: "Submit Pitch Deck to Seed Investors", dueDate: "2026-06-30", urgency: "high", status: "pending" },
  { id: "4", title: "Draft SaaS API Documentation", dueDate: "2026-07-02", urgency: "medium", status: "pending" }
];

export const fetchWithAuth = async (url: string, options: RequestInit = {}, retries = 3, delay = 1500): Promise<Response> => {
  const token = localStorage.getItem("lifeos_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };
  try {
    return await fetch(url, { ...options, headers });
  } catch (err) {
    if (retries > 0) {
      console.warn(`[Network Retry] Fetch failed. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithAuth(url, options, retries - 1, delay);
    }
    throw err;
  }
};

// High-performance custom 3D tilt interaction hook
const use3DTilt = (maxRot = 10) => {
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate normalized relative coordinates (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / width - 0.5;
    const y = (e.clientY - rect.top) / height - 0.5;
    
    // Calculate rotation angles
    const rotateY = x * maxRot * 2;
    const rotateX = -y * maxRot * 2;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    
    // Dynamic lighting overlay matching cursor
    const glowX = ((e.clientX - rect.left) / width) * 100;
    const glowY = ((e.clientY - rect.top) / height) * 100;
    setGlowStyle({
      opacity: 0.15,
      background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.8) 0%, transparent 60%)`
    });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlowStyle({ opacity: 0 });
  };

  return {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: { transform, transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)" },
    glowStyle
  };
};

export default function App() {
  const { toast, success: showSuccess, error: showError, info: showInfo } = useToast();
  // Navigation & View control
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [activeTab, setActiveTab] = useState<"overview" | "twin" | "rescue" | "negotiate" | "prep" | "calendar" | "goals" | "habits" | "settings" | "voice" | "notifications" | "scanner">("overview");

  // User Auth & Session state
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem("lifeos_email") || null);
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem("lifeos_role") || "Executive Officer");

  // Dynamic Light/Dark Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("lifeos_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("lifeos_theme", theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem("lifeos_email");
    localStorage.removeItem("lifeos_role");
    localStorage.removeItem("lifeos_token");
    setUserEmail(null);
    setView("landing");
  };

  // Core App State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskUrgency, setNewTaskUrgency] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-06-29");
  
  // Custom context for AI input
  const [userContext, setUserContext] = useState("");

  // AI Response States
  const [isProcessing, setIsProcessing] = useState(false);
  const [osResponse, setOsResponse] = useState<AgentOSResponse | null>(null);

  // AI Assistant Chat State
  const [twinInput, setTwinInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I am your AI productivity assistant. I am here to help you conquer your deadlines, avoid burnout, and structure your schedule. Tell me: what's currently blocking your flow?",
      microAction: "Share your main goal or what is currently blocking your progress."
    }
  ]);
  const [isTwinChatting, setIsTwinChatting] = useState(false);

  // Negotiation Assistant State
  const [negoTitle, setNegoTitle] = useState("Monthly Server Hosting Extension");
  const [negoRecipient, setNegoRecipient] = useState("SaaS Cloud Hosting Vendor Support");
  const [negoReason, setNegoReason] = useState("Awaiting venture funding payout clearing on early next week.");
  const [negoTone, setNegoTone] = useState("professional");
  const [negoResult, setNegoResult] = useState<NegotiationResult | null>(null);
  const [isNegoLoading, setIsNegoLoading] = useState(false);

  // Prep Mode State
  const [prepEvent, setPrepEvent] = useState("Chemistry Midterm Exam");
  const [prepTimeLeft, setPrepTimeLeft] = useState("3 Days");
  const [prepTopics, setPrepTopics] = useState<string[]>(["Electrochemistry", "Organic synthesis routes", "Thermodynamics equations"]);
  const [newTopic, setNewTopic] = useState("");
  const [prepPlan, setPrepPlan] = useState<PreparationPlan | null>(null);
  const [isPrepLoading, setIsPrepLoading] = useState(false);

  // Smart notification system state & hooks
  const [notifications, setNotifications] = useState<any[]>([]);
  const [processedInAppIds, setProcessedInAppIds] = useState<string[]>([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  // Play a soft synthetic beep
  const playSoftBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz (A5) for soft chime
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (err) {
      console.warn("[Beep Engine] Audio Context blocked or unsupported:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!userEmail) return;
    try {
      const res = await fetchWithAuth("/api/notifications");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setNotifications(data);
        }
      }
    } catch (err) {
      console.error("[Notifications Poller] Failed to sync notifications:", err);
    }
  };

  // Poll notifications every 10 seconds and trigger toasts / sounds
  useEffect(() => {
    if (!userEmail) return;
    
    fetchNotifications();

    const interval = setInterval(async () => {
      try {
        const res = await fetchWithAuth("/api/notifications");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("[Notifications Poller] Expected JSON for notifications but got:", contentType);
            return;
          }
          const data = await res.json();
          setNotifications(data);
          
          const settingsRes = await fetchWithAuth("/api/settings");
          let settings = { soundAlertsEnabled: true, browserNotificationsEnabled: true };
          if (settingsRes.ok) {
            const settingsContentType = settingsRes.headers.get("content-type");
            if (settingsContentType && settingsContentType.includes("application/json")) {
              const settingsData = await settingsRes.json();
              if (settingsData) settings = settingsData;
            }
          }

          for (const notification of data) {
            const notifId = notification.id || notification._id;
            const isAlert = notification.type === "deadline_alert" || notification.type === "missed_alert";
            
            if (isAlert && !notification.read && !processedInAppIds.includes(notifId)) {
              setProcessedInAppIds(prev => [...prev, notifId]);

              if (settings.soundAlertsEnabled !== false && !notification.soundPlayed) {
                playSoftBeep();
              }

              if (settings.browserNotificationsEnabled !== false && !notification.browserSent) {
                if (Notification.permission === "granted") {
                  const bNotif = new Notification(notification.title || "🔔 LifeSaver AI", {
                    body: notification.message,
                  });
                  bNotif.onclick = () => {
                    window.focus();
                    setActiveTab("overview");
                  };
                } else if (Notification.permission === "default") {
                  Notification.requestPermission();
                }
              }

              const isMissed = notification.type === "missed_alert";
              toast({
                type: isMissed ? "error" : "warning",
                message: notification.title || "Deadline Alert",
                description: notification.message,
                icon: "bell",
                duration: 12000,
                actions: [
                  {
                    label: "Open Task",
                    primary: true,
                    onClick: () => {
                      setActiveTab("overview");
                      const taskElement = document.getElementById(`task-item-${notification.taskId}`);
                      if (taskElement) {
                        taskElement.scrollIntoView({ behavior: "smooth" });
                      }
                    }
                  },
                  {
                    label: "Mark Complete",
                    onClick: async () => {
                      await toggleTaskStatus(notification.taskId);
                      await fetchWithAuth(`/api/notifications/${notifId}/read`, { method: "PUT" });
                      fetchNotifications();
                    }
                  },
                  {
                    label: "Snooze",
                    onClick: async () => {
                      const currentTask = tasks.find(t => t.id === notification.taskId || (t as any)._id === notification.taskId);
                      if (currentTask) {
                        const curDue = new Date(currentTask.dueDate);
                        const newDue = new Date(curDue.getTime() + 15 * 60 * 1000);
                        const resTask = await fetchWithAuth(`/api/tasks/${notification.taskId}`, {
                          method: "PUT",
                          body: JSON.stringify({ dueDate: newDue.toISOString() })
                        });
                        if (resTask.ok) {
                          setTasks(prev => prev.map(t => (t.id === notification.taskId || (t as any)._id === notification.taskId) ? { ...t, dueDate: newDue.toISOString() } : t));
                          showSuccess("Task Snoozed ⏰", `"${currentTask.title}" postponed by 15 minutes.`);
                        }
                      }
                      await fetchWithAuth(`/api/notifications/${notifId}/read`, { method: "PUT" });
                      fetchNotifications();
                    }
                  },
                  {
                    label: "Dismiss",
                    onClick: async () => {
                      await fetchWithAuth(`/api/notifications/${notifId}/read`, { method: "PUT" });
                      fetchNotifications();
                    }
                  }
                ]
              });

              await fetchWithAuth(`/api/notifications/${notifId}/delivery-status`, {
                method: "PUT",
                body: JSON.stringify({
                  browserSent: true,
                  soundPlayed: true,
                  deliveryStatus: "delivered"
                })
              });
            }
          }
        }
      } catch (err) {
        console.error("[Notifications Poller] Poll check failed:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userEmail, processedInAppIds, tasks]);

  // Sync tasks on auth
  useEffect(() => {
    if (!userEmail) return;
    const syncTasks = async () => {
      try {
        const res = await fetchWithAuth("/api/tasks");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setTasks(data);
          } else {
            console.warn("[Sync Tasks] Expected JSON but got:", contentType);
            setTasks(INITIAL_TASKS);
          }
        } else if (res.status === 401) {
          console.warn("Session token expired or missing. Clearing local session.");
          handleLogout();
        } else {
          setTasks(INITIAL_TASKS);
        }
      } catch (err) {
        console.error("Failed to fetch user tasks:", err);
        setTasks(INITIAL_TASKS);
      }
    };
    syncTasks();
  }, [userEmail]);

  // Trigger main OS cognitive alignment engine
  const runLifeOSEngine = async () => {
    setIsProcessing(true);
    try {
      const res = await fetchWithAuth("/api/agent/process", {
        method: "POST",
        body: JSON.stringify({
          context: userContext,
          tasks: tasks,
          mode: activeTab
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOsResponse(data);
      } else {
        console.error("OS Engine failed:", data.error);
        if (res.status === 401) {
          handleLogout();
        }
      }
    } catch (err) {
      console.error("Network error running OS engine:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger initial process automatically on dashboard load
  useEffect(() => {
    if (view === "dashboard" && !osResponse && userEmail) {
      runLifeOSEngine();
    }
  }, [view, osResponse, userEmail]);

  // Handle adding new custom task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      showError("Validation Error", "Task title cannot be empty.", "task");
      return;
    }
    
    try {
      const res = await fetchWithAuth("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTaskTitle,
          dueDate: newTaskDueDate,
          urgency: newTaskUrgency,
          status: "pending"
        })
      });
      if (res.ok) {
        const added = await res.json();
        setTasks(prev => [added, ...prev]);
        setNewTaskTitle("");
        showSuccess("Task Created Successfully", `"${added.title}" has been listed.`);
      } else {
        showError("Failed to Create Task", "Database rejected new task registry.", "task");
      }
    } catch (err: any) {
      console.error("Failed to add task:", err);
      showError("Server Error", err.message || "Failed to save new task.", "task");
    }
  };

  // Toggle task status
  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id || (t as any)._id === id);
    if (!task) return;
    const newStatus = task.status === "completed" ? "pending" : "completed";
    
    try {
      const res = await fetchWithAuth(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => (t.id === id || (t as any)._id === id) ? { ...t, status: newStatus } : t));
        if (newStatus === "completed") {
          showSuccess("Task Marked as Completed 🎉", `Excellent progress on "${task.title}".`);
        } else {
          showInfo("Task Updated Successfully", `"${task.title}" reverted to pending.`);
        }
      } else {
        showError("Failed to Update Task", "The database declined the status update.", "task");
      }
    } catch (err: any) {
      console.error("Failed to toggle task:", err);
      showError("Server Error", "Could not synchronize task completion state.", "task");
    }
  };

  // Remove task
  const removeTask = async (id: string) => {
    const task = tasks.find(t => t.id === id || (t as any)._id === id);
    const title = task ? task.title : "Task";
    try {
      const res = await fetchWithAuth(`/api/tasks/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== id && (t as any)._id !== id));
        showSuccess("Task Deleted Successfully", `"${title}" has been removed.`);
      } else {
        showError("Failed to Delete Task", "Server rejected deletion.", "task");
      }
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      showError("Server Error", "Could not complete task removal.", "task");
    }
  };

  const programmaticAddTask = async (title: string, urgency: "low" | "medium" | "high" | "critical", dueDate: string) => {
    try {
      const res = await fetchWithAuth("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          dueDate,
          urgency,
          status: "pending"
        })
      });
      if (res.ok) {
        const added = await res.json();
        setTasks(prev => [added, ...prev]);
        showSuccess("Task Created Successfully", `"${added.title}" added via AI Assistant.`);
      } else {
        throw new Error("Failed to save task");
      }
    } catch (err) {
      console.error("Programmatic add task failed:", err);
      showError("Failed to Create Task", `Could not create automated task: "${title}"`);
      throw err;
    }
  };

  const handleRefreshTasks = async () => {
    try {
      const res = await fetchWithAuth("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to refresh tasks:", err);
    }
  };

  // Handle Twin Chat Submission
  const handleTwinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twinInput.trim() || isTwinChatting) return;

    const userMsg = twinInput;
    setTwinInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTwinChatting(true);

    try {
      const res = await fetchWithAuth("/api/agent/twin-chat", {
        method: "POST",
        body: JSON.stringify({
          userMessage: userMsg,
          chatHistory: chatMessages.map(m => ({ role: m.role, content: m.content })),
          context: userContext
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.reply,
          microAction: data.immediateMicroAction 
        }]);
        if (data.immediateMicroAction) {
          showSuccess("AI Action Triggered ⚡", `Action: "${data.immediateMicroAction}" has been initiated.`);
        }
      } else {
        showError("AI Engine Offline", "Failed to get response from your AI Twin.");
      }
    } catch (err) {
      console.error("Twin chat failed:", err);
      showError("Connection Error", "AI communication path interrupted.");
    } finally {
      setIsTwinChatting(false);
    }
  };

  // Handle Extension Negotiation Plan
  const handleNegotiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNegoLoading(true);
    try {
      const res = await fetchWithAuth("/api/agent/negotiate", {
        method: "POST",
        body: JSON.stringify({
          deadlineTitle: negoTitle,
          recipientName: negoRecipient,
          reason: negoReason,
          tone: negoTone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNegoResult(data);
        showSuccess("Negotiation Script Compiled ⚡", "Ready to extend your deadline.");
      } else {
        showError("Failed to Generate Scripts", "AI Negotiation Core was busy or encountered an error.");
      }
    } catch (err) {
      console.error("Negotiation engine failed:", err);
      showError("Connection Error", "Could not reach Negotiation service.");
    } finally {
      setIsNegoLoading(false);
    }
  };

  // Handle Exam/Interview Prep Generator
  const handleGeneratePrep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPrepLoading(true);
    try {
      const res = await fetchWithAuth("/api/agent/prepare", {
        method: "POST",
        body: JSON.stringify({
          examOrInterviewTitle: prepEvent,
          timeRemaining: prepTimeLeft,
          topicsToCover: prepTopics
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPrepPlan(data);
        showSuccess("High-Yield Study Blueprint Created 🎯", "Roadmap & mock prompts loaded.");
      } else {
        showError("Generation Failed", "Could not compute exam preparation plan.");
      }
    } catch (err) {
      console.error("Prep generator failed:", err);
      showError("Network Error", "Unable to transmit prep configuration.");
    } finally {
      setIsPrepLoading(false);
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setPrepTopics(prev => [...prev, newTopic.trim()]);
      setNewTopic("");
    }
  };

  // Get color configurations for urgency levels
  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-500/10 text-red-400 border-red-900/30";
      case "high": return "bg-amber-500/10 text-amber-400 border-amber-900/30";
      case "medium": return "bg-zinc-500/10 text-zinc-300 border-zinc-800";
      default: return "bg-zinc-800/20 text-zinc-400 border-zinc-900";
    }
  };

  // If no user email, enforce secure login flow
  if (!userEmail) {
    return (
      <div className="relative min-h-screen bg-brand-bg text-zinc-100 flex items-center justify-center overflow-hidden select-none">
        <div className="absolute inset-0 moving-grid pointer-events-none opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[150px] pointer-events-none" />
        <div className="w-full max-w-md p-4 relative z-10">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-mono font-bold text-black text-sm tracking-tighter">
              L⚡
            </div>
            <span className="font-display font-medium tracking-wide text-lg text-white">
              LifeSaver <span className="font-mono text-zinc-500 text-xs tracking-widest uppercase ml-1.5 border border-zinc-800 px-1.5 py-0.5 rounded">AI Assistant</span>
            </span>
          </div>
          <AuthScreen 
            onAuthSuccess={(email, role) => {
              setUserEmail(email);
              setUserRole(role);
              setView("dashboard");
            }} 
            currentEmail={undefined}
            onLogout={() => {}}
          />
        </div>
      </div>
    );
  }

  // Render Landing Page
  if (view === "landing") {
    return (
      <div className="relative min-h-screen bg-brand-bg text-zinc-100 overflow-hidden select-none">
        {/* Moving Grid Background */}
        <div className="absolute inset-0 moving-grid pointer-events-none opacity-20" />
        
        {/* Luxury Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[150px] pointer-events-none" />

        {/* Premium Header */}
        <header className="relative z-10 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between border-b border-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-mono font-bold text-black text-sm tracking-tighter">
              L⚡
            </div>
            <span className="font-display font-medium tracking-wide text-lg text-white">
              LifeSaver <span className="font-mono text-zinc-500 text-xs tracking-widest uppercase ml-1.5 border border-zinc-800 px-1.5 py-0.5 rounded">AI Assistant</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#features" className="hover:text-white transition-colors">How It Works</a>
            <button onClick={() => setView("dashboard")} className="hover:text-white text-left transition-colors cursor-pointer">Dashboard</button>
            <button onClick={() => setView("dashboard")} className="hover:text-white text-left transition-colors cursor-pointer">AI Assistant</button>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>

          <button 
            onClick={() => setView("dashboard")} 
            className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-sm font-medium transition-all cursor-pointer"
          >
            Get Started
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </header>

        {/* Hero Area */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Powered by Google Gemini
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] max-w-2xl">
                Never Miss <br/>What <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">Matters</span>
              </h1>

              <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-lg">
                LifeSaver is an intelligent productivity platform designed for students and professionals. Powered by advanced AI, it automatically prioritizes your tasks, schedules balanced work sessions, and predicts workload risks so you can meet every deadline without burning out.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-4">
                <button 
                  onClick={() => setView("dashboard")}
                  className="px-8 py-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] shadow-xl hover:shadow-white/5 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Start Free
                </button>
                <a 
                  href="#features" 
                  className="px-6 py-4 bg-zinc-900/60 border border-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-900 flex items-center justify-center gap-2"
                >
                  Explore AI Features
                </a>
              </div>

              {/* Dynamic real metrics */}
              <div className="grid grid-cols-2 gap-6 w-full pt-8 border-t border-zinc-900/80">
                <div>
                  <div className="text-2xl font-mono font-semibold text-white">
                    {tasks.filter(t => t.status === "completed").length}
                  </div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Tasks Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-semibold text-white">
                    {tasks.filter(t => t.status === "pending").length}
                  </div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Active Deadlines</div>
                </div>
              </div>
            </div>

            {/* Right Column Canvas / Interactive Module Preview */}
            <div className="lg:col-span-5 relative flex flex-col items-center">
              <div className="w-full max-w-md relative glass-panel rounded-3xl p-6 glow-accent border border-zinc-800/80">
                {/* Visual Neural Core Sphere */}
                <AICoreCanvas />
                
                <div className="mt-4 p-4 rounded-xl bg-black/40 border border-zinc-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">AI Scheduling Engine</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Analyzing active timelines. LifeSaver continuously coordinates constraints to prevent scheduling conflicts.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Features / Specialized Agents Architecture Section */}
        <section id="features" className="relative z-10 border-t border-zinc-900/80 py-24 bg-[#080808]/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">AI Productivity Platform</span>
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-white">
                Stay Organized. Meet Every Deadline.
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                LifeSaver runs dynamic analysis on your schedule. Instead of annoying notifications, it builds clear outlines, suggests helpful habits, and prepares drafts to optimize your daily focus.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Smart Task Prioritization", icon: Shield, desc: "Automatically ranks your active commitments and deadlines based on urgency so you always know what to tackle first." },
                { title: "AI Schedule Planner", icon: Brain, desc: "Drives your daily calendar by building custom study slots, deep focus blocks, and rest intervals personalized to your timeline." },
                { title: "Deadline Risk Detection", icon: AlertTriangle, desc: "Identifies scheduling conflicts and overlapping milestones in advance to recommend proactive remedies before you fall behind." },
                { title: "Habit Tracker", icon: Hourglass, desc: "Encourages daily consistency by logging routines, calculating streak statistics, and integrating habits into your scheduled day." },
                { title: "AI Chat Assistant", icon: MessageSquare, desc: "Interact directly with an intelligent companion to brainstorm study tactics, request feedback, or ask questions about your goals." },
                { title: "Workload Insights", icon: Zap, desc: "Calculates dynamic burnout risk and schedule density metrics, advising you exactly when to take a rest to maintain peak focus." }
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="glass-panel p-6 rounded-2xl border border-zinc-800/40 hover:border-zinc-700/60 transition-all group hover:-translate-y-1">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="about" className="relative z-10 border-t border-zinc-900 bg-black py-12 text-center text-xs text-zinc-600">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="font-display font-medium tracking-wide text-zinc-400">LifeSaver AI Assistant</span>
            </div>
            <p>© 2026 LifeSaver. Created by Shivani Nagda. Powered by Google Gemini & Firebase. All rights reserved.</p>
            <div className="flex items-center gap-4">
  <a
    href="https://github.com/ShivaniNagda"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-white transition-colors"
  >
    GitHub
  </a>

  <a
    href="https://www.linkedin.com/in/shivaninagda"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-white transition-colors"
  >
    LinkedIn
  </a>

  <a
    href="https://ShivaniNagda.vercel.app"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-white transition-colors"
  >
    Portfolio
  </a>

  <a
    href="https://github.com/ShivaniNagda/LifeSaver-AI-OS/blob/main/LICENSE"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-white transition-colors"
  >
    License
  </a>
</div>
          </div>
        </footer>
      </div>
    );
  }

  // Render Premium Platform / Interactive Dashboard View
  return (
    <div className="min-h-screen bg-brand-bg text-zinc-100 flex flex-col relative select-none">
      {/* Static grid backdrop */}
      <div className="absolute inset-0 moving-grid pointer-events-none opacity-10" />

      {/* Luxury OS Top Bar */}
      <header className="relative z-20 border-b border-zinc-900 bg-brand-bg/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-white flex items-center justify-center font-mono font-bold text-black text-xs tracking-tighter">
            L⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-white tracking-wide">LifeSaver AI Assistant</span>
              <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 px-1.5 py-0.2 rounded uppercase tracking-widest">
                Active
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tight mt-0.5">Account: {userEmail}</p>
          </div>
        </div>

        {/* Quick OS Stats */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
            <span className="text-zinc-400">TASKS COMPLETED:</span>
            <span className="text-white font-medium">{tasks.filter(t => t.status === "completed").length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-zinc-400">SYSTEM STATUS:</span>
            <span className="text-white font-medium">ONLINE</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-lg border border-zinc-900 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBellDropdown(!showBellDropdown);
                fetchNotifications();
              }}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer relative ${
                showBellDropdown 
                  ? "bg-zinc-800 border-zinc-700 text-white" 
                  : "border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white"
              }`}
              title="Notifications Panel"
            >
              <Bell className={`w-4 h-4 ${notifications.filter(n => !n.read).length > 0 ? "animate-pulse text-indigo-400" : ""}`} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showBellDropdown && (
                <>
                  {/* Backdrop trap to dismiss dropdown on click outside */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowBellDropdown(false)} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-40 p-1 flex flex-col overflow-hidden max-h-[420px]"
                  >
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                      <span className="text-[11px] font-semibold text-zinc-200">
                        Notifications ({notifications.filter(n => !n.read).length} unread)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            for (const n of notifications.filter(n => !n.read)) {
                              await fetchWithAuth(`/api/notifications/${n.id || n._id}/read`, { method: "PUT" });
                            }
                            fetchNotifications();
                            showSuccess("All marked as read");
                          }}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors focus:outline-none cursor-pointer"
                        >
                          Mark all read
                        </button>
                        <span className="text-zinc-700 text-[9px]">&bull;</span>
                        <button
                          onClick={async () => {
                            for (const n of notifications) {
                              await fetchWithAuth(`/api/notifications/${n.id || n._id}`, { method: "DELETE" });
                            }
                            fetchNotifications();
                            showSuccess("All notifications cleared");
                          }}
                          className="text-[9px] text-zinc-500 hover:text-red-400 font-medium transition-colors focus:outline-none cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-zinc-850 pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const nId = notif.id || notif._id;
                          return (
                            <div 
                              key={nId}
                              onClick={async () => {
                                if (!notif.read) {
                                  await fetchWithAuth(`/api/notifications/${nId}/read`, { method: "PUT" });
                                  fetchNotifications();
                                }
                                setShowBellDropdown(false);
                                if (notif.taskId) {
                                  setActiveTab("overview");
                                  setTimeout(() => {
                                    const element = document.getElementById(`task-item-${notif.taskId}`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: "smooth" });
                                    }
                                  }, 300);
                                } else {
                                  setActiveTab("notifications");
                                }
                              }}
                              className={`p-3 text-left transition-colors cursor-pointer hover:bg-zinc-950/60 flex flex-col gap-1 ${
                                !notif.read ? "bg-indigo-950/15" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-semibold truncate ${!notif.read ? "text-white" : "text-zinc-400"}`}>
                                  {notif.title || "Alert"}
                                </span>
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-snug">
                                {notif.message}
                              </p>
                              <span className="text-[8px] font-mono text-zinc-600 mt-0.5 self-start">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString() : "Recent"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-zinc-800 p-2 bg-zinc-950/40 text-center">
                      <button
                        onClick={() => {
                          setShowBellDropdown(false);
                          setActiveTab("notifications");
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors focus:outline-none cursor-pointer"
                      >
                        View Notification History
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleLogout} 
            className="text-xs text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800 bg-zinc-950 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-white border-white text-black font-semibold" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title="Open Settings Console"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main OS App Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: System Context, Active Goals, Habit list & Real-time Tasks (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Section 1: Dynamic Life OS Context Input */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-white" />
                <h2 className="text-xs font-mono tracking-wider uppercase text-zinc-300">Describe Your Situation</h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">DYNAMIC SYNC</span>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              Describe your current situation, upcoming exams, or active tasks. The AI analyzes this input to formulate your personalized execution schedule.
            </p>

            <div className="space-y-3">
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="E.g., I have my Java DSA interview next week, three assignments due, an upcoming exam, and want to study 4 hours every day while keeping a healthy sleep schedule."
                className="w-full h-24 bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors resize-none font-sans"
              />
              <button
                onClick={runLifeOSEngine}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    Generating AI Plan...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-black" />
                    Generate AI Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Proactive Task Management Block */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white" />
                  <h2 className="text-xs font-mono tracking-wider uppercase text-zinc-300">Tasks &amp; Deadlines</h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">TOTAL: {tasks.length}</span>
              </div>

              {/* Quick Action: AI Schedule Scanner Shortcut */}
              <button
                type="button"
                onClick={() => setActiveTab("scanner")}
                className="w-full mb-4 flex items-center justify-between p-2.5 rounded-xl border border-violet-500/20 hover:border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">📷 Quick Action: Scan Schedule</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">Import photo of handwritten/printed planner</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 transition-all" />
              </button>

              {/* Task Quick-Add form */}
              <form onSubmit={handleAddTask} className="grid grid-cols-12 gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Analyze pitch feedback..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="col-span-6 bg-zinc-950/80 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
                />
                <select
                  value={newTaskUrgency}
                  onChange={(e: any) => setNewTaskUrgency(e.target.value)}
                  className="col-span-3 bg-zinc-950/80 border border-zinc-900 rounded-lg px-1.5 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-zinc-800"
                >
                  <option value="low">Low</option>
                  <option value="medium">Med</option>
                  <option value="high">High</option>
                  <option value="critical">Alert</option>
                </select>
                <button
                  type="submit"
                  className="col-span-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium rounded-lg text-xs flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Tasks List rendering */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-850">
                    <div className="p-2.5 bg-zinc-900 rounded-lg text-zinc-500 mb-2.5">
                      <CheckCircle className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-200">🚀 Ready to organize your day?</p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
                      Add your first task above and let the AI automatically build your personalized execution schedule.
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-zinc-900/60 hover:border-zinc-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={task.status === "completed"}
                          onChange={() => toggleTaskStatus(task.id)}
                          className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-950 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-sans truncate ${task.status === "completed" ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                            {task.title}
                          </p>
                          <p className="text-[9px] font-mono text-zinc-500 mt-0.5">Due: {task.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-mono uppercase tracking-wider ${getUrgencyBadgeClass(task.urgency)}`}>
                          {task.urgency}
                        </span>
                        <button 
                          onClick={() => removeTask(task.id)} 
                          className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Static System Indicators */}
            <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LOCAL DATA SYNCHRONIZED
              </span>
              <span>SECURE LOCAL STORAGE</span>
            </div>
          </div>

        </div>

        {/* MIDDLE & RIGHT COMBINED WORKSPACE (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* High-End Sub-Navigation for Advanced OS Modes */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-900 max-w-full overflow-x-auto scrollbar-thin">
            {[
              { id: "overview", label: "Dashboard", icon: Activity },
              { id: "scanner", label: "AI Scanner", icon: Camera },
              { id: "calendar", label: "Calendar", icon: Calendar },
              { id: "goals", label: "Goals", icon: Target },
              { id: "habits", label: "Habit Tracker", icon: Hourglass },
              { id: "voice", label: "AI Voice Assistant", icon: Mic },
              { id: "twin", label: "AI Chat", icon: MessageSquare },
              { id: "negotiate", label: "AI Negotiator", icon: Mail },
              { id: "prep", label: "Exam & Interview Prep", icon: BookOpen },
              { id: "notifications", label: "AI Notifications", icon: Bell },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected 
                      ? "bg-white text-black font-semibold" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT 1: Dashboard (Primary UI Overview with AI prediction widgets) */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Analytics Summary Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Score Widget 1: Success Probability */}
                <div className="glass-panel p-5 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Success Probability</span>
                    <Target className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="my-3">
                    <span className="text-4xl font-display font-semibold text-white">
                      {osResponse ? `${osResponse.successProbability}%` : "84%"}
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Based on schedule density</p>
                  </div>
                  {/* Subtle progress bar */}
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-1000" 
                      style={{ width: `${osResponse ? osResponse.successProbability : 84}%` }} 
                    />
                  </div>
                </div>

                {/* Score Widget 2: Burnout Risk */}
                <div className="glass-panel p-5 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Burnout Risk</span>
                    <Zap className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="my-3">
                    <span className="text-4xl font-display font-semibold text-white">
                      {osResponse ? `${osResponse.burnoutRisk}%` : "18%"}
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Mental stamina &amp; rest projection</p>
                  </div>
                  {/* Subtle warning bar */}
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        (osResponse ? osResponse.burnoutRisk : 18) > 60 ? "bg-red-500" : "bg-zinc-400"
                      }`} 
                      style={{ width: `${osResponse ? osResponse.burnoutRisk : 18}%` }} 
                    />
                  </div>
                </div>

                {/* Score Widget 3: Failure Prediction & Warnings */}
                <div className="glass-panel p-5 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Risk Assessment</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="my-2">
                    <span className="text-xs font-mono font-medium text-amber-400 block tracking-tight">ALERT: FAILURE PROBABILITY DETECTED</span>
                    <p className="text-xs text-zinc-300 leading-snug mt-1 font-sans line-clamp-2">
                      {osResponse ? osResponse.failurePrediction : "No extreme threats. Maintain study schedule."}
                    </p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">AI STATUS: ACTIVE</div>
                </div>

              </div>

              {/* AI Strategy Advice Block */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">AI Recommendation</h4>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed mt-1">
                    {osResponse ? osResponse.aiCoachAdvice : "Awaiting context. Enter details on the left and click 'Generate AI Plan' to receive tailored productivity advice."}
                  </p>
                </div>
              </div>

              {/* Dynamic Automated Timeline Nodes */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Recommended Daily Schedule</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">AI PLANNER</span>
                </div>

                <div className="relative border-l border-zinc-800 ml-4 pl-6 space-y-6">
                  {osResponse && osResponse.timeline ? (
                    osResponse.timeline.map((node) => (
                      <div key={node.id} className="relative group">
                        {/* Timeline Bullet Anchor */}
                        <div className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 bg-white ${
                          node.status === "high_risk" ? "ring-4 ring-red-500/20 bg-red-400" : ""
                        }`} />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 mr-2 uppercase tracking-wide">
                              [{node.time}]
                            </span>
                            <span className="text-xs font-medium text-white group-hover:text-zinc-300 transition-colors">
                              {node.title}
                            </span>
                          </div>
                          <span className={`inline-block self-start md:self-auto px-2 py-0.5 rounded text-[8px] font-mono uppercase border ${
                            node.type === "rescue_action" ? "bg-red-500/10 text-red-400 border-red-900/30" : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          }`}>
                            {node.type}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-2xl">{node.description}</p>
                      </div>
                    ))
                  ) : (
                    // Placeholder Nodes
                    <>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 bg-white" />
                        <span className="text-[10px] font-mono text-zinc-500 mr-2 uppercase tracking-wide">[09:00 AM]</span>
                        <span className="text-xs font-medium text-white">Active Recall Session (Chemistry Midterm)</span>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Focus time allocated for studying electrochemistry equations.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 bg-red-400 ring-4 ring-red-500/20" />
                        <span className="text-[10px] font-mono text-zinc-500 mr-2 uppercase tracking-wide">[02:30 PM]</span>
                        <span className="text-xs font-medium text-white">Critical Bill &amp; Infrastructure Payment Block</span>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Urgent priority task. Complete pending SaaS server hosting payments.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 bg-zinc-700" />
                        <span className="text-[10px] font-mono text-zinc-500 mr-2 uppercase tracking-wide">[04:30 PM]</span>
                        <span className="text-xs font-medium text-white">Mandatory Mental Recharging Reserve</span>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Schedule indicates high mental strain. Rest and take a 15-minute break.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Coordinated Live Agent Terminal Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">AI Activity Logs</span>
                  <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● LIVE STATUS MONITOR</span>
                </div>
                <AgentLogsTerminal logs={osResponse?.agentLogs} isProcessing={isProcessing} />
              </div>

            </div>
          )}

          {/* TAB CONTENT 2: Deadline Rescue Mode (Dramatic Rescue HUD with Emergency Tactics) */}
          {activeTab === "rescue" && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-2xl border border-red-900/40 bg-gradient-to-br from-red-950/20 via-brand-bg to-zinc-950/80 glow-rescue relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-semibold">Emergency Plan</span>
                </div>

                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Task Rescue Active</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl mt-1.5">
                  We have detected tight timelines (Chemistry exam and pending tasks). Your personalized emergency action plan and negotiation draft are ready below.
                </p>

                {/* Tactical checklists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-red-950/10 border border-red-900/30">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 block mb-2">Immediate Action Plan</span>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-mono shrink-0">1.</span>
                        <span>Mute social media and messaging apps to secure a 90-minute focus window.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-mono shrink-0">2.</span>
                        <span>Settle any urgent invoices or deadlines (use Negotiator draft if you need an extension).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-mono shrink-0">3.</span>
                        <span>Complete the high-yield study topics for your upcoming Chemistry test.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Plan Metrics</span>
                    <div className="space-y-3 font-mono text-[11px] text-zinc-400">
                      <div className="flex justify-between">
                        <span>DISTRACTION REDUCTION:</span>
                        <span className="text-red-400 font-bold">RECOMMENDED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AUTO-SCHEDULING:</span>
                        <span className="text-emerald-400 font-bold">ENABLED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SUCCESS ESTIMATE:</span>
                        <span className="text-white font-bold">88.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Self Alternate Timelines (Simulator) */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
                  <Hourglass className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Weekly Scenarios</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timeline A: Path of Alignment */}
                  <div className="space-y-2 p-4 rounded-xl bg-zinc-900/20 border border-zinc-900/60">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase tracking-wider">Optimal Path (+7 Days)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">
                      {osResponse ? osResponse.futureSelfDialog.positiveScenario : "You completed your chemistry prep with full clarity, secured key objectives, and cleared all immediate tasks. Mental stress index dropped by 72%."}
                    </p>
                  </div>

                  {/* Timeline B: Path of Friction */}
                  <div className="space-y-2 p-4 rounded-xl bg-zinc-900/20 border border-zinc-900/60">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      <span className="text-xs font-mono uppercase tracking-wider">Unplanned Path (+7 Days)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">
                      {osResponse ? osResponse.futureSelfDialog.negativeScenario : "Skipped study blocks and forgot critical deadlines. Suffer from last-minute cramming and study fatigue."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 3: AI Chat (Interactive Real AI Chat) */}
          {activeTab === "twin" && (
            <div className="glass-panel p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between min-h-[460px]">
              
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4.5 h-4.5 text-white" />
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">AI Assistant Chat</h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">AI ASSISTANT PERSPECTIVE</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">AI Helper</span>
                </div>

                {/* Chat window viewport */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex gap-3 max-w-xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                        msg.role === "user" 
                          ? "bg-zinc-800 border-zinc-700 text-zinc-200" 
                          : "bg-white border-zinc-300 text-black font-semibold text-xs"
                      }`}>
                        {msg.role === "user" ? "U" : "A"}
                      </div>
                      <div className="space-y-2">
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans ${
                          msg.role === "user" 
                            ? "bg-zinc-900 border border-zinc-800 text-zinc-100" 
                            : "bg-zinc-950 border border-zinc-900 text-zinc-300"
                        }`}>
                          {msg.content}
                        </div>
                        {msg.microAction && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-900/30 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <div>
                              <span className="text-[9px] font-mono text-emerald-400 block uppercase tracking-wider">Immediate Action Suggestion</span>
                              <p className="text-[10px] text-zinc-300 font-medium">{msg.microAction}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTwinChatting && (
                    <div className="flex gap-2 items-center text-xs text-zinc-500 italic">
                      <span className="w-2 h-2 rounded-full bg-zinc-600 animate-ping mr-1" />
                      Assistant is typing...
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleTwinChat} className="flex gap-2.5 mt-4 pt-4 border-t border-zinc-900">
                <input
                  type="text"
                  value={twinInput}
                  onChange={(e) => setTwinInput(e.target.value)}
                  placeholder="Ask: 'How should I schedule my Chemistry studying?'"
                  className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
                />
                <button
                  type="submit"
                  disabled={isTwinChatting}
                  className="px-4 py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

          {/* TAB CONTENT 4: AI Extension Negotiator (Professional correspondence draft tool) */}
          {activeTab === "negotiate" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Form parameter inputs */}
              <div className="md:col-span-5 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Negotiator Settings</h3>
                </div>

                <form onSubmit={handleNegotiate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Task Title</label>
                    <input
                      type="text"
                      value={negoTitle}
                      onChange={(e) => setNegoTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Recipient (Professor/Vendor)</label>
                    <input
                      type="text"
                      value={negoRecipient}
                      onChange={(e) => setNegoRecipient(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Justification/Reason</label>
                    <textarea
                      value={negoReason}
                      onChange={(e) => setNegoReason(e.target.value)}
                      className="w-full h-18 bg-zinc-950 border border-zinc-900 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Requested Tone</label>
                    <select
                      value={negoTone}
                      onChange={(e) => setNegoTone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none focus:border-zinc-800"
                    >
                      <option value="professional">Professional / Highly Polished</option>
                      <option value="deferential">Respectful / Academic Deference</option>
                      <option value="entrepreneurial">Transparent Startup Style</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isNegoLoading}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 disabled:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {isNegoLoading ? "Generating email draft..." : "Draft Request"}
                  </button>
                </form>
              </div>

              {/* Right Column: Dynamic AI formulated result output */}
              <div className="md:col-span-7 glass-panel p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Generated Draft</span>
                    <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded">
                      AI Negotiator
                    </span>
                  </div>

                  {negoResult ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block">SUBJECT LINE:</span>
                        <p className="text-xs font-semibold text-white mt-1">{negoResult.subject}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-900/80 font-sans text-xs text-zinc-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                        {negoResult.body}
                      </div>

                      <div className="p-3 rounded-lg bg-white/[0.02] border border-zinc-900">
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wide">Negotiation Strategy</span>
                        <p className="text-xs text-zinc-500 font-sans italic mt-1 leading-relaxed">
                          {negoResult.tacticalTip}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-zinc-950/20 rounded-xl border border-dashed border-zinc-900">
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 mb-3.5">
                        <Mail className="w-5 h-5 text-zinc-400" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-300">📬 Negotiation Assistant</p>
                      <p className="text-[11px] text-zinc-500 mt-1 max-w-[280px] leading-relaxed">
                        Fill out the form on the left and click "Draft Request" to generate a professional email draft.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 5: Exam & Interview Prep (Tactical phase planners) */}
          {activeTab === "prep" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Form input configs */}
              <div className="md:col-span-5 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Exam &amp; Interview Details</h3>
                </div>

                <form onSubmit={handleGeneratePrep} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Exam or Interview Name</label>
                    <input
                      type="text"
                      value={prepEvent}
                      onChange={(e) => setPrepEvent(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Time Remaining</label>
                    <input
                      type="text"
                      value={prepTimeLeft}
                      onChange={(e) => setPrepTimeLeft(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">Topics to Cover</label>
                    
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Add topic..."
                        className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddTopic}
                        className="px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium rounded-lg text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {prepTopics.map((topic, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 flex items-center gap-1.5"
                        >
                          {topic}
                          <button 
                            type="button" 
                            onClick={() => setPrepTopics(prev => prev.filter((_, i) => i !== index))}
                            className="text-zinc-600 hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPrepLoading}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 disabled:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {isPrepLoading ? "Analyzing topics..." : "Generate Preparation Strategy"}
                  </button>
                </form>
              </div>

              {/* Right Column: AI Formulated custom preparation phase planner */}
              <div className="md:col-span-7 glass-panel p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Optimized Study Strategy</span>
                  <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded">
                    AI Tutor
                  </span>
                </div>

                {prepPlan ? (
                  <div className="space-y-4">
                    
                    {/* Phase schedule */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-mono text-zinc-500 block">STUDY PHASES:</span>
                      {prepPlan.schedulePhases.map((phase, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-900 flex justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-white block">{phase.phase}</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">{phase.focus}</p>
                            <p className="text-[9px] font-mono text-zinc-600">Method: {phase.method}</p>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0 bg-black/60 border border-zinc-800 px-2 py-0.5 rounded self-start">
                            {phase.duration}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* High-yield check */}
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 block mb-1">HIGH-YIELD CORE TOPICS:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {prepPlan.highYieldTopics.map((topic, idx) => (
                          <span key={idx} className="px-2 py-1 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-300">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stress Remedy */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-zinc-900">
                      <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wide">Stress &amp; Burnout Tips</span>
                      <p className="text-xs text-zinc-500 font-sans italic mt-1 leading-relaxed">
                        {prepPlan.stressRemedy}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-24 px-4 bg-zinc-950/20 rounded-xl border border-dashed border-zinc-900">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 mb-3.5">
                      <BookOpen className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-300">📚 Study Strategy Standby</p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-[280px] leading-relaxed">
                      Enter your target event, timing constraints, and study topics on the left to generate an active-recall study strategy.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT 6: Calendar Module */}
          {activeTab === "calendar" && (
            <CalendarModule tasks={tasks} />
          )}

          {/* TAB CONTENT 7: Goals Tracker */}
          {activeTab === "goals" && (
            <GoalTracker />
          )}

          {/* TAB CONTENT 8: Habit Tracker */}
          {activeTab === "habits" && (
            <HabitTracker />
          )}

          {/* TAB CONTENT 8.5: Voice Assistant */}
          {activeTab === "voice" && (
            <VoiceAssistant 
              tasks={tasks} 
              onAddTask={programmaticAddTask} 
              onRefreshTasks={handleRefreshTasks} 
              runLifeOSEngine={runLifeOSEngine} 
            />
          )}

          {/* TAB CONTENT 8.8: AI Smart Notifications */}
          {activeTab === "notifications" && (
            <NotificationsPanel 
              tasks={tasks} 
              onRefreshTasks={handleRefreshTasks}
            />
          )}

          {/* TAB CONTENT 8.9: AI Schedule Scanner */}
          {activeTab === "scanner" && (
            <AIScheduleScanner 
              onRefreshTasks={handleRefreshTasks}
            />
          )}

          {/* TAB CONTENT 9: Settings Panel */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <SettingsPanel 
                  userEmail={userEmail || ""} 
                  userRole={userRole} 
                  onUpdateRole={(role) => setUserRole(role)} 
                />
              </div>
              <div className="md:col-span-4">
                <AuthScreen 
                  onAuthSuccess={(email, role) => {
                    setUserEmail(email);
                    setUserRole(role);
                  }} 
                  currentEmail={userEmail || undefined}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

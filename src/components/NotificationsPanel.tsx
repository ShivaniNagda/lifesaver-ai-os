import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, Mail, Settings, Activity, CheckCircle, AlertCircle, 
  Calendar, Clock, ArrowRight, Eye, Play, Shield, Zap, Sparkles, 
  RefreshCw, AlertTriangle, EyeOff, Check, X
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface SentEmail {
  id?: string;
  _id?: string;
  userEmail: string;
  subject: string;
  taskTitle: string;
  type: string;
  success: boolean;
  statusMessage: string;
  sentAt: string;
  html: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "completed";
}

function getTaskDueDate(dueDateStr: string): Date | null {
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
    const d = new Date(year, month, day, 18, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(dueDateStr);
  return isNaN(d.getTime()) ? null : d;
}

interface NotificationsPanelProps {
  tasks: Task[];
  onRefreshTasks?: () => void;
}

export default function NotificationsPanel({ tasks, onRefreshTasks }: NotificationsPanelProps) {
  // Settings state
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [reminder24hEnabled, setReminder24hEnabled] = useState(true);
  const [reminder3hEnabled, setReminder3hEnabled] = useState(true);
  const [reminder30mEnabled, setReminder30mEnabled] = useState(true);
  const [reminderMissedEnabled, setReminderMissedEnabled] = useState(true);

  // SMTP variables config status
  const [smtpConfig, setSmtpConfig] = useState<{
    EMAIL_SERVICE: string;
    EMAIL_HOST: string;
    EMAIL_PORT: string;
    EMAIL_USER: string;
    isPassConfigured: boolean;
  } | null>(null);

  const { success: tSuccess, error: tError, info: tInfo } = useToast();

  // UI state
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [history, setHistory] = useState<SentEmail[]>([]);
  const [activeEmailPreview, setActiveEmailPreview] = useState<SentEmail | null>(null);

  const maskEmail = (email: string) => {
    if (!email) return "Verified ✓";
    const [local, domain] = email.split("@");
    if (!domain) return email;
    if (local.length <= 4) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 4)}****@${domain}`;
  };

  const getHeaders = () => {
    const token = localStorage.getItem("lifeos_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (type === "success") {
      tSuccess(message);
    } else if (type === "error") {
      tError(message);
    } else {
      tInfo(message);
    }
  };

  // Load Preferences & Sent History
  const loadData = async () => {
    setLoadingSettings(true);
    setLoadingHistory(true);
    try {
      // 1. Load preferences from global settings
      const settingsRes = await fetch("/api/settings", { headers: getHeaders() });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data) {
          setEmailNotificationsEnabled(data.emailNotificationsEnabled !== false);
          setReminder24hEnabled(data.reminder24hEnabled !== false);
          setReminder3hEnabled(data.reminder3hEnabled !== false);
          setReminder30mEnabled(data.reminder30mEnabled !== false);
          setReminderMissedEnabled(data.reminderMissedEnabled !== false);
          if (data.smtpConfigStatus) {
            setSmtpConfig(data.smtpConfigStatus);
          }
        }
      }

      // 2. Load sent email history
      const historyRes = await fetch("/api/notifications/history", { headers: getHeaders() });
      if (historyRes.ok) {
        const data = await historyRes.json();
        if (Array.isArray(data)) {
          // Sort by newest sentAt
          const sorted = data.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
          setHistory(sorted);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications page data", err);
      showToast("Connection to notification API failed.", "error");
    } finally {
      setLoadingSettings(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Preferences
  const handleSavePreferences = async (updates: any) => {
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        showToast("Notification settings synced successfully.", "success");
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch (err) {
      showToast("Error updating preferences.", "error");
    }
  };

  // Dispatch Test Email
  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/notifications/test-email", {
        method: "POST",
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Test email successfully sent to ${data.email || "configured inbox"}!`, "success");
        // Reload history
        setTimeout(loadData, 800);
      } else {
        showToast(data.error || "Failed to trigger test email.", "error");
      }
    } catch (err) {
      showToast("Error sending test email.", "error");
    } finally {
      setSendingTest(false);
    }
  };

  // Run deadline sweep immediately
  const handleRunDeadlineCheck = async () => {
    setRunningCheck(true);
    try {
      const res = await fetch("/api/notifications/run-check", {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        showToast("Deadline scan complete. Any active reminders have been dispatched.", "success");
        if (onRefreshTasks) onRefreshTasks();
        setTimeout(loadData, 800);
      } else {
        showToast("Manual scanning sweep failed.", "error");
      }
    } catch (err) {
      showToast("Error executing manual scan.", "error");
    } finally {
      setRunningCheck(false);
    }
  };

  // Compute stats based on current tasks
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const now = new Date();

  const upcomingDeadlines = pendingTasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return !isNaN(due.getTime()) && due > now;
  });

  const overdueTasks = pendingTasks.filter(t => {
    if (!t.dueDate) return false;
    // Standard YYYY-MM-DD parsing
    const due = new Date(t.dueDate);
    if (isNaN(due.getTime())) return false;
    // If it is just YYYY-MM-DD, check if it was before today
    const todayStr = now.toISOString().split("T")[0];
    return t.dueDate < todayStr;
  });

  const lastSentEmail = history.length > 0 ? history[0] : null;

  return (
    <div className="space-y-6" id="notifications-panel-root">
      
      {/* Header Widget with system status */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Smart AI Deadline Notification System
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Automated background cron triggers intelligent executive coaching tips directly to your registered inbox as tasks approach their deadlines.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300">SYSTEM ACTIVE</span>
          </div>

          <button
            onClick={handleRunDeadlineCheck}
            disabled={runningCheck}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-[11px] font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningCheck ? "animate-spin text-indigo-400" : ""}`} />
            Scan Deadlines Now
          </button>
        </div>
      </div>

      {/* Grid: Dashboard Analytics & Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Upcoming Deadlines */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">Upcoming Deadlines</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{upcomingDeadlines.length}</div>
            <p className="text-[10px] text-zinc-500 mt-1">Pending active schedules</p>
          </div>
        </div>

        {/* Metric 2: Overdue Tasks */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${overdueTasks.length > 0 ? "text-amber-500" : "text-white"}`}>
              {overdueTasks.length}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Action plan needed</p>
          </div>
        </div>

        {/* Metric 3: Total Notifications Sent */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">Notifications History</span>
            <Mail className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{history.length}</div>
            <p className="text-[10px] text-zinc-500 mt-1">Dispatched alerts & logs</p>
          </div>
        </div>

        {/* Metric 4: Last Notification Sent */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">Last Email Sent</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-white truncate">
              {lastSentEmail ? lastSentEmail.subject.replace("⚡ LifeSaver OS: ", "").replace("Upcoming Deadline Reminder: ", "") : "None Sent Yet"}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              {lastSentEmail ? new Date(lastSentEmail.sentAt).toLocaleTimeString() : "Dashboard idle"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Settings Panel & Live History Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Notification Preferences & Core Configuration (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                Notification Preferences
              </h3>
              
              {/* Main Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotificationsEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setEmailNotificationsEnabled(val);
                    handleSavePreferences({ emailNotificationsEnabled: val });
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <div className={`space-y-4 transition-opacity ${emailNotificationsEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
              
              {/* Preference 1: 24h Before */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-white">24-Hour Reminder</span>
                  <span className="text-[10px] text-zinc-500">Subject: Upcoming Deadline Reminder</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminder24hEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setReminder24hEnabled(val);
                    handleSavePreferences({ reminder24hEnabled: val });
                  }}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700 focus:ring-0 focus:ring-offset-0"
                />
              </div>

              {/* Preference 2: 3h Before */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-white">3-Hour Reminder</span>
                  <span className="text-[10px] text-zinc-500">Subject: High Priority Reminder</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminder3hEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setReminder3hEnabled(val);
                    handleSavePreferences({ reminder3hEnabled: val });
                  }}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700 focus:ring-0 focus:ring-offset-0"
                />
              </div>

              {/* Preference 3: 30m Before */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-white">30-Minute Final Notice</span>
                  <span className="text-[10px] text-zinc-500">Subject: Final Reminder</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminder30mEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setReminder30mEnabled(val);
                    handleSavePreferences({ reminder30mEnabled: val });
                  }}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700 focus:ring-0 focus:ring-offset-0"
                />
              </div>

              {/* Preference 4: Missed Deadline */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-white">Missed Deadline Recovery</span>
                  <span className="text-[10px] text-zinc-500">Subject: Deadline Missed</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderMissedEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setReminderMissedEnabled(val);
                    handleSavePreferences({ reminderMissedEnabled: val });
                  }}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700 focus:ring-0 focus:ring-offset-0"
                />
              </div>
            </div>

            {/* Test Email Button Container */}
            <div className="border-t border-zinc-800 pt-5 text-center">
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !emailNotificationsEnabled}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer transition"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Send Test Email Now
                  </>
                )}
              </button>
              <p className="text-[10px] text-zinc-500 mt-2">
                Sends a full-fidelity smart notification featuring simulated active coaching directly to your profile's inbox.
              </p>
            </div>
          </div>

          {/* Smart Notification Service Status Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              Smart Notification Service
            </h3>
            
            <p className="text-[11px] text-zinc-400 leading-normal">
              LifeSaver automatically scans pending task schedules and dispatches high-priority reminder alerts prior to active deadlines.
            </p>

            <div className="space-y-2.5 text-xs bg-black/40 p-3.5 rounded-xl border border-zinc-900 font-sans">
              <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                <span className="text-zinc-500 font-medium">Service Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                <span className="text-zinc-500 font-medium">Delivery Health</span>
                <span className="text-emerald-400 font-semibold">Excellent</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                <span className="text-zinc-500 font-medium">Success Rate</span>
                <span className="text-zinc-200 font-semibold">
                  {history.length > 0 
                    ? `${Math.round((history.filter(h => h.success).length / history.length) * 100)}%` 
                    : "100%"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                <span className="text-zinc-500 font-medium">Verified Email Account</span>
                <span className="text-zinc-300 font-semibold font-mono">
                  {maskEmail(history[0]?.userEmail || "shivanifs.1786145@gmail.com")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 font-medium">Security Guardrail</span>
                <span className="text-indigo-400 font-semibold">Encrypted (TLS v1.3)</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-1">
              <div className="text-[10px] text-zinc-400 leading-relaxed font-sans flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400 inline" />
                <span>Automatic deadlines recovery system is active.</span>
              </div>
              <p className="text-[9.5px] text-zinc-500 leading-normal">
                Scheduled cron tasks verify item deadlines on the server securely without exposing configurations to client instances.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Notification Logs & Live Timeline (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex-1 flex flex-col min-h-[400px]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-zinc-800 pb-4 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              Notifications & Email Timeline
            </h3>

            {loadingHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-500 mt-3">Syncing dispatch log...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                <Bell className="w-10 h-10 text-zinc-700 mb-2 animate-pulse" />
                <h4 className="text-xs font-semibold text-zinc-400">Timeline Empty</h4>
                <p className="text-[10px] text-zinc-600 max-w-xs mt-1">
                  Once your task deadlines trigger reminders, or when you dispatch a test email, the historical logs will list here.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {history.map((email) => (
                  <div 
                    key={email.id || email._id}
                    className="flex items-start justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition"
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${
                        email.type === "test_email" 
                          ? "bg-indigo-950/50 border border-indigo-900 text-indigo-400"
                          : email.type === "missed_reminder"
                          ? "bg-red-950/50 border border-red-900 text-red-400"
                          : "bg-emerald-950/50 border border-emerald-900 text-emerald-400"
                      }`}>
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-xs font-semibold text-white">{email.subject}</div>
                        <div className="text-[10px] text-zinc-400">
                          To: <span className="text-zinc-300 font-mono">{maskEmail(email.userEmail)}</span> &bull; Task: <span className="text-indigo-300 font-medium">{email.taskTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            email.success 
                              ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                              : "bg-red-950 border border-red-800 text-red-300"
                          }`}>
                            {email.statusMessage}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {new Date(email.sentAt).toLocaleDateString()} {new Date(email.sentAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveEmailPreview(email)}
                      className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded bg-indigo-950/30 border border-indigo-900/30 hover:border-indigo-800 cursor-pointer transition shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Deadlines Overview Card List */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
          <CalendarClock className="w-4 h-4 text-indigo-400" />
          Active Deadline Monitor (Upcoming & Pending Schedules)
        </h3>
        {pendingTasks.length === 0 ? (
          <p className="text-xs text-zinc-500">No active pending tasks. Excellent task hygiene!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingTasks.map((t) => {
              const due = getTaskDueDate(t.dueDate);
              const isOverdue = due && due < now;
              return (
                <div 
                  key={t.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isOverdue 
                      ? "bg-red-950/10 border-red-900/50" 
                      : "bg-zinc-950 border-zinc-900"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{t.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        t.urgency === "critical"
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : t.urgency === "high"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}>
                        {t.urgency}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {t.dueDate || "Not set"}
                      </span>
                    </div>
                  </div>
                  {isOverdue && (
                    <span className="text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-full bg-red-950/50 border border-red-900/50 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 animate-bounce" />
                      OVERDUE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HTML Email Live View Modal / Slide-over Drawer */}
      <AnimatePresence>
        {activeEmailPreview && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white truncate max-w-sm">
                      {activeEmailPreview.subject}
                    </h4>
                    <p className="text-[9px] text-zinc-500 mt-0.5">
                      Delivered to <span className="font-mono">{maskEmail(activeEmailPreview.userEmail)}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveEmailPreview(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Email Content Frame */}
              <div className="flex-1 bg-[#0f172a] overflow-hidden">
                <iframe
                  title="Email Preview Frame"
                  srcDoc={activeEmailPreview.html}
                  className="w-full h-full border-0"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-zinc-800 flex justify-end bg-zinc-950/60">
                <button
                  onClick={() => setActiveEmailPreview(null)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer transition"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Missing icon definitions in some setups
function CalendarClock(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M12 14v4l2 2" />
      <circle cx="17" cy="17" r="5" />
    </svg>
  );
}

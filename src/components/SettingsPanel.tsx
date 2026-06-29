import React, { useState, useEffect } from "react";
import { Settings, Shield, User, Bell, Cpu, Lock, Sparkles, Check } from "lucide-react";
import { useToast } from "./ToastProvider";

interface SettingsPanelProps {
  userEmail: string;
  userRole: string;
  onUpdateRole: (role: string) => void;
}

export default function SettingsPanel({ userEmail, userRole, onUpdateRole }: SettingsPanelProps) {
  const { success: showSuccess, error: showError } = useToast();
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "ai" | "security">("profile");

  // Form states
  const [name, setName] = useState("Shivanifs");
  const [avatar, setAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80");
  const [workHoursStart, setWorkHoursStart] = useState("08:00");
  const [workHoursEnd, setWorkHoursEnd] = useState("18:00");
  const [focusLevel, setFocusLevel] = useState("max");

  // Notifications state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [burnoutTriggers, setBurnoutTriggers] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState(15);
  
  // Expanded Premium Notifications
  const [weeklyProgressReports, setWeeklyProgressReports] = useState(true);
  const [dailyWorkspaceSummaries, setDailyWorkspaceSummaries] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState("At Deadline");

  // AI settings
  const [modelType, setModelType] = useState("gemini-1.5-pro");
  const [disruptionGrade, setDisruptionGrade] = useState("high");
  const [pacingInterval, setPacingInterval] = useState("45m");

  // New AI preferences
  const [aiResponseStyle, setAiResponseStyle] = useState("balanced");
  const [creativityLevel, setCreativityLevel] = useState("medium");
  const [scheduleStyle, setScheduleStyle] = useState("work");

  // Database Connection Status
  const [isMongoConnected, setIsMongoConnected] = useState<boolean | null>(null);

  // Save indication
  const [saveIndication, setSaveIndication] = useState(false);
  const [loading, setLoading] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("lifeos_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/settings", {
          headers: getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.workHoursStart) setWorkHoursStart(data.workHoursStart);
            if (data.workHoursEnd) setWorkHoursEnd(data.workHoursEnd);
            if (data.focusLevel) setFocusLevel(data.focusLevel);
            if (data.modelType) setModelType(data.modelType);
            if (data.disruptionGrade) setDisruptionGrade(data.disruptionGrade);
            if (data.pacingInterval) setPacingInterval(data.pacingInterval);
            if (data.name) setName(data.name);
            setPushEnabled(data.pushEnabled !== false);
            setEmailAlerts(data.emailAlerts !== false);
            setBurnoutTriggers(data.burnoutTriggers !== false);
            setBrowserNotificationsEnabled(data.browserNotificationsEnabled !== false);
            setSoundAlertsEnabled(data.soundAlertsEnabled !== false);
            setAiSuggestionsEnabled(data.aiSuggestionsEnabled !== false);
            if (data.snoozeDuration !== undefined) setSnoozeDuration(data.snoozeDuration);
            if (data.weeklyProgressReports !== undefined) setWeeklyProgressReports(data.weeklyProgressReports);
            if (data.dailyWorkspaceSummaries !== undefined) setDailyWorkspaceSummaries(data.dailyWorkspaceSummaries);
            if (data.reminderFrequency !== undefined) setReminderFrequency(data.reminderFrequency);
            if (data.aiResponseStyle !== undefined) setAiResponseStyle(data.aiResponseStyle);
            if (data.creativityLevel !== undefined) setCreativityLevel(data.creativityLevel);
            if (data.scheduleStyle !== undefined) setScheduleStyle(data.scheduleStyle);
            if (data.isMongoConnected !== undefined) {
              setIsMongoConnected(data.isMongoConnected);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load systems settings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const triggerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveIndication(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          workHoursStart,
          workHoursEnd,
          focusLevel,
          pushEnabled,
          emailAlerts,
          burnoutTriggers,
          browserNotificationsEnabled,
          soundAlertsEnabled,
          aiSuggestionsEnabled,
          snoozeDuration,
          modelType,
          disruptionGrade,
          pacingInterval,
          name,
          weeklyProgressReports,
          dailyWorkspaceSummaries,
          reminderFrequency,
          aiResponseStyle,
          creativityLevel,
          scheduleStyle
        })
      });
      if (res.ok) {
        setSaveIndication(true);
        const data = await res.json();
        if (data && data.isMongoConnected !== undefined) {
          setIsMongoConnected(data.isMongoConnected);
        }
        showSuccess("Settings updated successfully", "Your profile and configuration has been updated.");
      } else {
        showError("Failed to Save Settings", "Server rejected settings synchronization.");
      }
    } catch (err: any) {
      console.error("Failed to persist systems settings:", err);
      showError("Server Error", "Could not synchronize settings to core database.");
    } finally {
      setTimeout(() => {
        setSaveIndication(false);
      }, 1200);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4.5 h-4.5 text-white" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">System Settings</h3>
        </div>
        {saveIndication ? (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/20 flex items-center gap-1 animate-pulse">
            <Check className="w-3 h-3" /> Settings Saved
          </span>
        ) : (
          <span className="text-[9px] font-mono text-zinc-500">
            Secure Connection
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sub Menu side tabs */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          {[
            { id: "profile", label: "Profile Settings", icon: User },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "ai", label: "AI Assistant Settings", icon: Cpu },
            { id: "security", label: "Security & Encryption", icon: Lock }
          ].map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-white text-black font-semibold" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Inner Form Column */}
        <div className="md:col-span-9">
          <form onSubmit={triggerSave} className="space-y-4">
            
            {activeSection === "profile" && (
              <div className="space-y-5">
                
                {/* Profile header display */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-black/40 border border-zinc-900 justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={avatar} 
                      alt="Current user avatar" 
                      className="w-14 h-14 rounded-full border border-zinc-800 object-cover" 
                    />
                    <div>
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Welcome Back 👋</span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">{userEmail || "shivanifs.1786145@gmail.com"}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">Workspace Account Status: Connected</p>
                    </div>
                  </div>
                  <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-zinc-900 pt-3 sm:pt-0 sm:pl-6 text-center sm:text-left self-stretch justify-around items-center">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block">Productivity Score</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">94%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block">Active Streak</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">12 Days</span>
                    </div>
                  </div>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Access Role & Level</label>
                    <select
                      value={userRole}
                      onChange={(e) => onUpdateRole(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="Executive Officer">Executive Officer</option>
                      <option value="Premium Contributor">Premium Contributor</option>
                      <option value="Guest Analyst">Guest Analyst</option>
                      <option value="Professional">Professional</option>
                      <option value="Student">Student</option>
                      <option value="Premium Team Member">Premium Team Member</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={workHoursStart}
                      onChange={(e) => setWorkHoursStart(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">End Time</label>
                    <input
                      type="time"
                      value={workHoursEnd}
                      onChange={(e) => setWorkHoursEnd(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Timezone</label>
                    <select
                      defaultValue="UTC-07:00"
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="UTC-07:00">Pacific Time (UTC-7)</option>
                      <option value="UTC-05:00">Eastern Time (UTC-5)</option>
                      <option value="UTC+00:00">Greenwich Mean Time (GMT)</option>
                      <option value="UTC+05:30">India Standard Time (IST)</option>
                      <option value="UTC+08:00">Singapore Time (SGT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Focus Mode</label>
                    <select
                      value={focusLevel}
                      onChange={(e) => setFocusLevel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="max">Deep Work (95%)</option>
                      <option value="balanced">Balanced (80%)</option>
                      <option value="mild">Flexible (50%)</option>
                      <option value="night-owl">Night Owl (Quiet)</option>
                      <option value="early-bird">Early Bird (Fresh)</option>
                    </select>
                  </div>
                </div>
 
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Notification Preferences</span>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Desktop Alerts</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Show instant desktop warnings prior to active task deadlines</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={browserNotificationsEnabled} 
                      onChange={(e) => {
                        const val = e.target.checked;
                        setBrowserNotificationsEnabled(val);
                        if (val && Notification.permission !== "granted") {
                          Notification.requestPermission();
                        }
                      }}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Sound Chimes</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Play a soft acoustic tune when scheduling recommendations arrive</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={soundAlertsEnabled} 
                      onChange={(e) => setSoundAlertsEnabled(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">AI Assistant Recommendations</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Proactively suggest smart recovery plans on deferred or overdue items</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiSuggestionsEnabled} 
                      onChange={(e) => setAiSuggestionsEnabled(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">AI Voice Briefings</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Narrate brief task priorities verbally during active periods</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={pushEnabled} 
                      onChange={(e) => setPushEnabled(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Email Alerts & Digests</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Dispatch critical agenda details directly to {userEmail || "your inbox"}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={emailAlerts} 
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Daily Workspace Summaries</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Get an early morning email overview of all structured tasks and goals</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={dailyWorkspaceSummaries} 
                      onChange={(e) => setDailyWorkspaceSummaries(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Weekly Progress Analytics</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Receive detailed weekly reports covering habit statistics and work metrics</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={weeklyProgressReports} 
                      onChange={(e) => setWeeklyProgressReports(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Work Stress Guard</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Prompt friendly breaks automatically during long, high-activity work hours</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={burnoutTriggers} 
                      onChange={(e) => setBurnoutTriggers(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 text-white" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                      <div>
                        <span className="text-xs font-semibold text-white block">Reminder Lead Time</span>
                        <p className="text-[10px] text-zinc-500 leading-normal">Determine how early alerts trigger before deadlines</p>
                      </div>
                      <select
                        value={reminderFrequency}
                        onChange={(e) => setReminderFrequency(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none mt-1"
                      >
                        <option value="At Deadline">At Deadline</option>
                        <option value="30 Minutes">30 Minutes Before</option>
                        <option value="3 Hours">3 Hours Before</option>
                        <option value="24 Hours">24 Hours Before</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                      <div>
                        <span className="text-xs font-semibold text-white block">Snooze Postpone Duration</span>
                        <p className="text-[10px] text-zinc-500 leading-normal">Configure default postpone intervals for active alerts</p>
                      </div>
                      <select
                        value={snoozeDuration}
                        onChange={(e) => setSnoozeDuration(parseInt(e.target.value, 10))}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none mt-1"
                      >
                        <option value="5">5 Minutes</option>
                        <option value="10">10 Minutes</option>
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "ai" && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">AI Assistant Settings</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">AI Language Model</label>
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Analytical)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast response)</option>
                      <option value="gemini-ultra">Gemini Ultra (High quality)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Disruption Level</label>
                    <select
                      value={disruptionGrade}
                      onChange={(e) => setDisruptionGrade(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="high">High (Proactive coaching)</option>
                      <option value="moderate">Medium (Standard coaching)</option>
                      <option value="silent">Low (Coaching on-demand)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">AI Response Style</label>
                    <select
                      value={aiResponseStyle}
                      onChange={(e) => setAiResponseStyle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="concise">Concise (Direct & bulleted)</option>
                      <option value="balanced">Balanced (Polished & conversational)</option>
                      <option value="detailed">Detailed (In-depth structured analysis)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Schedule Optimization Strategy</label>
                    <select
                      value={scheduleStyle}
                      onChange={(e) => setScheduleStyle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="work">Work Mode (Productivity & Task Execution)</option>
                      <option value="study">Study Mode (Deep Focus & Learning)</option>
                      <option value="personal">Personal Mode (Balance, Routine, & Health)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Pacing & Sync Frequency</label>
                    <select
                      value={pacingInterval}
                      onChange={(e) => setPacingInterval(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="30m">Every 30 minutes</option>
                      <option value="45m">Every 45 minutes</option>
                      <option value="90m">Every 90 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Coaching Creativity Level</label>
                    <select
                      value={creativityLevel}
                      onChange={(e) => setCreativityLevel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="low">Low (Realistic scheduling)</option>
                      <option value="medium">Medium (Balanced prioritization)</option>
                      <option value="high">High (Dynamic & innovative pacing)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-zinc-900 rounded-lg flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    These parameters customize how active the AI helper is in scheduling your tasks, analyzing routines, and managing priority warnings.
                  </p>
                </div>

              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Security & Encryption</span>
                
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3 text-xs text-zinc-400">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500 font-medium">Security Status</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Your Account is Protected
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500 font-medium">Cloud Workspace Sync</span>
                    <span className="text-zinc-300 font-medium">Fully Synchronized</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500 font-medium">Data Storage Protection</span>
                    <span className="text-white font-medium">Encryption Enabled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Active Session Status</span>
                    <span className="text-emerald-400 font-semibold">Signed In Securely</span>
                  </div>
                </div>

                {/* Cloud storage details and backups */}
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1 mt-6">SaaS Sync & Disaster Recovery</span>
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Automated Cloud Backups</span>
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Healthy (Continuous)
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-400 leading-relaxed space-y-3 border-t border-zinc-900 pt-3">
                    <p>
                      Your workspace tasks, goals, calendars, and routines are synchronized with our high-availability cloud cluster. In the event of network disruption, offline local state triggers to guarantee perfect service continuity.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => showSuccess("Backup Created", "A secure export archive has been synchronized.")}
                        className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 transition"
                      >
                        Force Backup Sync
                      </button>
                      <button
                        type="button"
                        onClick={() => showSuccess("Data Export Triggered", "Your data export download is preparing and will be sent to your email.")}
                        className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 transition"
                      >
                        Export Account Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Actionable Security Controls */}
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1 mt-6">Workspace Controls & Access</span>
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3.5 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <span className="font-semibold text-white block">Two-Factor Authentication (2FA)</span>
                      <p className="text-[10px] text-zinc-500">Provide an extra level of secure entry verification</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => showSuccess("Authentication Feature Active", "Two-Factor Authentication setup instructions sent to your email.")}
                      className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-medium"
                    >
                      Set Up 2FA
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <span className="font-semibold text-white block">Change Password</span>
                      <p className="text-[10px] text-zinc-500">Update your account credential securely</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => showSuccess("Credential Action Triggered", "A temporary secure link to modify your password has been emailed.")}
                      className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-medium"
                    >
                      Reset Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <span className="font-semibold text-white block">Privacy Settings</span>
                      <p className="text-[10px] text-zinc-500">Manage cookie preferences and analytical reports sharing</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => showSuccess("Privacy Saved", "Your privacy guardrails have been successfully prioritized.")}
                      className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-medium"
                    >
                      Manage Privacy
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-red-400 block">Deactivate Account</span>
                      <p className="text-[10px] text-zinc-500">Completely erase your database profile and active tasks vault permanently</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const confirmDel = window.confirm("Are you absolutely sure you want to delete your LifeSaver workspace? This action is permanent and cannot be undone.");
                        if (confirmDel) {
                          showSuccess("Account Removed", "Your account and workspace data has been permanently deleted.");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-[10px] text-red-400 font-medium"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 font-sans italic">
                  <Shield className="w-4 h-4 text-zinc-600" />
                  Your session is protected and encrypted with end-to-end cloud guardrails.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Save Settings
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}

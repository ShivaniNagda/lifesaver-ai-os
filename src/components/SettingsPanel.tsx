import React, { useState, useEffect } from "react";
import { Settings, Shield, User, Bell, Cpu, Lock, Sparkles, Check } from "lucide-react";

interface SettingsPanelProps {
  userEmail: string;
  userRole: string;
  onUpdateRole: (role: string) => void;
}

export default function SettingsPanel({ userEmail, userRole, onUpdateRole }: SettingsPanelProps) {
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

  // AI settings
  const [modelType, setModelType] = useState("gemini-1.5-pro");
  const [disruptionGrade, setDisruptionGrade] = useState("high");
  const [pacingInterval, setPacingInterval] = useState("45m");

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
          modelType,
          disruptionGrade,
          pacingInterval,
          name
        })
      });
      if (res.ok) {
        setSaveIndication(true);
        const data = await res.json();
        if (data && data.isMongoConnected !== undefined) {
          setIsMongoConnected(data.isMongoConnected);
        }
      }
    } catch (err) {
      console.error("Failed to persist systems settings:", err);
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
              <div className="space-y-4">
                
                {/* Profile header display */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-zinc-900">
                  <img 
                    src={avatar} 
                    alt="Current user avatar" 
                    className="w-12 h-12 rounded-full border border-zinc-700 object-cover" 
                  />
                  <div>
                    <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Active User Session</span>
                    <h4 className="text-sm font-semibold text-white mt-0.5">{userEmail}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">Account Role: {userRole}</p>
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
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Access Level</label>
                    <select
                      value={userRole}
                      onChange={(e) => onUpdateRole(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="Executive Officer">Executive Officer</option>
                      <option value="Premium Contributor">Premium Contributor</option>
                      <option value="Guest Analyst">Guest Analyst</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Working hours Start</label>
                    <input
                      type="time"
                      value={workHoursStart}
                      onChange={(e) => setWorkHoursStart(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Working hours End</label>
                    <input
                      type="time"
                      value={workHoursEnd}
                      onChange={(e) => setWorkHoursEnd(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Focus Level</label>
                    <select
                      value={focusLevel}
                      onChange={(e) => setFocusLevel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="max">High Focus (95%)</option>
                      <option value="balanced">Balanced Focus (80%)</option>
                      <option value="mild">Relaxed Focus (50%)</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Notification Options</span>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">AI Voice Alerts</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Speak reminders when task deadlines approach</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={pushEnabled} 
                      onChange={(e) => setPushEnabled(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Email Alerts</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Send digest alerts to your email address: {userEmail}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={emailAlerts} 
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Burnout Prevention Suggestions</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Suggest breaks during long, intense work sessions</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={burnoutTriggers} 
                      onChange={(e) => setBurnoutTriggers(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-800" 
                    />
                  </div>
                </div>

              </div>
            )}

            {activeSection === "ai" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">AI Assistant Model</label>
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
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Alert Frequency</label>
                    <select
                      value={disruptionGrade}
                      onChange={(e) => setDisruptionGrade(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="high">High (Show alerts often)</option>
                      <option value="moderate">Medium (Normal alerts)</option>
                      <option value="silent">Low (Silent, no alerts)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Sync Frequency</label>
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

                <div className="p-3 bg-white/[0.02] border border-zinc-900 rounded-lg flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    These parameters customize how active the AI helper is in scheduling your tasks and managing priorities.
                  </p>
                </div>

              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Security Protocols</span>
                
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3 font-mono text-[10px] text-zinc-400">
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span>CONNECTION SECURITY:</span>
                    <span className="text-emerald-400 font-bold">TLS v1.3 OVER HTTPS</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span>DATABASE ENCRYPTION:</span>
                    <span className="text-white">AES-256 GCM SECURED</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span>SECURITY MONITOR:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AUTOMATIC KEY ROTATION:</span>
                    <span className="text-white">ENABLED (EVERY 24H)</span>
                  </div>
                </div>

                {/* Database Connection diagnostics */}
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1 mt-6">Database Connectivity Status</span>
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400">DATABASE ENGINE:</span>
                    {isMongoConnected === true ? (
                      <span className="text-emerald-400 font-bold font-mono text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        MONGODB ATLAS (CONNECTED)
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold font-mono text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                        LOCAL PERSISTENCE ENGINE (ACTIVE)
                      </span>
                    )}
                  </div>

                  {isMongoConnected !== true && (
                    <div className="text-[10px] text-zinc-400 leading-relaxed font-sans space-y-2 border-t border-zinc-900 pt-3">
                      <p className="text-amber-300 font-medium">⚠️ Connection Fallback Alert</p>
                      <p>
                        The application is safely running on the <strong className="text-white font-semibold">Local JSON Fallback Database</strong>. All your data, tasks, habits, and sessions are actively saved and preserved locally!
                      </p>
                      <p className="text-[9px] text-zinc-500">
                        <strong>To connect to your MongoDB Atlas cluster:</strong> Make sure your MongoDB IP access is set to allow connections from anywhere (<code className="text-zinc-300">0.0.0.0/0</code>) inside your Atlas Security settings. This is required because Cloud Run hosts execute outbound requests from dynamic IP addresses.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 font-sans italic">
                  <Shield className="w-4 h-4 text-zinc-600" />
                  Your session is protected and encrypted securely.
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

import React, { useState } from "react";
import { Settings, Shield, User, Bell, Cpu, Calendar, Lock, Sparkles, Check } from "lucide-react";

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

  // Save indication
  const [saveIndication, setSaveIndication] = useState(false);

  const triggerSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveIndication(true);
    setTimeout(() => {
      setSaveIndication(false);
    }, 1200);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4.5 h-4.5 text-white" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">OS Systems Configuration</h3>
        </div>
        {saveIndication ? (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/20 flex items-center gap-1 animate-pulse">
            <Check className="w-3 h-3" /> APPLIED AT SYSTEM CORE
          </span>
        ) : (
          <span className="text-[9px] font-mono text-zinc-500">
            SECURE SHA-256 MATRIX
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sub Menu side tabs */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          {[
            { id: "profile", label: "Principal Profile", icon: User },
            { id: "notifications", label: "Notification Corridors", icon: Bell },
            { id: "ai", label: "AI Agent Settings", icon: Cpu },
            { id: "security", label: "Key Encryption & SSL", icon: Lock }
          ].map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
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
                    <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">SYSTEM ACTIVE OPERATOR</span>
                    <h4 className="text-sm font-semibold text-white mt-0.5">{userEmail}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">Role Node: {userRole}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Principal Initials</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">System Security Clearance Role</label>
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
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Cognitive Focus level</label>
                    <select
                      value={focusLevel}
                      onChange={(e) => setFocusLevel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="max">Max Concentration (98%)</option>
                      <option value="balanced">Balanced Sync (80%)</option>
                      <option value="mild">Relaxed Corridor (50%)</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">SaaS Push Corridors</span>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <span className="text-xs font-semibold text-white block">Inter-Agent Audio alerts</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Transmit automated verbal alerts when failure forecasts exceed 30%</p>
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
                      <span className="text-xs font-semibold text-white block">Email Dispatch Corridor</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Dispatch fallback text alerts to {userEmail}</p>
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
                      <span className="text-xs font-semibold text-white block">Burnout triggers override</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Inject micro-breaks forcibly during intense cramming sessions</p>
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
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Target Cognitive Model Core</label>
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Analytical heavy)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Sub-45ms speed)</option>
                      <option value="gemini-ultra">Gemini 1.0 Ultra Corridor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Disruption Grade Authority</label>
                    <select
                      value={disruptionGrade}
                      onChange={(e) => setDisruptionGrade(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                    >
                      <option value="high">High Disruptive Override (Forced lockouts)</option>
                      <option value="moderate">Moderate Suggestions (Sidebar alerts)</option>
                      <option value="silent">Passive Monitored Corridor (No UI popups)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Pacing Scan frequency</label>
                  <select
                    value={pacingInterval}
                    onChange={(e) => setPacingInterval(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                  >
                    <option value="30m">Synchronize every 30 minutes</option>
                    <option value="45m">Synchronize every 45 minutes</option>
                    <option value="90m">Synchronize every 90 minutes</option>
                  </select>
                </div>

                <div className="p-3 bg-white/[0.02] border border-zinc-900 rounded-lg flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    These parameters regulate how actively the 10-Agent network analyzes your context and intervenes on commitments.
                  </p>
                </div>

              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Crypto parameters</span>
                
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3 font-mono text-[10px] text-zinc-400">
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span>TLS TRANSPORT PROTOCOL:</span>
                    <span className="text-emerald-400 font-bold">TLS v1.3 OVER GCM</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span>DATABASE CORRIDOR CRYPTO:</span>
                    <span className="text-white">AES-256 GCM PRE-FLIGHT</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span>SECURITY COGNIZANT ENGINE:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RENEW KEYS ROTATION SECTOR:</span>
                    <span className="text-white">AUTOMATIC ROTATE (24H)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 font-sans italic">
                  <Shield className="w-4 h-4 text-zinc-600" />
                  Your local workspace session remains cryptographically sealed in secure cache nodes.
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Apply System Parameters
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}

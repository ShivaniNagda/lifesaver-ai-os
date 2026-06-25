import React, { useState, useEffect } from "react";
import { 
  Sparkles, Shield, AlertTriangle, CheckCircle, Brain, Terminal, 
  Calendar, Clock, User, Settings, ArrowRight, Play, ExternalLink, 
  Send, HelpCircle, Activity, ChevronRight, Zap, Target, BookOpen, 
  Hourglass, MessageSquare, Briefcase, Plus, Trash2, Mail
} from "lucide-react";
import AICoreCanvas from "./components/AICoreCanvas";
import AgentLogsTerminal from "./components/AgentLogsTerminal";
import { 
  Task, TimelineNode, AgentLog, FutureSelfDialog, AgentOSResponse, 
  NegotiationResult, PreparationPlan, TwinChatResponse, ChatMessage 
} from "./types";

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Chemistry Midterm Exam Preparation", dueDate: "2026-06-28", urgency: "critical", status: "pending" },
  { id: "2", title: "Monthly Server Hosting & Utility Payments", dueDate: "2026-06-27", urgency: "high", status: "pending" },
  { id: "3", title: "Submit Pitch Deck to Seed Investors", dueDate: "2026-06-30", urgency: "high", status: "pending" },
  { id: "4", title: "Draft SaaS API Documentation", dueDate: "2026-07-02", urgency: "medium", status: "pending" }
];

export default function App() {
  // Navigation & View control
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [activeTab, setActiveTab] = useState<"overview" | "twin" | "rescue" | "negotiate" | "prep">("overview");

  // Core App State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskUrgency, setNewTaskUrgency] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-06-29");
  
  // Custom context for AI input
  const [userContext, setUserContext] = useState(
    "Working late hours on my Startup pitch deck. Also have a crucial Chemistry exam coming up soon and hosting server bills to pay."
  );

  // AI Response States
  const [isProcessing, setIsProcessing] = useState(false);
  const [osResponse, setOsResponse] = useState<AgentOSResponse | null>(null);

  // Twin Chat State
  const [twinInput, setTwinInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I am your Productivity Twin. I represent your highest-potential future self who successfully conquered these deadlines, avoided burnout, and executed flawlessly. Tell me: what's currently blocking your flow?",
      microAction: "Open your planner and declare your #1 focus block."
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

  // Trigger main OS cognitive alignment engine
  const runLifeOSEngine = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/agent/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    } catch (err) {
      console.error("Network error running OS engine:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger initial process automatically on dashboard load
  useEffect(() => {
    if (view === "dashboard" && !osResponse) {
      runLifeOSEngine();
    }
  }, [view]);

  // Handle adding new custom task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const added: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: newTaskDueDate,
      urgency: newTaskUrgency,
      status: "pending"
    };
    setTasks(prev => [added, ...prev]);
    setNewTaskTitle("");
  };

  // Toggle task status
  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t));
  };

  // Remove task
  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
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
      const res = await fetch("/api/agent/twin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    } catch (err) {
      console.error("Twin chat failed:", err);
    } finally {
      setIsTwinChatting(false);
    }
  };

  // Handle Extension Negotiation Plan
  const handleNegotiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNegoLoading(true);
    try {
      const res = await fetch("/api/agent/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    } catch (err) {
      console.error("Negotiation engine failed:", err);
    } finally {
      setIsNegoLoading(false);
    }
  };

  // Handle Exam/Interview Prep Generator
  const handleGeneratePrep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPrepLoading(true);
    try {
      const res = await fetch("/api/agent/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examOrInterviewTitle: prepEvent,
          timeRemaining: prepTimeLeft,
          topicsToCover: prepTopics
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPrepPlan(data);
      }
    } catch (err) {
      console.error("Prep generator failed:", err);
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

  // Render Landing Page
  if (view === "landing") {
    return (
      <div className="relative min-h-screen bg-[#050505] text-zinc-100 overflow-hidden select-none">
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
              LifeSaver <span className="font-mono text-zinc-500 text-xs tracking-widest uppercase ml-1.5 border border-zinc-800 px-1.5 py-0.5 rounded">AI OS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">OS Architecture</a>
            <a href="#agents" className="hover:text-white transition-colors">Specialized Agents</a>
            <a href="#preview" className="hover:text-white transition-colors">SaaS Dashboard</a>
            <a href="#mission" className="hover:text-white transition-colors">Mission Core</a>
          </div>

          <button 
            onClick={() => setView("dashboard")} 
            className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-sm font-medium transition-all"
          >
            Launch OS
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
                AUTONOMOUS SYSTEM ONLINE
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] max-w-2xl">
                Never Miss <br/>What <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">Matters</span>
              </h1>

              <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-lg">
                The world's first autonomous AI productivity operating system. While typical tools request updates, LifeSaver thinks, plans, adapts, and executes to rescue your commitments before failure occurs.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-4">
                <button 
                  onClick={() => setView("dashboard")}
                  className="px-8 py-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] shadow-xl hover:shadow-white/5 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Boot LifeSaver OS Free
                </button>
                <a 
                  href="#features" 
                  className="px-6 py-4 bg-zinc-900/60 border border-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-900 flex items-center justify-center gap-2"
                >
                  Explore Neural Agents
                </a>
              </div>

              {/* Dynamic status widgets */}
              <div className="grid grid-cols-3 gap-6 w-full pt-8 border-t border-zinc-900/80">
                <div>
                  <div className="text-2xl font-mono font-semibold text-white">99.4%</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Deadline Rescue Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-semibold text-white">10</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Active Neural Agents</div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-semibold text-white">&lt; 42ms</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Context Sync Delay</div>
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
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Autonomous Sync Engine</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Analyzing active timeline. LifeSaver continuously coordinates constraints across a 10-Agent network to prevent cognitive blockades.
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
              <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Multi-Agent Cognitive Framework</span>
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-white">
                Coordinated Autonomy. Zero Interruption.
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                LifeSaver deploys a collaborative squad of ten highly specialized autonomous agents working concurrently. Instead of pestering you with reminders, they negotiate, restructure, and prepare you for actual performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Priority Agent", icon: Shield, desc: "Evaluates systemic urgency matrices dynamically. Instantly recognizes bill payments and high-yield milestones vs static noise." },
                { title: "Planning Agent", icon: Brain, desc: "Slices highly complex, multi-week deliverables into bite-sized deep focus nodes complete with dynamic context parameters." },
                { title: "Risk Prediction & Recovery", icon: AlertTriangle, desc: "Analyzes early friction signatures to forecast failure probabilities. Rebuilds calendar timelines automatically when clashes are found." },
                { title: "Focus & Habit Agents", icon: Hourglass, desc: "Locks down distraction environments, curates targeted mental micro-drills, and anchors core disciplines into existing workflows." },
                { title: "Productivity Twin Simulator", icon: MessageSquare, desc: "Generates real-time conversational alignment with your ideal, high-performance future self to instill intrinsic motivation." },
                { title: "Burnout Predictor", icon: Zap, desc: "Tracks workload density and psychological reserves continuously to inject mandatory recovery buffers before exhaustion sets in." }
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
        <footer className="relative z-10 border-t border-zinc-900 bg-black py-12 text-center text-xs text-zinc-600">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="font-display font-medium tracking-wide text-zinc-400">LifeSaver AI OS</span>
            </div>
            <p>© 2026 LifeSaver OS Inc. Empowered by Google Gemini & Firebase. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-zinc-400 cursor-pointer">Security Protocol</span>
              <span className="hover:text-zinc-400 cursor-pointer">SLA Core</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Render Premium Platform / Interactive Dashboard View
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col relative select-none">
      {/* Static grid backdrop */}
      <div className="absolute inset-0 moving-grid pointer-events-none opacity-10" />

      {/* Luxury OS Top Bar */}
      <header className="relative z-20 border-b border-zinc-900 bg-[#050505]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-white flex items-center justify-center font-mono font-bold text-black text-xs tracking-tighter">
            L⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-white tracking-wide">LifeSaver AI OS</span>
              <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 px-1.5 py-0.2 rounded uppercase tracking-widest">
                System Active
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tight mt-0.5">user: {navigator.userAgent.includes("Chrome") ? "shivanifs.1786145@gmail.com" : "admin_session"}</p>
          </div>
        </div>

        {/* Quick OS Stats */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
            <span className="text-zinc-400">ALIGNED COGNITION SPEED:</span>
            <span className="text-white font-medium">99.2%</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-zinc-400">RESCUE DRILLS ARMED:</span>
            <span className="text-white font-medium">TRUE</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView("landing")} 
            className="text-xs text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800 bg-zinc-950 px-3 py-1.5 rounded-lg transition-colors"
          >
            Terminal Shutdown
          </button>
          <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400">
            <User className="w-4 h-4 text-white" />
          </div>
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
                <h2 className="text-xs font-mono tracking-wider uppercase text-zinc-300">Cognitive Context Window</h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">DYNAMIC SYNC</span>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              Describe your current life situation, stress triggers, exams, or active tasks. The 10 specialized AI Agents digest this input to formulate an automated execution schedule.
            </p>

            <div className="space-y-3">
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="E.g., I have an upcoming chemistry exam, startup pitch deck review due this Friday, and server bills to settle."
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
                    Re-aligning Neural Agents...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-black" />
                    Synchronize Life OS Engine
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
                  <h2 className="text-xs font-mono tracking-wider uppercase text-zinc-300">Commitments &amp; Deadlines</h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">TOTAL: {tasks.length}</span>
              </div>

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
                  <div className="text-center py-6 text-xs text-zinc-600">No active commitments registered in local thread.</div>
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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LOCAL PERSISTENCE RUNNING
              </span>
              <span>100% OFFLINE REPLICA</span>
            </div>
          </div>

        </div>

        {/* MIDDLE & RIGHT COMBINED WORKSPACE (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* High-End Sub-Navigation for Advanced OS Modes */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-900 max-w-full overflow-x-auto">
            {[
              { id: "overview", label: "Executive Workspace", icon: Activity },
              { id: "rescue", label: "Deadline Rescue Mode", icon: Zap },
              { id: "twin", label: "Productivity Twin Simulator", icon: MessageSquare },
              { id: "negotiate", label: "AI Extension Negotiator", icon: Mail },
              { id: "prep", label: "Exam & Interview Prep", icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected 
                      ? "bg-white text-black" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT 1: Executive Workspace (Primary UI Overview with AI prediction widgets) */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Strategic Analytics Summary Dashboard Grid */}
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
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Based on dynamic schedule density</p>
                  </div>
                  {/* Subtle progress bar */}
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-1000" 
                      style={{ width: `${osResponse ? osResponse.successProbability : 84}%` }} 
                    />
                  </div>
                </div>

                {/* Score Widget 2: Burnout Predictor Risk */}
                <div className="glass-panel p-5 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Burnout Predictor</span>
                    <Zap className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="my-3">
                    <span className="text-4xl font-display font-semibold text-white">
                      {osResponse ? `${osResponse.burnoutRisk}%` : "18%"}
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Mental stamina &amp; sleep projection</p>
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
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Risk Forecasting Engine</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="my-2">
                    <span className="text-xs font-mono font-medium text-amber-400 block tracking-tight">ALERT: FAILURE PROBABILITY DETECTED</span>
                    <p className="text-xs text-zinc-300 leading-snug mt-1 font-sans line-clamp-2">
                      {osResponse ? osResponse.failurePrediction : "No extreme threats. Maintain chemistry mid-term study velocity."}
                    </p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">REMEDY SYSTEM: ACTIVE</div>
                </div>

              </div>

              {/* AI Chief of Staff Strategy Advice Block */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Chief of Staff Strategic Advice</h4>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed mt-1">
                    {osResponse ? osResponse.aiCoachAdvice : "Awaiting initial context sync. Click 'Synchronize Life OS Engine' to engage the autonomous agents and receive elite productivity strategies."}
                  </p>
                </div>
              </div>

              {/* Dynamic Automated Timeline Nodes */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Autonomous Restructured Daily Timeline</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">GENERATED BY PLANNING AGENT</span>
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
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Focus Agent allocates 45 minutes on electrochemistry equations with distractions restricted.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 bg-red-400 ring-4 ring-red-500/20" />
                        <span className="text-[10px] font-mono text-zinc-500 mr-2 uppercase tracking-wide">[02:30 PM]</span>
                        <span className="text-xs font-medium text-white">Critical Bill &amp; Infrastructure Payment Block</span>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Urgent priority task. Priority Agent bypasses notification silencers to settle hosting billing.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 bg-zinc-700" />
                        <span className="text-[10px] font-mono text-zinc-500 mr-2 uppercase tracking-wide">[04:30 PM]</span>
                        <span className="text-xs font-medium text-white">Mandatory Mental Recharging Reserve</span>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Burnout Predictor predicts psychological capacity strain. Allocate 15 minutes of device-free physical rest.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Coordinated Live Agent Terminal Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Collaborative Agent Communications</span>
                  <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● LIVE INTER-AGENT AUDIOSTREAM</span>
                </div>
                <AgentLogsTerminal logs={osResponse?.agentLogs} isProcessing={isProcessing} />
              </div>

            </div>
          )}

          {/* TAB CONTENT 2: Deadline Rescue Mode (Dramatic Rescue HUD with Emergency Tactics) */}
          {activeTab === "rescue" && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-2xl border border-red-900/40 bg-gradient-to-br from-red-950/20 via-[#050505] to-zinc-950/80 glow-rescue relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-semibold">Emergency Action System</span>
                </div>

                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Deadline Rescue Mode Active</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl mt-1.5">
                  The agents have detected extremely critical timelines (Chemistry exam and utility bill settlements are clashing). Focus silencers have been initiated. Dynamic extension negotiation draft is prepared.
                </p>

                {/* Tactical checklists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-red-950/10 border border-red-900/30">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 block mb-2">Actionable Defense Plan</span>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-mono shrink-0">1.</span>
                        <span>Mute Slack, Discord, and messaging apps instantly to secure a 90-minute focus window.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-mono shrink-0">2.</span>
                        <span>Settle Cloud hosting invoice before platform freezes database nodes (Negotiation assistant ready).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-mono shrink-0">3.</span>
                        <span>Deploy high-yield active recall mock questions for Chemistry prep.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">System Intercept Parameters</span>
                    <div className="space-y-3 font-mono text-[11px] text-zinc-400">
                      <div className="flex justify-between">
                        <span>DISTRACTION REJECTION:</span>
                        <span className="text-red-400 font-bold">98% ENFORCED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AUTONOMOUS AUTOPILOT:</span>
                        <span className="text-emerald-400 font-bold">ARMED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SUCCESS RATE PROJECTION:</span>
                        <span className="text-white font-bold">88.5% MINIMUM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Self Alternate Timelines (Simulator) */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
                  <Hourglass className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Future Self Simulator</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timeline A: Path of Alignment */}
                  <div className="space-y-2 p-4 rounded-xl bg-zinc-900/20 border border-zinc-900/60">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase tracking-wider">Path of Alignment (+7 Days)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">
                      {osResponse ? osResponse.futureSelfDialog.positiveScenario : "You completed your chemistry prep with full clarity, secured investor pitch interest, and cleared all SaaS hosting overhead. Mental stress index dropped by 72%."}
                    </p>
                  </div>

                  {/* Timeline B: Path of Friction */}
                  <div className="space-y-2 p-4 rounded-xl bg-zinc-900/20 border border-zinc-900/60">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      <span className="text-xs font-mono uppercase tracking-wider">Path of Friction (+7 Days)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">
                      {osResponse ? osResponse.futureSelfDialog.negativeScenario : "Skipped study block and forgot utility invoices. Server database experienced suspension. Midterm exam marks suffered from cognitive cramming. Cognitive fatigue maxed out."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 3: Productivity Twin Simulator (Interactive Real AI Twin Chat) */}
          {activeTab === "twin" && (
            <div className="glass-panel p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between min-h-[460px]">
              
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4.5 h-4.5 text-white" />
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Productivity Twin Console</h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">TIMELINE: OPTIMAL FUTURE ALIGNMENT (+1 WEEK)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Cognitive Mirror</span>
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
                        {msg.role === "user" ? "U" : "T"}
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
                              <span className="text-[9px] font-mono text-emerald-400 block uppercase tracking-wider">Immediate 5-Min Action</span>
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
                      Twin is calculating timeline vectors inside Gemini...
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
                  placeholder="Ask your future self: 'How did you handle the Chemistry study stress?'"
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
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Negotiator parameters</h3>
                </div>

                <form onSubmit={handleNegotiate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Commitment Title</label>
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
                    {isNegoLoading ? "Formulating correspondence..." : "Compose Extension Draft"}
                  </button>
                </form>
              </div>

              {/* Right Column: Dynamic AI formulated result output */}
              <div className="md:col-span-7 glass-panel p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Response output</span>
                    <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded">
                      Negotiation Agent
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
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wide">Tactical Negotiator Advice</span>
                        <p className="text-xs text-zinc-500 font-sans italic mt-1 leading-relaxed">
                          {negoResult.tacticalTip}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-xs text-zinc-600">
                      Configure parameters and click "Compose" to request negotiation backing from the Recovery Agent.
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
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Exam/Interview metrics</h3>
                </div>

                <form onSubmit={handleGeneratePrep} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Impending High-Stakes Event</label>
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
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Restructured cognitive study pipeline</span>
                  <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded">
                    Learning Agent
                  </span>
                </div>

                {prepPlan ? (
                  <div className="space-y-4">
                    
                    {/* Phase schedule */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-mono text-zinc-500 block">OPTIMIZED COGNITIVE PHASES:</span>
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
                      <span className="text-[9px] font-mono text-zinc-500 block mb-1">HIGH-YIELD CORE TOPICS FOR FLASH DRILLS:</span>
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
                      <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wide">Stress &amp; Fatigue Remedy</span>
                      <p className="text-xs text-zinc-500 font-sans italic mt-1 leading-relaxed">
                        {prepPlan.stressRemedy}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-24 text-xs text-zinc-600">
                    Input your target event, timing constraints, and study areas. The Learning &amp; Focus Agents will generate an elite active-recall strategy.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

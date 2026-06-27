import { useEffect, useState, useRef } from "react";
import { AgentLog } from "../types";
import { Terminal, Shield, Sparkles, Activity, CheckCircle, Brain } from "lucide-react";

interface AgentLogsTerminalProps {
  logs?: AgentLog[];
  isProcessing?: boolean;
}

const SIMULATED_IDLE_LOGS: AgentLog[] = [
  { agent: "Priority Agent", message: "Analyzing upcoming tasks and due dates for potential conflicts...", timestamp: "00:01" },
  { agent: "Risk Prediction Agent", message: "Schedule check: Chemistry exam on Friday is being tracked alongside your active task list.", timestamp: "00:03" },
  { agent: "Burnout Prevention Agent", message: "Workload check: High density detected near Thursday. Recommending a rest buffer.", timestamp: "00:04" },
  { agent: "Planning Agent", message: "Structuring study strategy: Dividing chemistry chapters into focused 45-minute blocks.", timestamp: "00:05" },
  { agent: "Recovery Agent", message: "Negotiator prepared: Ready to generate email drafts for extensions if needed.", timestamp: "00:07" },
  { agent: "Focus Agent", message: "Focus assist active: Ready to silences distractions and start timers.", timestamp: "00:08" },
  { agent: "Goal Agent", message: "Checking goals: Exam prep is aligned with academic milestones.", timestamp: "00:10" }
];

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  "Priority Agent": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-900/40", icon: Shield },
  "Planning Agent": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-900/40", icon: Brain },
  "Risk Prediction Agent": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-900/40", icon: Activity },
  "Recovery Agent": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-900/40", icon: CheckCircle },
  "Focus Agent": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-900/40", icon: Terminal },
  "Burnout Prevention Agent": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-900/40", icon: Sparkles },
  "Goal Agent": { bg: "bg-zinc-900/20", text: "text-zinc-300", border: "border-zinc-800", icon: Shield },
  "Habit Agent": { bg: "bg-zinc-900/20", text: "text-zinc-300", border: "border-zinc-800", icon: Activity },
  "Reflection Agent": { bg: "bg-zinc-900/20", text: "text-zinc-300", border: "border-zinc-800", icon: Brain },
  "Learning Agent": { bg: "bg-zinc-900/20", text: "text-zinc-300", border: "border-zinc-800", icon: Sparkles }
};

const EMPTY_LOGS: AgentLog[] = [];

export default function AgentLogsTerminal({ logs = EMPTY_LOGS, isProcessing = false }: AgentLogsTerminalProps) {
  const [activeLogs, setActiveLogs] = useState<AgentLog[]>(SIMULATED_IDLE_LOGS);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom on logs update
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeLogs]);

  // Handle live scrolling logs from props or background tick
  useEffect(() => {
    if (isProcessing) {
      setActiveLogs([
        { agent: "Priority Agent", message: "Analyzing context and generating optimized schedules...", timestamp: "NOW" }
      ]);
      return;
    }

    if (logs && logs.length > 0) {
      setActiveLogs(logs);
      return;
    }

    // Set idle logs as starting, then add periodic updates to make terminal feel completely "alive"
    setActiveLogs(SIMULATED_IDLE_LOGS);

    const extraMessages = [
      { agent: "Learning Agent", message: "Study tip: Retaining information is highest during morning study blocks.", timestamp: "00:12" },
      { agent: "Reflection Agent", message: "Weekly summary compiled: Task completion rate is currently at 92%.", timestamp: "00:15" },
      { agent: "Habit Agent", message: "Habit tracked: 'Morning review' checked and updated successfully.", timestamp: "00:18" },
      { agent: "Burnout Prevention Agent", message: "Breathing break suggestion: A 2-minute focus breathing session is recommended.", timestamp: "00:20" }
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < extraMessages.length) {
        setActiveLogs(prev => [...prev, extraMessages[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [logs, isProcessing]);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 font-mono text-xs glow-accent relative overflow-hidden h-72 flex flex-col justify-between">
      {/* Moving scanner line effect */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-white/5 shadow-2xl opacity-50 animate-pulse pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-400 font-medium tracking-tight">AI_LOG_SERVICE_v1.0</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-500 text-[10px]">
          <span>STATUS: ONLINE</span>
          <span>SYNC: ACTIVE</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-zinc-300">
        {activeLogs.map((log, index) => {
          const config = AGENT_COLORS[log.agent] || { bg: "rgba(255, 255, 255, 0.05)", text: "text-zinc-300", border: "border-zinc-800", icon: Terminal };
          const Icon = config.icon;

          return (
            <div key={index} className="flex gap-2.5 items-start leading-relaxed">
              <span className="text-zinc-600 shrink-0 text-[10px] pt-0.5">[{log.timestamp}]</span>
              <div className="flex-1">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${config.border} ${config.bg} ${config.text} text-[10px] font-semibold tracking-wide uppercase mr-2 select-none`}>
                  <Icon className="w-3 h-3 shrink-0" />
                  {log.agent}
                </span>
                <span className="text-zinc-300">{log.message}</span>
              </div>
            </div>
          );
        })}
        {isProcessing && (
          <div className="flex gap-2 items-center text-zinc-400 italic font-sans">
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping mr-2" />
            Analyzing schedules and prioritizing tasks using Google Gemini...
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Info */}
      <div className="border-t border-zinc-900 pt-2 mt-2 flex items-center justify-between text-[10px] text-zinc-500">
        <span>AI ASSISTANT STATE: STANDBY</span>
        <span>LATENCY: NORMAL</span>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, AlertTriangle, Sparkles, RefreshCw, Layers, Check, Clock } from "lucide-react";
import { Task } from "../types";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  category: "work" | "study" | "billing" | "personal";
  description?: string;
}

interface CalendarModuleProps {
  tasks: Task[];
  onAutoScheduleTasks?: (scheduledTimeline: any[]) => void;
}

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    title: "Venture Capital Seed Briefing",
    date: "2026-06-30",
    startTime: "10:00",
    endTime: "11:30",
    category: "work",
    description: "Submit pitch deck and respond to financial margin questions."
  },
  {
    id: "e2",
    title: "Chemistry Midterm Exam Slot",
    date: "2026-06-28",
    startTime: "13:00",
    endTime: "15:00",
    category: "study",
    description: "Proctored online evaluation of all midterm chemistry modules."
  },
  {
    id: "e3",
    title: "Server Deployment & Upgrade",
    date: "2026-06-27",
    startTime: "09:00",
    endTime: "10:30",
    category: "work",
    description: "Rotating cluster instances to new high-performance nodes."
  }
];

// Generates calendar month days
const getMonthDays = () => {
  const dates = [];
  // Hardcoded to current cycle around June 2026
  const startDay = 21; // Sun
  for (let i = 0; i < 14; i++) {
    const dayNum = startDay + i;
    const dateStr = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
    dates.push({ dayNum, dateStr });
  }
  return dates;
};

export default function CalendarModule({ tasks }: CalendarModuleProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState("2026-06-28");
  
  // Create Event Form state
  const [evtTitle, setEvtTitle] = useState("");
  const [evtDate, setEvtDate] = useState("2026-06-28");
  const [evtStart, setEvtStart] = useState("09:00");
  const [evtEnd, setEvtEnd] = useState("10:00");
  const [evtCategory, setEvtCategory] = useState<"work" | "study" | "billing" | "personal">("work");
  const [evtDesc, setEvtDesc] = useState("");

  const [syncStatus, setSyncStatus] = useState("idle");
  const [conflicts, setConflicts] = useState<{ id: string; msg: string; event1: string; event2: string }[]>([]);

  // Initialize and load
  useEffect(() => {
    const saved = localStorage.getItem("lifeos_calendar_events");
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        setEvents(DEFAULT_EVENTS);
      }
    } else {
      setEvents(DEFAULT_EVENTS);
      localStorage.setItem("lifeos_calendar_events", JSON.stringify(DEFAULT_EVENTS));
    }
  }, []);

  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem("lifeos_calendar_events", JSON.stringify(updated));
  };

  // Conflict Detection
  useEffect(() => {
    const foundConflicts: typeof conflicts = [];
    
    // Group events by date
    const dateGroups: { [date: string]: CalendarEvent[] } = {};
    events.forEach(e => {
      if (!dateGroups[e.date]) dateGroups[e.date] = [];
      dateGroups[e.date].push(e);
    });

    Object.keys(dateGroups).forEach(date => {
      const dayEvts = dateGroups[date];
      for (let i = 0; i < dayEvts.length; i++) {
        for (let j = i + 1; j < dayEvts.length; j++) {
          const e1 = dayEvts[i];
          const e2 = dayEvts[j];
          
          // Check overlap
          // Convert times to minutes for simpler checks
          const start1 = timeToMinutes(e1.startTime);
          const end1 = timeToMinutes(e1.endTime);
          const start2 = timeToMinutes(e2.startTime);
          const end2 = timeToMinutes(e2.endTime);

          const hasOverlap = (start1 < end2 && start2 < end1);
          if (hasOverlap) {
            foundConflicts.push({
              id: `${e1.id}-${e2.id}`,
              msg: `Schedule Overlap detected on ${date}: "${e1.title}" and "${e2.title}" conflict.`,
              event1: e1.title,
              event2: e2.title
            });
          }
        }
      }
    });

    setConflicts(foundConflicts);
  }, [events]);

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim()) return;

    const newEvt: CalendarEvent = {
      id: `e-${Date.now()}`,
      title: evtTitle,
      date: evtDate,
      startTime: evtStart,
      endTime: evtEnd,
      category: evtCategory,
      description: evtDesc
    };

    saveEvents([...events, newEvt]);
    setEvtTitle("");
    setEvtDesc("");
  };

  const removeEvent = (id: string) => {
    const next = events.filter(e => e.id !== id);
    saveEvents(next);
  };

  const handleAutoSchedule = () => {
    // Schedule all non-completed tasks into available blocks automatically
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    if (pendingTasks.length === 0) return;

    let targetDate = new Date();
    const newScheduledEvents: CalendarEvent[] = [];

    pendingTasks.forEach((task, idx) => {
      // Create study or focus blocks
      const slotHour = 9 + (idx * 2) % 6; // disperse between 09:00, 11:00, 13:00, 15:00
      const startStr = `${slotHour < 10 ? '0' + slotHour : slotHour}:00`;
      const endStr = `${slotHour + 1 < 10 ? '0' + (slotHour + 1) : slotHour + 1}:30`;
      
      const targetDateStr = targetDate.toISOString().split("T")[0];

      newScheduledEvents.push({
        id: `auto-e-${task.id}-${Date.now()}`,
        title: `Auto Focus Block: ${task.title}`,
        date: task.dueDate || targetDateStr,
        startTime: startStr,
        endTime: endStr,
        category: task.urgency === "critical" || task.urgency === "high" ? "study" : "work",
        description: `Autonomous time allocation created by the Planning Agent to secure ${task.title}.`
      });

      // advance target date every 2 tasks
      if (idx % 2 === 1) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    });

    saveEvents([...events, ...newScheduledEvents]);
    setSyncStatus("autoscheduled");
    setTimeout(() => setSyncStatus("idle"), 2000);
  };

  const syncWithGoogleSim = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
      setTimeout(() => setSyncStatus("idle"), 2500);
    }, 1200);
  };

  const monthDays = getMonthDays();
  const selectedDateEvents = events.filter(e => e.date === selectedDate);

  return (
    <div className="space-y-6">
      
      {/* Conflicts Alert Banner if any exist */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4.5 h-4.5 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Cognitive Conflicts Forecasted</span>
          </div>
          <div className="space-y-1">
            {conflicts.map((c) => (
              <p key={c.id} className="text-xs text-zinc-300 leading-normal pl-6 relative">
                <span className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                {c.msg}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Actions */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-white" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Time Coordinator</h3>
            </div>
            
            <button 
              onClick={syncWithGoogleSim}
              className="text-[10px] font-mono border border-zinc-800 bg-zinc-950 px-2 py-1 rounded hover:border-zinc-700 text-zinc-400 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              {syncStatus === "syncing" ? "Pushing Handshake..." : syncStatus === "synced" ? "Handshake Completed" : "Simulate Cloud Sync"}
            </button>
          </div>

          <form onSubmit={handleAddEvent} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Event/Focus Block Name</label>
              <input
                type="text"
                value={evtTitle}
                onChange={(e) => setEvtTitle(e.target.value)}
                placeholder="E.g., Practice recall cards"
                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Date</label>
                <input
                  type="date"
                  value={evtDate}
                  onChange={(e) => setEvtDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Start</label>
                <input
                  type="time"
                  value={evtStart}
                  onChange={(e) => setEvtStart(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">End</label>
                <input
                  type="time"
                  value={evtEnd}
                  onChange={(e) => setEvtEnd(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Category</label>
                <select
                  value={evtCategory}
                  onChange={(e: any) => setEvtCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                >
                  <option value="work">Work Focus</option>
                  <option value="study">Study Session</option>
                  <option value="billing">Overhead/Bills</option>
                  <option value="personal">Personal Rest</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Interactive Sync</label>
                <button
                  type="button"
                  onClick={handleAutoSchedule}
                  className="w-full h-[34px] border border-dashed border-zinc-800 bg-zinc-950/40 text-emerald-400 hover:border-emerald-900/50 hover:bg-emerald-950/10 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Schedule Tasks
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Strategic Description (Optional)</label>
              <textarea
                value={evtDesc}
                onChange={(e) => setEvtDesc(e.target.value)}
                placeholder="Details of cognitive block..."
                className="w-full h-16 bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Add Calendar Event Node
            </button>
          </form>
        </div>

        {/* Right Column: Visualization & Slot listing */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Month Day strip visualizer */}
          <div className="glass-panel p-4 rounded-xl border border-zinc-900">
            <span className="text-[9px] font-mono text-zinc-500 block mb-2 uppercase">June 2026 Grid Matrix</span>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day) => {
                const isSelected = day.dateStr === selectedDate;
                const dailyEvts = events.filter(e => e.date === day.dateStr);
                const hasBilling = dailyEvts.some(e => e.category === "billing");
                const hasStudy = dailyEvts.some(e => e.category === "study");

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setEvtDate(day.dateStr);
                    }}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer relative ${
                      isSelected 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 hover:border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <span className="text-[10px] font-bold block">{day.dayNum}</span>
                    <span className="text-[8px] font-mono opacity-60 block mt-0.5">Jun</span>
                    
                    {/* Visual markers */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dailyEvts.length > 0 && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-black" : hasStudy ? "bg-amber-400" : hasBilling ? "bg-red-500" : "bg-zinc-400"}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List of events for selected date */}
          <div className="flex-1 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase">EVENTS FOR {selectedDate}</span>
              <span className="text-[9px] font-mono text-zinc-500">{selectedDateEvents.length} BLOCKS</span>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12 bg-black/20 border border-zinc-900 border-dashed rounded-xl text-xs text-zinc-600">
                No cognitive blockages mapped on this corridor. Create a focus block or click "Auto-Schedule".
              </div>
            ) : (
              selectedDateEvents.map((evt) => (
                <div key={evt.id} className="glass-panel p-3.5 rounded-xl border border-zinc-850 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                        evt.category === "study" ? "bg-amber-500/10 text-amber-400 border-amber-900/20" :
                        evt.category === "billing" ? "bg-red-500/10 text-red-400 border-red-900/20" :
                        "bg-zinc-900 text-zinc-400 border-zinc-800"
                      }`}>
                        {evt.category}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {evt.startTime} - {evt.endTime}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white truncate">{evt.title}</h4>
                    {evt.description && <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">{evt.description}</p>}
                  </div>

                  <button
                    onClick={() => removeEvent(evt.id)}
                    className="text-zinc-600 hover:text-red-400 p-1 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

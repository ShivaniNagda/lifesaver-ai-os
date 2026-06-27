import React, { useState, useEffect } from "react";
import { Check, Plus, Trash2, Sparkles, Flame, Percent, BarChart2, Activity, Hourglass } from "lucide-react";

interface Habit {
  id?: string;
  _id?: string;
  title: string;
  frequency: "daily" | "weekly";
  streak: number;
  history: { [date: string]: boolean }; // maps YYYY-MM-DD -> completed state
  category: string;
  createdAt?: string;
}

const AI_HABIT_SUGGESTIONS = [
  { title: "25-Min Active Recall Study block", frequency: "daily", category: "Academics" },
  { title: "SaaS server uptime telemetry audit", frequency: "weekly", category: "Engineering" },
  { title: "Pitch Slide formulation review", frequency: "daily", category: "Startup" },
  { title: "Deep Focus (No notifications) 90m block", frequency: "daily", category: "Focus" }
];

const getLast7Days = () => {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short" }).substring(0, 1);
    result.push({ dateStr, label, fullDay: d.toLocaleDateString("en-US", { weekday: "short" }) });
  }
  return result;
};

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newFrequency, setNewFrequency] = useState<"daily" | "weekly">("daily");
  const [newCategory, setNewCategory] = useState("Focus");
  const [loading, setLoading] = useState(false);

  const last7Days = getLast7Days();

  const getHeaders = () => {
    const token = localStorage.getItem("lifeos_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/habits", {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (e) {
      console.error("Failed to fetch habits from database:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: newTitle,
          frequency: newFrequency,
          streak: 0,
          history: {},
          category: newCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHabits(prev => [data, ...prev]);
        setNewTitle("");
      }
    } catch (err) {
      console.error("Failed to create habit:", err);
    }
  };

  const toggleDay = async (habit: Habit, dateStr: string) => {
    const habitId = habit.id || habit._id;
    if (!habitId) return;

    const history = { ...habit.history };
    const wasCompleted = !!history[dateStr];
    history[dateStr] = !wasCompleted;

    // Calculate streak
    let streak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkStr = checkDate.toISOString().split("T")[0];
      if (history[checkStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const checkYestStr = checkDate.toISOString().split("T")[0];
          if (history[checkYestStr]) {
            continue;
          }
        }
        break;
      }
    }

    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          history,
          streak
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setHabits(prev => prev.map(h => (h.id === habitId || h._id === habitId) ? updated : h));
      }
    } catch (err) {
      console.error("Failed to toggle habit status:", err);
    }
  };

  const removeHabit = async (habit: Habit) => {
    const habitId = habit.id || habit._id;
    if (!habitId) return;

    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        setHabits(prev => prev.filter(h => h.id !== habitId && h._id !== habitId));
      }
    } catch (err) {
      console.error("Failed to delete habit:", err);
    }
  };

  const installSuggestion = async (sug: typeof AI_HABIT_SUGGESTIONS[0]) => {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: sug.title,
          frequency: sug.frequency,
          streak: 0,
          history: {},
          category: sug.category
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHabits(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error("Failed to install habit suggestion:", err);
    }
  };

  const totalCompletedToday = habits.filter(h => {
    const todayStr = new Date().toISOString().split("T")[0];
    return h.history && h.history[todayStr];
  }).length;

  const totalHabitsCount = habits.length;
  const completionRate = totalHabitsCount > 0 
    ? Math.round((totalCompletedToday / totalHabitsCount) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Analytics Mini Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Daily Completion Rate</span>
            <span className="text-xl font-bold text-white block">{completionRate}%</span>
          </div>
          <Percent className="w-8 h-8 text-zinc-600" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Longest Streak</span>
            <span className="text-xl font-bold text-white block">
              {habits.reduce((acc, h) => Math.max(acc, h.streak || 0), 0)} Days
            </span>
          </div>
          <Flame className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Total Habits</span>
            <span className="text-xl font-bold text-white block">{totalHabitsCount} habits</span>
          </div>
          <BarChart2 className="w-8 h-8 text-zinc-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Creator */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-white" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Habit Tracker</h3>
          </div>

          <form onSubmit={handleCreateHabit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Habit Name</label>
              <input
                type="text"
                placeholder="E.g., Practice active recall"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Frequency</label>
                <select
                  value={newFrequency}
                  onChange={(e: any) => setNewFrequency(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                >
                  <option value="Focus">Focus</option>
                  <option value="Academics">Academics</option>
                  <option value="Startup">Startup</option>
                  <option value="Health">Health</option>
                </select>
              </div>

            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Add Habit
            </button>
          </form>

          {/* AI suggested habits list */}
          <div className="pt-4 border-t border-zinc-900 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">AI Suggested Habits</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {AI_HABIT_SUGGESTIONS.map((sug, i) => (
                <div 
                  key={i}
                  onClick={() => installSuggestion(sug)}
                  className="p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 rounded-lg cursor-pointer flex justify-between items-center transition-all group"
                >
                  <div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">{sug.category}</span>
                    <p className="text-[10px] font-medium text-zinc-300 mt-0.5 group-hover:text-white leading-tight">{sug.title}</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold shrink-0 ml-2">
                    + ADD
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Active habits calendar view */}
        <div className="lg:col-span-8 space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-10 font-mono text-xs text-zinc-500 animate-pulse">Syncing habits...</div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 mb-3.5">
                <Hourglass className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-xs font-semibold text-zinc-200">⌛ No Habits Tracked</p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[320px] leading-relaxed">
                No active habits are being tracked. Create a habit on the left or use an AI suggested habit to start tracking your daily progress.
              </p>
            </div>
          ) : (
            habits.map((habit) => {
              const todayStr = new Date().toISOString().split("T")[0];
              const isDoneToday = habit.history && !!habit.history[todayStr];
              
              return (
                <div key={habit.id || habit._id} className="glass-panel p-4 rounded-xl border border-zinc-850 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  
                  {/* Habit title & details */}
                  <div className="flex items-start gap-3 min-w-0 md:w-1/3">
                    <div 
                      onClick={() => toggleDay(habit, todayStr)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                        isDoneToday 
                          ? "bg-white border-white text-black" 
                          : "bg-black border-zinc-800 text-transparent hover:border-zinc-500"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded uppercase">
                          {habit.category}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">
                          {habit.frequency}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white tracking-wide truncate mt-1">{habit.title}</h4>
                    </div>
                  </div>

                  {/* 7-Day History Checklist Matrix */}
                  <div className="flex-1 flex justify-around items-center bg-black/30 p-2.5 rounded-lg border border-zinc-900">
                    {last7Days.map((day) => {
                      const isCompleted = habit.history && !!habit.history[day.dateStr];
                      const isCheckToday = day.dateStr === todayStr;

                      return (
                        <div 
                          key={day.dateStr} 
                          onClick={() => toggleDay(habit, day.dateStr)}
                          className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
                        >
                          <span className="text-[8px] font-mono text-zinc-600 uppercase">{day.label}</span>
                          <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                            isCompleted 
                              ? "bg-white text-black" 
                              : isCheckToday 
                                ? "border border-dashed border-zinc-700" 
                                : "bg-zinc-950 border border-zinc-900 hover:border-zinc-800"
                          }`}>
                            {isCompleted && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Streak & Trash controls */}
                  <div className="flex items-center justify-between md:justify-end gap-5 pl-2">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Flame className={`w-4.5 h-4.5 ${habit.streak && habit.streak > 0 ? "text-amber-500" : "text-zinc-600"}`} />
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">{(habit.streak || 0)}d</span>
                        <span className="text-[8px] text-zinc-500 block uppercase">STREAK</span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeHabit(habit)}
                      className="text-zinc-600 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}

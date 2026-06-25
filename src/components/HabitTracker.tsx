import React, { useState, useEffect } from "react";
import { Check, Plus, Trash2, Sparkles, Flame, Percent, RefreshCw, BarChart2, Activity } from "lucide-react";

interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  streak: number;
  history: { [date: string]: boolean }; // maps YYYY-MM-DD -> completed state
  category: string;
  createdAt: string;
}

const AI_HABIT_SUGGESTIONS = [
  { title: "25-Min Active Recall Study block", frequency: "daily", category: "Academics" },
  { title: "SaaS server uptime telemetry audit", frequency: "weekly", category: "Engineering" },
  { title: "Pitch Slide formulation review", frequency: "daily", category: "Startup" },
  { title: "Deep Focus (No notifications) 90m block", frequency: "daily", category: "Focus" }
];

// Helper to get last 7 days of dates with labels
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

  const last7Days = getLast7Days();

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("lifeos_habits");
    if (saved) {
      try {
        setHabits(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default habits
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const defaultHabits: Habit[] = [
        {
          id: "h1",
          title: "Active Recall Study Drill",
          frequency: "daily",
          streak: 2,
          history: {
            [yesterdayStr]: true,
            [today]: true
          },
          category: "Academics",
          createdAt: today
        },
        {
          id: "h2",
          title: "Startup Revenue Flow review",
          frequency: "weekly",
          streak: 1,
          history: {
            [today]: true
          },
          category: "Startup",
          createdAt: today
        }
      ];
      setHabits(defaultHabits);
      localStorage.setItem("lifeos_habits", JSON.stringify(defaultHabits));
    }
  }, []);

  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    localStorage.setItem("lifeos_habits", JSON.stringify(updatedHabits));
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    const added: Habit = {
      id: `h-${Date.now()}`,
      title: newTitle,
      frequency: newFrequency,
      streak: 0,
      history: {},
      category: newCategory,
      createdAt: today
    };

    saveHabits([added, ...habits]);
    setNewTitle("");
  };

  const toggleDay = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const history = { ...h.history };
      const wasCompleted = !!history[dateStr];
      history[dateStr] = !wasCompleted;

      // Calculate streak (consecutive days backward from today)
      let streak = 0;
      let checkDate = new Date();
      
      // Let's count consecutive completed days starting from today or yesterday
      for (let i = 0; i < 30; i++) {
        const checkStr = checkDate.toISOString().split("T")[0];
        if (history[checkStr]) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // If we are checking "today" and it's not done, keep checking starting from yesterday to keep streak
          if (i === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            const checkYestStr = checkDate.toISOString().split("T")[0];
            if (history[checkYestStr]) {
              // streak continues from yesterday
              continue;
            }
          }
          break;
        }
      }

      return {
        ...h,
        history,
        streak
      };
    });

    saveHabits(updated);
  };

  const removeHabit = (id: string) => {
    const next = habits.filter(h => h.id !== id);
    saveHabits(next);
  };

  const installSuggestion = (sug: typeof AI_HABIT_SUGGESTIONS[0]) => {
    const today = new Date().toISOString().split("T")[0];
    const added: Habit = {
      id: `h-${Date.now()}`,
      title: sug.title,
      frequency: sug.frequency as any,
      streak: 0,
      history: {},
      category: sug.category,
      createdAt: today
    };
    saveHabits([added, ...habits]);
  };

  // Compute stats
  const totalCompletedToday = habits.filter(h => {
    const todayStr = new Date().toISOString().split("T")[0];
    return h.history[todayStr];
  }).length;

  const totalHabitsCount = habits.length;
  const completionRate = totalHabitsCount > 0 
    ? Math.round((totalCompletedToday / totalHabitsCount) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Analytics Dashboard mini bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Daily Alignment Score</span>
            <span className="text-xl font-bold text-white block">{completionRate}%</span>
          </div>
          <Percent className="w-8 h-8 text-zinc-600" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Active Streaks Armed</span>
            <span className="text-xl font-bold text-white block">
              {habits.reduce((acc, h) => Math.max(acc, h.streak), 0)} Consecutive Days
            </span>
          </div>
          <Flame className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Habits Monitored</span>
            <span className="text-xl font-bold text-white block">{totalHabitsCount} disciplines</span>
          </div>
          <BarChart2 className="w-8 h-8 text-zinc-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Creator */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-white" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Habit Anchor</h3>
          </div>

          <form onSubmit={handleCreateHabit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Anchor Phrase</label>
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
              Anchor Core Discipline
            </button>
          </form>

          {/* AI suggested habits list */}
          <div className="pt-4 border-t border-zinc-900 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">AI suggested anchors</span>
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
          {habits.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-zinc-800/40 text-xs text-zinc-500">
              No disciplines anchored yet in the system. Establish daily studies or startup tracking loops to start.
            </div>
          ) : (
            habits.map((habit) => {
              const todayStr = new Date().toISOString().split("T")[0];
              const isDoneToday = !!habit.history[todayStr];
              
              return (
                <div key={habit.id} className="glass-panel p-4 rounded-xl border border-zinc-850 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  
                  {/* Habit title & details */}
                  <div className="flex items-start gap-3 min-w-0 md:w-1/3">
                    <div 
                      onClick={() => toggleDay(habit.id, todayStr)}
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
                      const isCompleted = !!habit.history[day.dateStr];
                      const isCheckToday = day.dateStr === todayStr;

                      return (
                        <div 
                          key={day.dateStr} 
                          onClick={() => toggleDay(habit.id, day.dateStr)}
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
                      <Flame className={`w-4.5 h-4.5 ${habit.streak > 0 ? "text-amber-500" : "text-zinc-600"}`} />
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">{habit.streak}d</span>
                        <span className="text-[8px] text-zinc-500 block uppercase">STREAK</span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeHabit(habit.id)}
                      className="text-zinc-600 hover:text-red-400 p-1.5 transition-colors"
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

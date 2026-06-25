import React, { useState, useEffect } from "react";
import { Target, CheckCircle, Plus, Trash2, Sparkles, TrendingUp, Calendar, Zap, AlertCircle } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  deadline: string;
  milestones: Milestone[];
  progress: number; // calculated completion percentage
  status: "active" | "completed" | "delayed";
}

const AI_GOAL_SUGGESTIONS = [
  {
    title: "Master Electrochemistry Concepts",
    category: "Academics",
    deadline: "2026-06-28",
    milestones: [
      "Review Nernst equation derivations",
      "Solve 15 galvanic cell mock equations",
      "Review oxidation state assignment rules"
    ]
  },
  {
    title: "Venture Seed Pitch Deck Delivery",
    category: "Startup Funding",
    deadline: "2026-06-30",
    milestones: [
      "Refine financial forecast parameters",
      "Design standard monochrome visual flow",
      "Draft 10-slide high-yield summary deck"
    ]
  },
  {
    title: "Optimize SaaS Server Infrastructure SLA",
    category: "Engineering",
    deadline: "2026-07-05",
    milestones: [
      "Review rate limiter bounds",
      "Settle vendor hosting extension parameters",
      "Deploy fallback caching corridors"
    ]
  }
];

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Startup");
  const [newDeadline, setNewDeadline] = useState("2026-06-30");
  const [newMilestonesText, setNewMilestonesText] = useState("");

  // Load from local storage if exists
  useEffect(() => {
    const saved = localStorage.getItem("lifeos_goals");
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default goals matching initial app commitments
      const defaultGoals: Goal[] = [
        {
          id: "g1",
          title: "Prep Chemistry Midterm Examination",
          category: "Academics",
          deadline: "2026-06-28",
          milestones: [
            { id: "m1-1", title: "Organic Synthesis routes summary sheet", completed: true },
            { id: "m1-2", title: "Syllabus practice problems set B", completed: false },
            { id: "m1-3", title: "Active Recall mock test evaluation", completed: false }
          ],
          progress: 33,
          status: "active"
        },
        {
          id: "g2",
          title: "Venture Pitch Deck Delivery",
          category: "Startup Funding",
          deadline: "2026-06-30",
          milestones: [
            { id: "m2-1", title: "Complete total addressable market analysis", completed: true },
            { id: "m2-2", title: "Prepare financial 3-year margin forecast", completed: true },
            { id: "m2-3", title: "Format visual monochrome typography layout", completed: false }
          ],
          progress: 66,
          status: "active"
        }
      ];
      setGoals(defaultGoals);
      localStorage.setItem("lifeos_goals", JSON.stringify(defaultGoals));
    }
  }, []);

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem("lifeos_goals", JSON.stringify(updatedGoals));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const milestonesList = newMilestonesText
      .split("\n")
      .filter(m => m.trim().length > 0)
      .map((m, i) => ({
        id: `m-${Date.now()}-${i}`,
        title: m.trim(),
        completed: false
      }));

    const added: Goal = {
      id: `g-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      deadline: newDeadline,
      milestones: milestonesList,
      progress: 0,
      status: "active"
    };

    const next = [added, ...goals];
    saveGoals(next);
    setNewTitle("");
    setNewMilestonesText("");
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      const nextMilestones = g.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = nextMilestones.filter(m => m.completed).length;
      const progress = nextMilestones.length > 0 
        ? Math.round((completedCount / nextMilestones.length) * 100) 
        : 100;
      return {
        ...g,
        milestones: nextMilestones,
        progress,
        status: (progress === 100 ? "completed" : "active") as any
      };
    });
    saveGoals(updated);
  };

  const removeGoal = (id: string) => {
    const next = goals.filter(g => g.id !== id);
    saveGoals(next);
  };

  const injectAiSuggestion = (sug: typeof AI_GOAL_SUGGESTIONS[0]) => {
    const added: Goal = {
      id: `g-${Date.now()}`,
      title: sug.title,
      category: sug.category,
      deadline: sug.deadline,
      milestones: sug.milestones.map((m, i) => ({
        id: `m-ai-${Date.now()}-${i}`,
        title: m,
        completed: false
      })),
      progress: 0,
      status: "active"
    };
    saveGoals([added, ...goals]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input form */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-white" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Goal Orchestrator</h3>
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Strategic Objective</label>
              <input
                type="text"
                placeholder="E.g., Complete Pitch Deck Polish"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-400 focus:outline-none"
                >
                  <option value="Startup">Startup</option>
                  <option value="Academics">Academics</option>
                  <option value="Personal">Personal</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Deadline Date</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                Milestones (One per line)
              </label>
              <textarea
                placeholder="Draft intro slides&#10;Incorporate financial model&#10;Verify brand guidelines"
                value={newMilestonesText}
                onChange={(e) => setNewMilestonesText(e.target.value)}
                className="w-full h-24 bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-800 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Establish New Strategic Goal
            </button>
          </form>
        </div>

        {/* Right active lists */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* AI suggested goals corridor */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-zinc-900">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">AI Goal Alignment Recommendations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {AI_GOAL_SUGGESTIONS.map((sug, i) => (
                <div 
                  key={i} 
                  onClick={() => injectAiSuggestion(sug)}
                  className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase">{sug.category}</span>
                  <h4 className="text-[10px] font-semibold text-zinc-300 mt-1 line-clamp-2 group-hover:text-white">{sug.title}</h4>
                  <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 mt-2">
                    <span>Due: {sug.deadline}</span>
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">+ INSTALL</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal List Cards */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {goals.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-zinc-800/40 text-xs text-zinc-500">
                No active strategic goals mapped in current operational profile. Add an objective above or deploy an AI suggestion.
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="glass-panel p-4.5 rounded-xl border border-zinc-800/80 space-y-3.5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">
                          {goal.category}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due {goal.deadline}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white tracking-wide">{goal.title}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-white">{goal.progress}%</span>
                        <span className="text-[9px] text-zinc-500 block">COMPLETED</span>
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Milestones dynamic list */}
                  <div className="space-y-2 pt-1 border-t border-zinc-900/60">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Milestone Breakdown</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {goal.milestones.map((milestone) => (
                        <div 
                          key={milestone.id}
                          onClick={() => toggleMilestone(goal.id, milestone.id)}
                          className="flex items-center gap-2.5 p-2 rounded bg-black/30 border border-zinc-900 hover:border-zinc-800 transition-colors cursor-pointer select-none"
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            milestone.completed 
                              ? "bg-white border-white text-black" 
                              : "border-zinc-800"
                          }`}>
                            {milestone.completed && <CheckCircle className="w-2.5 h-2.5" />}
                          </div>
                          <span className={`text-[11px] leading-tight truncate ${milestone.completed ? "line-through text-zinc-500" : "text-zinc-300"}`}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goal Timeline micro bar */}
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-700" 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

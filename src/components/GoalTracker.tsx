import React, { useState, useEffect } from "react";
import { Target, CheckCircle, Plus, Trash2, Sparkles, Calendar } from "lucide-react";
import { useToast } from "./ToastProvider";

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id?: string;
  _id?: string;
  title: string;
  category: string;
  targetDate: string;
  milestones: Milestone[];
  progress: number;
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
    title: "Optimize SaaS Server SLA",
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
  const { success: showSuccess, error: showError, info: showInfo } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Startup");
  const [newDeadline, setNewDeadline] = useState("2026-06-30");
  const [newMilestonesText, setNewMilestonesText] = useState("");
  const [loading, setLoading] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("lifeos_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals", {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (e) {
      console.error("Failed to load goals from backend:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showError("Validation Error", "Goal title cannot be empty.", "goal");
      return;
    }

    const milestonesList = newMilestonesText
      .split("\n")
      .filter(m => m.trim().length > 0)
      .map((m, i) => ({
        id: `m-${Date.now()}-${i}`,
        title: m.trim(),
        completed: false
      }));

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          targetDate: newDeadline,
          milestones: milestonesList,
          progress: 0,
          status: "active"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(prev => [data, ...prev]);
        setNewTitle("");
        setNewMilestonesText("");
        showSuccess("Goal Added Successfully 🎯", `"${data.title}" has been registered.`);
      } else {
        showError("Failed to Add Goal", "The database rejected your goal creation attempt.", "goal");
      }
    } catch (err: any) {
      console.error("Failed to save goal:", err);
      showError("Server Error", err.message || "Failed to create your goal.", "goal");
    }
  };

  const toggleMilestone = async (goal: Goal, milestoneId: string) => {
    const goalId = goal.id || goal._id;
    if (!goalId) return;

    const nextMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = nextMilestones.filter(m => m.completed).length;
    const progress = nextMilestones.length > 0 
      ? Math.round((completedCount / nextMilestones.length) * 100) 
      : 100;
    const nextStatus = progress === 100 ? "completed" : "active";

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          milestones: nextMilestones,
          progress,
          status: nextStatus
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals(prev => prev.map(g => (g.id === goalId || g._id === goalId) ? updated : g));
        
        if (nextStatus === "completed" && goal.status !== "completed") {
          showSuccess("Goal Completed 🎉", `Congratulations on completing "${goal.title}"!`);
        } else {
          showSuccess("Goal Updated Successfully", "Milestone progress updated.");
        }
      } else {
        showError("Update Failed", "Could not update milestone.", "goal");
      }
    } catch (err: any) {
      console.error("Failed to update milestone:", err);
      showError("Server Error", "Could not save milestone state.", "goal");
    }
  };

  const removeGoal = async (goal: Goal) => {
    const goalId = goal.id || goal._id;
    if (!goalId) return;

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId && g._id !== goalId));
        showSuccess("Goal Deleted Successfully", `"${goal.title}" has been removed.`);
      } else {
        showError("Delete Failed", "The server rejected the delete action.", "goal");
      }
    } catch (err: any) {
      console.error("Failed to delete goal:", err);
      showError("Server Error", "Could not complete goal deletion.", "goal");
    }
  };

  const injectAiSuggestion = async (sug: typeof AI_GOAL_SUGGESTIONS[0]) => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: sug.title,
          category: sug.category,
          targetDate: sug.deadline,
          milestones: sug.milestones.map((m, i) => ({
            id: `m-ai-${Date.now()}-${i}`,
            title: m,
            completed: false
          })),
          progress: 0,
          status: "active"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(prev => [data, ...prev]);
        showSuccess("Goal Added Successfully 🎯", `AI Goal: "${data.title}" successfully loaded.`);
      } else {
        showError("AI Goal Injection Failed", "Database rejected suggestion.", "goal");
      }
    } catch (err: any) {
      console.error("Failed to inject AI suggestion:", err);
      showError("Network Error", "Could not import AI recommended goal.", "goal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input form */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-white" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Goals</h3>
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Goal Name</label>
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
              Add Goal
            </button>
          </form>
        </div>

        {/* Right active lists */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* AI suggested goals corridor */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-zinc-900">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">AI Goal Recommendations</span>
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
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">+ ADD GOAL</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal List Cards */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {loading ? (
              <div className="text-center py-10 font-mono text-xs text-zinc-500 animate-pulse">Syncing goals...</div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 mb-3.5">
                  <Target className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-xs font-semibold text-zinc-200">🎯 No Goals Found</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[280px] leading-relaxed">
                  No active goals are tracked in your profile. Add a goal above or select an AI recommendation to get started.
                </p>
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id || goal._id} className="glass-panel p-4.5 rounded-xl border border-zinc-800/80 space-y-3.5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">
                          {goal.category}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due {goal.targetDate}
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
                        onClick={() => removeGoal(goal)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-2 pt-1 border-t border-zinc-900/60">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Milestone Breakdown</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {goal.milestones && goal.milestones.map((milestone) => (
                        <div 
                          key={milestone.id}
                          onClick={() => toggleMilestone(goal, milestone.id)}
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

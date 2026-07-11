import React from "react";
import { Trash2 } from "lucide-react";
import { Task } from "../types";

interface TaskItemProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onRemove: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleStatus, onRemove }) => {
  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-900/30";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-900/30";
      case "medium":
        return "bg-zinc-500/10 text-zinc-300 border-zinc-800";
      default:
        return "bg-zinc-800/20 text-zinc-400 border-zinc-900";
    }
  };

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-zinc-900/60 hover:border-zinc-800/80 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={task.status === "completed"}
          onChange={() => onToggleStatus(task.id)}
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
          onClick={() => onRemove(task.id)}
          className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors"
          aria-label="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(TaskItem);

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";

const statusOptions = ["active", "planning", "paused", "completed", "archived"] as const;
const priorityColors = { low: "#64748b", medium: "#fbbf24", high: "#fb7185" };

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id) : null;
  const isNew = !projectId;
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("#5eead4");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  const { data: project, isLoading } = trpc.project.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const createProject = trpc.project.create.useMutation({
    onSuccess: (data) => {
      utils.project.list.invalidate();
      navigate(`/projects/${data.id}`, { replace: true });
    },
  });

  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: projectId! });
      utils.project.list.invalidate();
    },
  });

  const addTask = trpc.project.addTask.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: projectId! }),
  });

  const updateTask = trpc.project.updateTask.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: projectId! }),
  });

  const deleteTask = trpc.project.deleteTask.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: projectId! }),
  });

  const handleSave = () => {
    if (!name.trim()) return;
    if (isNew) {
      createProject.mutate({ name, description, status: status as "active" | "planning" | "paused" | "completed" | "archived", category, color });
    } else if (projectId) {
      updateProject.mutate({ id: projectId, name, description, status: status as "active" | "planning" | "paused" | "completed" | "archived", category, color });
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !projectId) return;
    addTask.mutate({ projectId, title: newTaskTitle, priority: newTaskPriority });
    setNewTaskTitle("");
  };

  const handleToggleTask = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTask.mutate({ taskId, status: newStatus as "todo" | "in_progress" | "done" });
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-[#5eead4] animate-spin" />
      </div>
    );
  }

  const tasks = project?.tasks ?? [];
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/projects")}
            className="w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!name.trim() || createProject.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors disabled:opacity-50"
        >
          {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isNew ? "Create" : "Save"}
        </button>
      </div>

      {/* Project Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name..."
            className="flex-1 bg-transparent text-2xl font-semibold text-[#e2e8f0] placeholder-[#2a2a3e] outline-none"
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project description..."
          className="w-full h-20 bg-transparent text-sm text-[#94a3b8] placeholder-[#2a2a3e] outline-none resize-none"
        />
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none"
          />
        </div>

        {/* Progress */}
        {!isNew && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-sm text-[#64748b]">{progress}%</span>
            <span className="text-xs text-[#64748b]">{doneCount}/{tasks.length} tasks</span>
          </div>
        )}
      </div>

      {/* Tasks */}
      {!isNew && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider">Tasks</h3>

          {/* Add Task */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as "low" | "medium" | "high")}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={handleAddTask}
              className="w-9 h-9 rounded-xl bg-[#5eead4]/10 flex items-center justify-center text-[#5eead4] hover:bg-[#5eead4]/20"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#1a1a2e] ${
                  task.status === "done" ? "opacity-50" : ""
                }`}
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.status ?? "todo")}
                  className="flex-shrink-0"
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#64748b]" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === "done" ? "line-through text-[#64748b]" : "text-[#e2e8f0]"}`}>
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-[10px] text-[#64748b] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: priorityColors[task.priority ?? "medium"] }}
                />
                <button
                  onClick={() => deleteTask.mutate({ taskId: task.id })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-6 text-sm text-[#64748b]">No tasks yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

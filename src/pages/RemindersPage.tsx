import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { format, isPast } from "date-fns";
import {
  Bell,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Loader2,
  X,
  Filter,
} from "lucide-react";

const priorityConfig = {
  low: { color: "#64748b", label: "Low" },
  medium: { color: "#fbbf24", label: "Medium" },
  high: { color: "#fb7185", label: "High" },
};

export function RemindersPage() {
  const [search, setSearch] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.reminder.list.useQuery({
    search: search || undefined,
    isCompleted: showCompleted ? true : false,
    limit: 50,
  });

  const createReminder = trpc.reminder.create.useMutation({
    onSuccess: () => {
      utils.reminder.list.invalidate();
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setNewPriority("medium");
      setShowAddForm(false);
    },
  });

  const toggleComplete = trpc.reminder.toggleComplete.useMutation({
    onSuccess: () => utils.reminder.list.invalidate(),
  });

  const deleteReminder = trpc.reminder.delete.useMutation({
    onSuccess: () => utils.reminder.list.invalidate(),
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createReminder.mutate({
      title: newTitle,
      description: newDescription || undefined,
      dueDate: newDueDate || undefined,
      priority: newPriority,
    });
  };

  const reminders = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#fb7185]" />
            Reminders
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data?.total ?? 0} reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reminders..."
              className="w-full sm:w-48 pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
          </div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-2 rounded-xl text-sm transition-colors ${
              showCompleted ? "bg-[#34d399]/10 text-[#34d399]" : "bg-white/[0.03] text-[#64748b]"
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#e2e8f0]">New Reminder</h3>
            <button onClick={() => setShowAddForm(false)} className="text-[#64748b] hover:text-[#e2e8f0]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Reminder title..."
              className="w-full px-4 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full h-16 px-4 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#94a3b8] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30 resize-none"
            />
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high")}
                className="px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() || createReminder.isPending}
                className="px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 disabled:opacity-50"
              >
                {createReminder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminders List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-[#5eead4] animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="w-12 h-12 text-[#2a2a3e] mb-3" />
          <p className="text-[#64748b] text-sm">
            {showCompleted ? "No completed reminders" : "No pending reminders"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => {
            const isOverdue = reminder.dueDate && isPast(new Date(reminder.dueDate)) && !reminder.isCompleted;
            return (
              <div
                key={reminder.id}
                className={`flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] transition-all ${
                  reminder.isCompleted ? "opacity-50" : isOverdue ? "border-red-500/30" : ""
                }`}
              >
                <button
                  onClick={() => toggleComplete.mutate({ id: reminder.id })}
                  className="flex-shrink-0"
                >
                  {reminder.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#64748b] hover:text-[#5eead4]" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${reminder.isCompleted ? "line-through text-[#64748b]" : "text-[#e2e8f0]"}`}>
                    {reminder.title}
                  </p>
                  {reminder.description && (
                    <p className="text-xs text-[#64748b] mt-0.5">{reminder.description}</p>
                  )}
                  {reminder.dueDate && (
                    <p className={`text-[10px] flex items-center gap-1 mt-1 ${isOverdue ? "text-red-400" : "text-[#64748b]"}`}>
                      <Clock className="w-3 h-3" />
                      {format(new Date(reminder.dueDate), "MMM d, yyyy h:mm a")}
                      {isOverdue && " (Overdue)"}
                    </p>
                  )}
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: priorityConfig[reminder.priority ?? "medium"].color }}
                />
                <button
                  onClick={() => deleteReminder.mutate({ id: reminder.id })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

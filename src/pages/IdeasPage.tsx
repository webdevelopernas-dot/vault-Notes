import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Lightbulb,
  Plus,
  Search,
  Loader2,
  X,
} from "lucide-react";

const categoryConfig: Record<string, { color: string; label: string }> = {
  business: { color: "#fbbf24", label: "Business" },
  app: { color: "#5eead4", label: "App" },
  project: { color: "#a78bfa", label: "Project" },
  other: { color: "#64748b", label: "Other" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  new: { color: "#5eead4", label: "New" },
  planning: { color: "#fbbf24", label: "Planning" },
  active: { color: "#34d399", label: "Active" },
  completed: { color: "#a78bfa", label: "Completed" },
  on_hold: { color: "#64748b", label: "On Hold" },
};

export function IdeasPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<"business" | "app" | "project" | "other">("other");
  const [newStatus, setNewStatus] = useState<"new" | "planning" | "active" | "completed" | "on_hold">("new");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.idea.list.useQuery({
    search: search || undefined,
    category: categoryFilter as "business" | "app" | "project" | "other" | undefined,
    limit: 50,
  });

  const createIdea = trpc.idea.create.useMutation({
    onSuccess: () => {
      utils.idea.list.invalidate();
      setNewTitle("");
      setNewDescription("");
      setNewCategory("other");
      setNewStatus("new");
      setNewTags([]);
      setShowAddForm(false);
    },
  });

  const deleteIdea = trpc.idea.delete.useMutation({
    onSuccess: () => utils.idea.list.invalidate(),
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createIdea.mutate({ title: newTitle, description: newDescription, category: newCategory, status: newStatus, tags: newTags });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const ideas = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-[#fbbf24]" />
            Idea Bank
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data?.total ?? 0} ideas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ideas..."
              className="w-full sm:w-44 pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
          >
            <option value="">All</option>
            <option value="business">Business</option>
            <option value="app">App</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#e2e8f0]">New Idea</h3>
            <button onClick={() => setShowAddForm(false)} className="text-[#64748b] hover:text-[#e2e8f0]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Idea title..."
              className="w-full px-4 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your idea..."
              className="w-full h-20 px-4 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#94a3b8] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30 resize-none"
            />
            <div className="flex items-center gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as "business" | "app" | "project" | "other")}
                className="px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
              >
                <option value="business">Business</option>
                <option value="app">App</option>
                <option value="project">Project</option>
                <option value="other">Other</option>
              </select>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as "new" | "planning" | "active" | "completed" | "on_hold")}
                className="px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
              >
                <option value="new">New</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
              <div className="flex-1 flex items-center gap-1 flex-wrap">
                {newTags.map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#5eead4]/10 text-[#5eead4]">
                    {tag}
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="+ tag"
                  className="w-12 bg-transparent text-[10px] text-[#64748b] placeholder-[#2a2a3e] outline-none"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-[#5eead4] animate-spin" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb className="w-12 h-12 text-[#2a2a3e] mb-3" />
          <p className="text-[#64748b] text-sm">No ideas yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ideas.map((idea) => {
            const cat = categoryConfig[idea.category ?? "other"];
            const stat = statusConfig[idea.status ?? "new"];
            return (
              <div
                key={idea.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteIdea.mutate({ id: idea.id })}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <h3 className="text-sm font-medium text-[#e2e8f0] mb-1">{idea.title}</h3>
                <p className="text-xs text-[#64748b] line-clamp-3 mb-2">{idea.description}</p>
                <div className="flex flex-wrap gap-1">
                  {(idea.tags as string[] | null)?.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.05] text-[#64748b]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

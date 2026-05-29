import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  FolderKanban,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "#5eead4",
  planning: "#fbbf24",
  paused: "#64748b",
  completed: "#34d399",
  archived: "#f472b6",
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading } = trpc.project.list.useQuery({
    search: search || undefined,
    status: statusFilter as "active" | "planning" | "paused" | "completed" | "archived" | undefined,
    limit: 50,
  });

  const projects = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#fbbf24]" />
            Projects
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data?.total ?? 0} projects</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full sm:w-56 pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => navigate("/projects/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-[#5eead4] animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="w-12 h-12 text-[#2a2a3e] mb-3" />
          <p className="text-[#64748b] text-sm">No projects yet</p>
          <button onClick={() => navigate("/projects/new")} className="mt-3 text-[#5eead4] text-sm hover:underline">
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="text-left p-5 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color ?? "#5eead4" }}
                  />
                  <h3 className="text-sm font-semibold text-[#e2e8f0]">{project.name}</h3>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: `${statusColors[project.status ?? "active"]}20`,
                    color: statusColors[project.status ?? "active"],
                  }}
                >
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-[#64748b] line-clamp-2 mb-3">{project.description || "No description"}</p>
              <div className="flex items-center justify-between">
                {project.category && (
                  <span className="text-[10px] text-[#64748b] bg-white/[0.05] px-2 py-0.5 rounded-full">
                    {project.category}
                  </span>
                )}
                <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
                  <CheckCircle2 className="w-3 h-3" />
                  {project.taskDone}/{project.taskTotal} tasks
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project.progress ?? 0}%`,
                    backgroundColor: project.color ?? "#5eead4",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  FolderKanban,
  Code2,
  FileArchive,
  Bell,
  Bookmark,
  BookOpen,
  Lightbulb,
  Plus,
  Pin,
  ArrowRight,
  Loader2,
  Circle,
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.dashboard.summary.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#5eead4] animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const {
    recentNotes,
    recentFiles,
    activeProjects,
    upcomingReminders,
    recentSnippets,
    recentBookmarks,
    todaysJournal,
    counts,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0]">Dashboard</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Your personal knowledge vault</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/notes/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Notes", count: counts.totalNotes, icon: FileText, color: "#5eead4" },
          { label: "Projects", count: counts.totalProjects, icon: FolderKanban, color: "#fbbf24" },
          { label: "Snippets", count: counts.totalSnippets, icon: Code2, color: "#a78bfa" },
          { label: "Files", count: counts.totalFiles, icon: FileArchive, color: "#f472b6" },
          { label: "Reminders", count: counts.totalReminders, icon: Bell, color: "#fb7185" },
          { label: "Ideas", count: counts.totalIdeas, icon: Lightbulb, color: "#fbbf24" },
          { label: "Bookmarks", count: counts.totalBookmarks, icon: Bookmark, color: "#60a5fa" },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(`/${stat.label.toLowerCase()}`)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border"
          >
            <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            <span className="text-xl font-semibold text-[#e2e8f0]">{stat.count}</span>
            <span className="text-[11px] text-[#64748b] uppercase tracking-wider">{stat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Notes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5eead4]" />
              Recent Notes
            </h2>
            <button onClick={() => navigate("/notes")} className="text-xs text-[#64748b] hover:text-[#5eead4] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentNotes.map((note, i) => (
              <button
                key={note.id}
                onClick={() => navigate(`/notes/${note.id}`)}
                className={`text-left p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border animate-fade-in-up stagger-${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-1 h-8 rounded-full bg-[#5eead4]/40 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {note.isPinned && <Pin className="w-3 h-3 text-[#fbbf24] flex-shrink-0" />}
                      <h3 className="text-sm font-medium text-[#e2e8f0] truncate">{note.title}</h3>
                    </div>
                    <p className="text-xs text-[#64748b] mt-1 line-clamp-2">
                      {note.content?.slice(0, 120).replace(/[#*_`]/g, "") || "No content"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {(note.tags as string[] | null)?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.05] text-[#64748b]"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] text-[#64748b] ml-auto">
                        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#fb7185]" />
              Reminders
            </h2>
            <button onClick={() => navigate("/reminders")} className="text-xs text-[#64748b] hover:text-[#5eead4] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#1a1a2e]"
              >
                <Circle className={`w-4 h-4 flex-shrink-0 ${
                  reminder.priority === "high" ? "text-[#fb7185]" :
                  reminder.priority === "medium" ? "text-[#fbbf24]" : "text-[#64748b]"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e2e8f0] truncate">{reminder.title}</p>
                  {reminder.dueDate && (
                    <p className="text-[10px] text-[#64748b]">
                      {formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {upcomingReminders.length === 0 && (
              <div className="text-center py-6 text-sm text-[#64748b]">No upcoming reminders</div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Projects */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#fbbf24]" />
              Projects
            </h2>
            <button onClick={() => navigate("/projects")} className="text-xs text-[#64748b] hover:text-[#5eead4] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full text-left p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color ?? "#5eead4" }} />
                      <h3 className="text-sm font-medium text-[#e2e8f0] truncate">{project.name}</h3>
                    </div>
                    {project.category && (
                      <span className="text-[10px] text-[#64748b] mt-1 inline-block bg-white/[0.05] px-2 py-0.5 rounded-full">
                        {project.category}
                      </span>
                    )}
                  </div>
                  <div className="relative w-10 h-10 flex-shrink-0 ml-3">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={project.color ?? "#5eead4"}
                        strokeWidth="3"
                        strokeDasharray={`${(project.progress ?? 0) / 100 * 94.2} 94.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-[#e2e8f0]">
                      {project.progress ?? 0}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {activeProjects.length === 0 && (
              <div className="text-center py-6 text-sm text-[#64748b]">No active projects</div>
            )}
          </div>
        </div>

        {/* Recent Snippets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#a78bfa]" />
              Snippets
            </h2>
            <button onClick={() => navigate("/snippets")} className="text-xs text-[#64748b] hover:text-[#5eead4] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentSnippets.map((snippet) => (
              <button
                key={snippet.id}
                onClick={() => navigate(`/snippets/${snippet.id}`)}
                className="w-full text-left p-4 rounded-2xl bg-[#050509] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#e2e8f0]">{snippet.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5eead4]/10 text-[#5eead4]">
                    {snippet.language}
                  </span>
                </div>
                <pre className="text-[11px] text-[#64748b] font-mono line-clamp-2 overflow-hidden">
                  <code>{snippet.code}</code>
                </pre>
              </button>
            ))}
            {recentSnippets.length === 0 && (
              <div className="text-center py-6 text-sm text-[#64748b]">No snippets yet</div>
            )}
          </div>
        </div>

        {/* Today's Journal + Bookmarks */}
        <div className="space-y-4">
          {/* Journal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#34d399]" />
                Journal
              </h2>
              <button onClick={() => navigate("/journal")} className="text-xs text-[#64748b] hover:text-[#5eead4] flex items-center gap-1 transition-colors">
                Open <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => navigate("/journal")}
              className="w-full text-left p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border"
            >
              {todaysJournal ? (
                <div>
                  <p className="text-xs text-[#5eead4] mb-1">Today</p>
                  <p className="text-sm text-[#e2e8f0] line-clamp-3">
                    {todaysJournal.notes || todaysJournal.accomplishments || "Journal entry recorded"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      todaysJournal.mood === "great" ? "bg-green-500/20 text-green-400" :
                      todaysJournal.mood === "good" ? "bg-emerald-500/20 text-emerald-400" :
                      todaysJournal.mood === "neutral" ? "bg-yellow-500/20 text-yellow-400" :
                      todaysJournal.mood === "bad" ? "bg-orange-500/20 text-orange-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {todaysJournal.mood}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-[#64748b]">No journal entry for today</p>
                  <p className="text-xs text-[#5eead4] mt-1">Click to add one</p>
                </div>
              )}
            </button>
          </div>

          {/* Recent Bookmarks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#60a5fa]" />
                Bookmarks
              </h2>
              <button onClick={() => navigate("/bookmarks")} className="text-xs text-[#64748b] hover:text-[#5eead4] flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recentBookmarks.slice(0, 3).map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all"
                >
                  {bookmark.favicon ? (
                    <img src={bookmark.favicon} alt="" className="w-5 h-5 rounded" />
                  ) : (
                    <div className="w-5 h-5 rounded bg-[#5eead4]/10 flex items-center justify-center">
                      <Bookmark className="w-3 h-3 text-[#5eead4]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e2e8f0] truncate">{bookmark.title}</p>
                    <p className="text-[10px] text-[#64748b] truncate">{bookmark.url}</p>
                  </div>
                </a>
              ))}
              {recentBookmarks.length === 0 && (
                <div className="text-center py-4 text-sm text-[#64748b]">No bookmarks yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-[#f472b6]" />
              Recent Files
            </h2>
            <button onClick={() => navigate("/files")} className="text-xs text-[#64748b] hover:text-[#5eead4] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-[#2a2a3e] flex flex-col items-center gap-2 hover:border-[#5eead4]/30 transition-all"
              >
                <FileArchive className="w-8 h-8 text-[#64748b]" />
                <p className="text-xs text-[#e2e8f0] text-center truncate w-full">{file.name}</p>
                <p className="text-[10px] text-[#64748b]">{file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

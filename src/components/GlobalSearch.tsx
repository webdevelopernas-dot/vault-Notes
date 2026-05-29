import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Search,
  X,
  FileText,
  FolderKanban,
  Code2,
  FileArchive,
  BookOpen,
  Bell,
  Lightbulb,
  Bookmark,
  Loader2,
} from "lucide-react";

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string; path: string }> = {
  notes: { icon: FileText, label: "Note", color: "#5eead4", path: "/notes" },
  projects: { icon: FolderKanban, label: "Project", color: "#fbbf24", path: "/projects" },
  snippets: { icon: Code2, label: "Snippet", color: "#a78bfa", path: "/snippets" },
  files: { icon: FileArchive, label: "File", color: "#f472b6", path: "/files" },
  journal: { icon: BookOpen, label: "Journal", color: "#34d399", path: "/journal" },
  reminders: { icon: Bell, label: "Reminder", color: "#fb7185", path: "/reminders" },
  ideas: { icon: Lightbulb, label: "Idea", color: "#fbbf24", path: "/ideas" },
  bookmarks: { icon: Bookmark, label: "Bookmark", color: "#60a5fa", path: "/bookmarks" },
};

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data, isLoading } = trpc.search.global.useQuery(
    { query: query.trim(), limit: 5 },
    { enabled: query.trim().length > 0 }
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleResultClick = (type: string, id: number) => {
    const config = typeConfig[type];
    if (config) {
      navigate(`${config.path}/${id}`);
      onClose();
    }
  };

  const allResults = data
    ? Object.entries(data).flatMap(([type, items]) =>
        (items as Array<{ id: number; title?: string; name?: string; entryDate?: Date }>).map((item) => ({
          type,
          ...item,
          displayTitle: item.title || item.name || (item.entryDate ? `Journal - ${item.entryDate}` : "Untitled"),
        }))
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 bg-[#0a0a12] border border-[#1a1a2e] rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a2e]">
          <Search className="w-5 h-5 text-[#64748b]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across your vault..."
            className="flex-1 bg-transparent text-[#e2e8f0] placeholder-[#64748b] text-sm outline-none"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-[#5eead4] animate-spin" />}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-white/[0.05] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim().length === 0 && (
            <div className="px-4 py-8 text-center text-[#64748b] text-sm">
              Type to search across notes, projects, snippets, files, and more...
            </div>
          )}

          {query.trim().length > 0 && allResults.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-[#64748b] text-sm">
              No results found for "{query}"
            </div>
          )}

          {allResults.map((result, index) => {
            const config = typeConfig[result.type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <button
                key={`${result.type}-${result.id}-${index}`}
                onClick={() => handleResultClick(result.type, result.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e2e8f0] truncate">{result.displayTitle}</p>
                  <p className="text-xs text-[#64748b] capitalize">{config.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#1a1a2e] text-[10px] text-[#64748b]">
          <span>{allResults.length} results</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}

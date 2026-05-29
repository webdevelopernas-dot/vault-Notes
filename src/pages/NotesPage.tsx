import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Archive,
  MoreVertical,
  Loader2,
  X,
} from "lucide-react";

export function NotesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.note.list.useQuery({
    search: search || undefined,
    isArchived: showArchived || undefined,
    limit: 50,
  });

  const togglePin = trpc.note.togglePin.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
  });
  const toggleArchive = trpc.note.toggleArchive.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
  });
  const deleteNote = trpc.note.delete.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
  });

  const notes = data?.items ?? [];
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#5eead4]" />
            Notes
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data?.total ?? 0} notes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              showArchived ? "bg-[#fbbf24]/10 text-[#fbbf24]" : "bg-white/[0.03] text-[#64748b] hover:text-[#e2e8f0]"
            }`}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/notes/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-[#5eead4] animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-[#2a2a3e] mb-3" />
          <p className="text-[#64748b] text-sm">{showArchived ? "No archived notes" : "No notes yet"}</p>
          {!showArchived && (
            <button
              onClick={() => navigate("/notes/new")}
              className="mt-3 text-[#5eead4] text-sm hover:underline"
            >
              Create your first note
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[#fbbf24] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => navigate(`/notes/${note.id}`)}
                    onTogglePin={() => togglePin.mutate({ id: note.id })}
                    onToggleArchive={() => toggleArchive.mutate({ id: note.id })}
                    onDelete={() => deleteNote.mutate({ id: note.id })}
                  />
                ))}
              </div>
            </div>
          )}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h3 className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2">
                  Others
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => navigate(`/notes/${note.id}`)}
                    onTogglePin={() => togglePin.mutate({ id: note.id })}
                    onToggleArchive={() => toggleArchive.mutate({ id: note.id })}
                    onDelete={() => deleteNote.mutate({ id: note.id })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onClick,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: {
  note: { id: number; title: string; content: string | null; tags: string[] | null; isPinned: boolean | null; isArchived: boolean | null; updatedAt: Date };
  onClick: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border">
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start gap-2 mb-2">
          {note.isPinned && <Pin className="w-3 h-3 text-[#fbbf24] flex-shrink-0 mt-1" />}
          <h3 className="text-sm font-medium text-[#e2e8f0] line-clamp-1 flex-1">{note.title}</h3>
        </div>
        <p className="text-xs text-[#64748b] line-clamp-3 mb-3">
          {note.content?.slice(0, 200).replace(/[#*_`]/g, "") || "No content"}
        </p>
        <div className="flex items-center gap-2">
          {(note.tags as string[] | null)?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.05] text-[#64748b]">
              {tag}
            </span>
          ))}
          <span className="text-[10px] text-[#64748b] ml-auto">
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </button>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="w-7 h-7 rounded-lg bg-[#0a0a12] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0]"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 w-36 bg-[#0a0a12] border border-[#1a1a2e] rounded-xl shadow-xl z-10 py-1">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-xs text-[#e2e8f0] hover:bg-white/[0.03] flex items-center gap-2"
            >
              <Pin className="w-3 h-3" /> {note.isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleArchive(); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-xs text-[#e2e8f0] hover:bg-white/[0.03] flex items-center gap-2"
            >
              <Archive className="w-3 h-3" /> {note.isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/[0.03] flex items-center gap-2"
            >
              <X className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

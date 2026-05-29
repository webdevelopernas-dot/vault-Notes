import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Bookmark,
  Plus,
  Search,
  Star,
  Loader2,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";

export function BookmarksPage() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.bookmark.list.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const createBookmark = trpc.bookmark.create.useMutation({
    onSuccess: () => {
      utils.bookmark.list.invalidate();
      setNewTitle("");
      setNewUrl("");
      setNewDescription("");
      setNewCategory("");
      setShowAddForm(false);
    },
  });

  const toggleFavorite = trpc.bookmark.toggleFavorite.useMutation({
    onSuccess: () => utils.bookmark.list.invalidate(),
  });

  const deleteBookmark = trpc.bookmark.delete.useMutation({
    onSuccess: () => utils.bookmark.list.invalidate(),
  });

  const handleAdd = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    createBookmark.mutate({
      title: newTitle,
      url: newUrl,
      description: newDescription || undefined,
      category: newCategory || undefined,
    });
  };

  const bookmarks = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-[#60a5fa]" />
            Bookmarks
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data?.total ?? 0} bookmarks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full sm:w-44 pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
          </div>
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
            <h3 className="text-sm font-medium text-[#e2e8f0]">New Bookmark</h3>
            <button onClick={() => setShowAddForm(false)} className="text-[#64748b] hover:text-[#e2e8f0]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Bookmark title..."
              className="w-full px-4 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                className="flex-1 px-4 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#94a3b8] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
              />
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category"
                className="w-28 px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none"
              />
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() || !newUrl.trim()}
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
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="w-12 h-12 text-[#2a2a3e] mb-3" />
          <p className="text-[#64748b] text-sm">No bookmarks yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border group"
            >
              <div className="flex items-start justify-between mb-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#5eead4]/10 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-[#5eead4]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#e2e8f0] truncate hover:text-[#5eead4] transition-colors">
                    {bookmark.title}
                  </h3>
                </a>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => toggleFavorite.mutate({ id: bookmark.id })}
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      bookmark.isFavorite ? "text-[#fbbf24]" : "text-[#64748b] hover:text-[#fbbf24]"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={bookmark.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => deleteBookmark.mutate({ id: bookmark.id })}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#64748b] truncate mb-2">{bookmark.url}</p>
              {bookmark.description && (
                <p className="text-xs text-[#94a3b8] line-clamp-2 mb-2">{bookmark.description}</p>
              )}
              <div className="flex items-center gap-2">
                {bookmark.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#64748b]">
                    {bookmark.category}
                  </span>
                )}
                {(bookmark.tags as string[] | null)?.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.05] text-[#64748b]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

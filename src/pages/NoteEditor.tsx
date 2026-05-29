import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Save,
  Pin,
  Archive,
  Loader2,
  Eye,
  Edit3,
  Tag,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const noteId = id && id !== "new" ? parseInt(id) : null;
  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const { data: existingNote, isLoading } = trpc.note.getById.useQuery(
    { id: noteId! },
    { enabled: !!noteId }
  );

  const createNote = trpc.note.create.useMutation({
    onSuccess: (data) => {
      utils.note.list.invalidate();
      navigate(`/notes/${data.id}`, { replace: true });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      utils.note.getById.invalidate({ id: noteId! });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  // Load existing note
  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content ?? "");
      setTags((existingNote.tags as string[] | null) ?? []);
    }
  }, [existingNote]);

  // Auto-save
  const save = useCallback(() => {
    if (!title.trim()) return;
    setSaveStatus("saving");
    if (noteId) {
      updateNote.mutate({ id: noteId, title, content, tags });
    } else {
      createNote.mutate({ title, content, tags });
    }
  }, [title, content, tags, noteId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title.trim() && (noteId || content.trim())) {
        save();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [title, content, tags, save]);

  const togglePin = trpc.note.togglePin.useMutation({
    onSuccess: () => {
      utils.note.getById.invalidate({ id: noteId! });
      utils.note.list.invalidate();
    },
  });

  const toggleArchive = trpc.note.toggleArchive.useMutation({
    onSuccess: () => {
      utils.note.getById.invalidate({ id: noteId! });
      utils.note.list.invalidate();
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-[#5eead4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/notes")}
            className="w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {noteId && (
            <>
              <button
                onClick={() => togglePin.mutate({ id: noteId })}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  existingNote?.isPinned
                    ? "bg-[#fbbf24]/10 text-[#fbbf24]"
                    : "bg-white/[0.03] text-[#64748b] hover:text-[#e2e8f0]"
                }`}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleArchive.mutate({ id: noteId })}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  existingNote?.isArchived
                    ? "bg-[#fbbf24]/10 text-[#fbbf24]"
                    : "bg-white/[0.03] text-[#64748b] hover:text-[#e2e8f0]"
                }`}
              >
                <Archive className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
              isPreview
                ? "bg-[#5eead4]/10 text-[#5eead4]"
                : "bg-white/[0.03] text-[#64748b] hover:text-[#e2e8f0]"
            }`}
          >
            {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || saveStatus === "saving"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors disabled:opacity-50"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveStatus === "saved" ? (
              <Save className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveStatus === "saved" ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="w-full bg-transparent text-2xl font-semibold text-[#e2e8f0] placeholder-[#2a2a3e] outline-none"
      />

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="w-4 h-4 text-[#64748b]" />
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#5eead4]/10 text-[#5eead4]"
          >
            {tag}
            <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">&times;</button>
          </span>
        ))}
        <div className="flex items-center">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="+ Add tag"
            className="w-20 bg-transparent text-xs text-[#64748b] placeholder-[#2a2a3e] outline-none"
          />
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="min-h-[50vh]">
        {isPreview ? (
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#e2e8f0] prose-p:text-[#94a3b8] prose-a:text-[#5eead4] prose-strong:text-[#e2e8f0] prose-code:text-[#5eead4] prose-pre:bg-[#0a0a12]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "*Start typing to see preview*"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing in Markdown...\n\n# Heading\n**Bold text**\n- List item\n\n```code```"
            className="w-full h-[60vh] bg-transparent text-sm text-[#94a3b8] placeholder-[#2a2a3e] outline-none resize-none font-mono leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}

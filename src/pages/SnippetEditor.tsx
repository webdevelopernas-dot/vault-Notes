import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Save,
  Loader2,
  Tag,
} from "lucide-react";

const languages = ["javascript", "typescript", "python", "html", "css", "sql", "react", "php", "powershell", "java", "go", "rust", "other"];

export function SnippetEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const snippetId = id && id !== "new" ? parseInt(id) : null;
  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: existingSnippet, isLoading } = trpc.snippet.getById.useQuery(
    { id: snippetId! },
    { enabled: !!snippetId }
  );

  const createSnippet = trpc.snippet.create.useMutation({
    onSuccess: (data) => {
      utils.snippet.list.invalidate();
      navigate(`/snippets/${data.id}`, { replace: true });
    },
  });

  const updateSnippet = trpc.snippet.update.useMutation({
    onSuccess: () => {
      utils.snippet.getById.invalidate({ id: snippetId! });
      utils.snippet.list.invalidate();
    },
  });

  useEffect(() => {
    if (existingSnippet) {
      setTitle(existingSnippet.title);
      setCode(existingSnippet.code);
      setLanguage(existingSnippet.language);
      setDescription(existingSnippet.description ?? "");
      setTags((existingSnippet.tags as string[] | null) ?? []);
    }
  }, [existingSnippet]);

  const handleSave = () => {
    if (!title.trim() || !code.trim()) return;
    if (snippetId) {
      updateSnippet.mutate({ id: snippetId, title, code, language, description, tags });
    } else {
      createSnippet.mutate({ title, code, language, description, tags });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/snippets")}
          className="w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || !code.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {snippetId ? "Save" : "Create"}
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Snippet title..."
        className="w-full bg-transparent text-2xl font-semibold text-[#e2e8f0] placeholder-[#2a2a3e] outline-none"
      />

      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
        >
          {languages.map((l) => (
            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="w-4 h-4 text-[#64748b]" />
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#5eead4]/10 text-[#5eead4]">
            {tag}
            <button onClick={() => setTags(tags.filter((t) => t !== tag))}>&times;</button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
          placeholder="+ Add tag"
          className="w-20 bg-transparent text-xs text-[#64748b] placeholder-[#2a2a3e] outline-none"
        />
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here..."
        className="w-full h-[60vh] bg-[#0a0a12] text-sm text-[#94a3b8] font-mono p-4 rounded-2xl border border-[#1a1a2e] outline-none focus:border-[#5eead4]/30 resize-none leading-relaxed"
      />
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Code2,
  Plus,
  Search,
  Star,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

const languages = ["javascript", "typescript", "python", "html", "css", "sql", "react", "php", "powershell", "other"];

export function SnippetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.snippet.list.useQuery({
    search: search || undefined,
    language: language || undefined,
    limit: 50,
  });

  const toggleFavorite = trpc.snippet.toggleFavorite.useMutation({
    onSuccess: () => utils.snippet.list.invalidate(),
  });

  const snippets = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Code2 className="w-6 h-6 text-[#a78bfa]" />
            Code Snippets
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data?.total ?? 0} snippets</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snippets..."
              className="w-full sm:w-48 pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] outline-none"
          >
            <option value="">All</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={() => navigate("/snippets/new")}
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
      ) : snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Code2 className="w-12 h-12 text-[#2a2a3e] mb-3" />
          <p className="text-[#64748b] text-sm">No snippets yet</p>
          <button onClick={() => navigate("/snippets/new")} className="mt-3 text-[#5eead4] text-sm hover:underline">
            Create your first snippet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onClick={() => navigate(`/snippets/${snippet.id}`)}
              onToggleFavorite={() => toggleFavorite.mutate({ id: snippet.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SnippetCard({
  snippet,
  onClick,
  onToggleFavorite,
}: {
  snippet: { id: number; title: string; code: string; language: string; isFavorite: boolean | null; description: string | null };
  onClick: () => void;
  onToggleFavorite: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-2xl bg-[#050509] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[#e2e8f0]">{snippet.title}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5eead4]/10 text-[#5eead4]">
            {snippet.language}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#5eead4] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              snippet.isFavorite ? "text-[#fbbf24]" : "text-[#64748b] hover:text-[#fbbf24]"
            }`}
          >
            <Star className="w-3.5 h-3.5" fill={snippet.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      {snippet.description && (
        <p className="text-xs text-[#64748b] mb-2">{snippet.description}</p>
      )}
      <pre className="text-xs text-[#94a3b8] font-mono bg-[#0a0a12] p-3 rounded-xl overflow-x-auto line-clamp-4">
        <code>{snippet.code}</code>
      </pre>
    </button>
  );
}

import { useState, useRef } from "react";
import { trpc } from "@/providers/trpc";
import {
  FileArchive,
  Upload,
  Search,
  Star,
  Loader2,
  FileText,
  Image,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";

const fileTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  document: FileText,
};

export function FilesPage() {
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.file.list.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const createFile = trpc.file.create.useMutation({
    onSuccess: () => {
      utils.file.list.invalidate();
      setIsUploading(false);
    },
  });

  const toggleFavorite = trpc.file.toggleFavorite.useMutation({
    onSuccess: () => utils.file.list.invalidate(),
  });

  const deleteFile = trpc.file.delete.useMutation({
    onSuccess: () => utils.file.list.invalidate(),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Read file as data URL for demo (in production, upload to storage)
    const reader = new FileReader();
    reader.onloadend = () => {
      const fileType = file.type.split("/")[0] === "image" ? "image" :
        file.type.includes("pdf") ? "pdf" :
        file.type.includes("spreadsheet") || file.type.includes("excel") ? "spreadsheet" :
        file.type.includes("document") || file.type.includes("word") ? "document" : "other";

      createFile.mutate({
        name: file.name,
        originalName: file.name,
        fileType,
        mimeType: file.type,
        size: file.size,
        url: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const files = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
            <FileArchive className="w-6 h-6 text-[#f472b6]" />
            Files
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data?.total ?? 0} files</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full sm:w-56 pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-[#5eead4] animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileArchive className="w-12 h-12 text-[#2a2a3e] mb-3" />
          <p className="text-[#64748b] text-sm">No files yet</p>
          <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-[#5eead4] text-sm hover:underline">
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {files.map((file) => {
            const Icon = fileTypeIcons[file.fileType ?? "document"] ?? FileText;
            return (
              <div
                key={file.id}
                className="group relative p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] hover:border-[#5eead4]/20 transition-all card-hover glow-border"
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-10 h-10 text-[#64748b]" />
                  <p className="text-xs text-[#e2e8f0] text-center truncate w-full">{file.name}</p>
                  <p className="text-[10px] text-[#64748b]">
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => toggleFavorite.mutate({ id: file.id })}
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      file.isFavorite ? "text-[#fbbf24]" : "text-[#64748b] hover:text-[#fbbf24]"
                    }`}
                  >
                    <Star className="w-3 h-3" fill={file.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => deleteFile.mutate({ id: file.id })}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748b] hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

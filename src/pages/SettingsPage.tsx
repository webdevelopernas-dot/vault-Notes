import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Settings,
  User,
  Github,
  Save,
  Loader2,
  Check,
  AlertCircle,
  LogOut,
} from "lucide-react";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();

  // GitHub Config
  const { data: githubConfig } = trpc.github.getConfig.useQuery();
  const [repoOwner, setRepoOwner] = useState(githubConfig?.repoOwner ?? "");
  const [repoName, setRepoName] = useState(githubConfig?.repoName ?? "");
  const [token, setToken] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const saveGithubConfig = trpc.github.saveConfig.useMutation({
    onSuccess: () => {
      utils.github.getConfig.invalidate();
      setTestResult({ success: true, message: "GitHub config saved" });
    },
  });

  const testConnection = trpc.github.testConnection.useMutation({
    onSuccess: (result) => setTestResult(result),
  });

  const handleSaveGithub = () => {
    if (!repoOwner.trim() || !repoName.trim() || !token.trim()) return;
    saveGithubConfig.mutate({ repoOwner, repoName, token });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
        <Settings className="w-6 h-6 text-[#5eead4]" />
        Settings
      </h1>

      {/* Profile Section */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-[#1a1a2e]">
        <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#5eead4]" />
          Profile
        </h2>
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-14 h-14 rounded-full" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#5eead4]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#5eead4]" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#e2e8f0]">{user?.name || "User"}</p>
            <p className="text-xs text-[#64748b]">{user?.email || ""}</p>
            <p className="text-[10px] text-[#64748b] mt-1 capitalize">Role: {user?.role ?? "user"}</p>
          </div>
        </div>
      </div>

      {/* GitHub Integration */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-[#1a1a2e]">
        <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Github className="w-4 h-4 text-[#5eead4]" />
          GitHub Integration
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#64748b] mb-1 block">Repository Owner</label>
              <input
                type="text"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
              />
            </div>
            <div>
              <label className="text-xs text-[#64748b] mb-1 block">Repository Name</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-vault"
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#64748b] mb-1 block">Personal Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#1a1a2e] text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-[#5eead4]/30"
            />
            <p className="text-[10px] text-[#64748b] mt-1">
              Create a token at GitHub Settings → Developer settings → Personal access tokens
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveGithub}
              disabled={!repoOwner.trim() || !repoName.trim() || !token.trim() || saveGithubConfig.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors disabled:opacity-50"
            >
              {saveGithubConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Config
            </button>
            {githubConfig?.isActive && (
              <button
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] text-[#e2e8f0] text-sm hover:bg-white/[0.05] transition-colors"
              >
                {testConnection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Connection"}
              </button>
            )}
          </div>
          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult.success ? "text-[#34d399]" : "text-red-400"}`}>
              {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-[#1a1a2e]">
        <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider mb-4">
          About MyVault
        </h2>
        <div className="space-y-2 text-sm text-[#64748b]">
          <p>MyVault v1.0.0</p>
          <p>Your personal knowledge management system.</p>
          <p>Built with React, Tailwind CSS, tRPC, and Drizzle ORM.</p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
}

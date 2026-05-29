import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050509]">
        <Loader2 className="w-8 h-8 text-[#5eead4] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050509] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#5eead4]/10 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 rounded-md bg-[#5eead4] shadow-[0_0_24px_rgba(94,234,212,0.4)]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#e2e8f0]">MyVault</h1>
          <p className="text-sm text-[#64748b] mt-1">Your personal knowledge vault</p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-[#1a1a2e] liquid-glass">
          <h2 className="text-sm font-medium text-[#e2e8f0] text-center mb-4">Sign in to continue</h2>
          <button
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
            className="w-full py-3 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors border border-[#5eead4]/20"
          >
            Sign in with Kimi
          </button>
          <p className="text-[10px] text-[#64748b] text-center mt-4">
            Secure authentication via Kimi OAuth
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Notes", desc: "Markdown" },
            { label: "Projects", desc: "Track tasks" },
            { label: "Snippets", desc: "Code storage" },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-xl bg-white/[0.02] border border-[#1a1a2e]">
              <p className="text-xs text-[#e2e8f0] font-medium">{f.label}</p>
              <p className="text-[10px] text-[#64748b] mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

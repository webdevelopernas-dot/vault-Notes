import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "./GlobalSearch";
import { GlowingNetworkBackground } from "./GlowingNetworkBackground";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Bell,
  FileArchive,
  Code2,
  Bookmark,
  BookOpen,
  Lightbulb,
  Search,
  Settings,
  LogOut,
  User,
  Plus,
  Home,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FileText, label: "Notes", path: "/notes" },
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: Bell, label: "Reminders", path: "/reminders" },
  { icon: FileArchive, label: "Files", path: "/files" },
  { icon: Code2, label: "Snippets", path: "/snippets" },
  { icon: Bookmark, label: "Bookmarks", path: "/bookmarks" },
  { icon: BookOpen, label: "Journal", path: "/journal" },
  { icon: Lightbulb, label: "Ideas", path: "/ideas" },
];

const bottomNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", action: "search" as const },
  { icon: Plus, label: "Add", action: "add" as const },
  { icon: FolderKanban, label: "Vault", path: "/notes" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsAddMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBottomNav = (item: typeof bottomNavItems[0]) => {
    if (item.action === "search") {
      setIsSearchOpen(true);
    } else if (item.action === "add") {
      setIsAddMenuOpen(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const addMenuItems = [
    { label: "New Note", path: "/notes/new", icon: FileText },
    { label: "New Project", path: "/projects/new", icon: FolderKanban },
    { label: "New Reminder", path: "/reminders/new", icon: Bell },
    { label: "New Snippet", path: "/snippets/new", icon: Code2 },
    { label: "New Bookmark", path: "/bookmarks/new", icon: Bookmark },
    { label: "Journal Entry", path: "/journal/new", icon: BookOpen },
    { label: "New Idea", path: "/ideas/new", icon: Lightbulb },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050509]">
      <GlowingNetworkBackground />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-full bg-[#0a0a12] border-r border-[#1a1a2e] flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-8 h-8 rounded-lg bg-[#5eead4]/10 flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm bg-[#5eead4] shadow-[0_0_12px_rgba(94,234,212,0.5)]" />
          </div>
          <span className="text-lg font-semibold text-[#e2e8f0] tracking-tight">MyVault</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#5eead4]/10 text-[#5eead4] border-l-2 border-[#5eead4]"
                    : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.03]"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 pb-4 space-y-1 border-t border-[#1a1a2e] pt-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.03] w-full transition-all"
          >
            <Search className="w-[18px] h-[18px]" />
            Search
            <kbd className="ml-auto text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-[#64748b]">⌘K</kbd>
          </button>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              location.pathname === "/settings"
                ? "bg-[#5eead4]/10 text-[#5eead4]"
                : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.03]"
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            Settings
          </Link>
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#5eead4]/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-[#5eead4]" />
                </div>
              )}
              <span className="text-sm text-[#e2e8f0] flex-1 truncate">{user.name || "User"}</span>
              <button
                onClick={logout}
                className="text-[#64748b] hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a12]/90 backdrop-blur-md border-b border-[#1a1a2e]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#5eead4]/10 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#5eead4] shadow-[0_0_10px_rgba(94,234,212,0.4)]" />
            </div>
            <span className="text-base font-semibold text-[#e2e8f0]">MyVault</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center text-[#64748b]"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center text-[#64748b]"
            >
              {isMobileMenuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#0a0a12] border-b border-[#1a1a2e] max-h-[70vh] overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    isActive ? "text-[#5eead4] bg-[#5eead4]/10" : "text-[#64748b]"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-[#1a1a2e] px-4 py-3">
              <button onClick={logout} className="flex items-center gap-3 text-sm text-red-400">
                <LogOut className="w-[18px] h-[18px]" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14 pb-20 lg:pb-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a12]/95 backdrop-blur-md border-t border-[#1a1a2e] pb-safe">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleBottomNav(item)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                item.path && location.pathname === item.path
                  ? "text-[#5eead4]"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Global Search Modal */}
      {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}

      {/* Add Menu Modal */}
      {isAddMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsAddMenuOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0a0a12] border border-[#1a1a2e] rounded-t-2xl p-4 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#e2e8f0]">Create New</h3>
              <button
                onClick={() => setIsAddMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-[#64748b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {addMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsAddMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-[#1a1a2e] hover:border-[#5eead4]/30 hover:bg-[#5eead4]/5 transition-all"
                >
                  <item.icon className="w-5 h-5 text-[#5eead4]" />
                  <span className="text-sm text-[#e2e8f0]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

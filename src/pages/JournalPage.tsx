import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Smile,
  Frown,
  Meh,
  Angry,
  Laugh,
  Save,
} from "lucide-react";

const moodConfig = {
  great: { icon: Laugh, color: "#34d399", label: "Great" },
  good: { icon: Smile, color: "#5eead4", label: "Good" },
  neutral: { icon: Meh, color: "#fbbf24", label: "Neutral" },
  bad: { icon: Frown, color: "#fb7185", label: "Bad" },
  terrible: { icon: Angry, color: "#ef4444", label: "Terrible" },
};

export function JournalPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const utils = trpc.useUtils();

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const { data: entry } = trpc.journal.getByDate.useQuery(
    { date: formattedDate },
    { enabled: !!formattedDate }
  );

  const { data: monthEntries } = trpc.journal.list.useQuery(
    { month: currentMonth.getMonth() + 1, year: currentMonth.getFullYear(), limit: 100 }
  );

  const [notes, setNotes] = useState("");
  const [accomplishments, setAccomplishments] = useState("");
  const [tasks, setTasks] = useState("");
  const [reflections, setReflections] = useState("");
  const [mood, setMood] = useState<"great" | "good" | "neutral" | "bad" | "terrible">("neutral");

  // Load entry data when selected
  useState(() => {
    if (entry) {
      setNotes(entry.notes ?? "");
      setAccomplishments(entry.accomplishments ?? "");
      setTasks(entry.tasks ?? "");
      setReflections(entry.reflections ?? "");
      setMood((entry.mood ?? "neutral") as "great" | "good" | "neutral" | "bad" | "terrible");
    }
  });

  const createEntry = trpc.journal.create.useMutation({
    onSuccess: () => {
      utils.journal.getByDate.invalidate({ date: formattedDate });
      utils.journal.list.invalidate();
    },
  });

  const updateEntry = trpc.journal.update.useMutation({
    onSuccess: () => {
      utils.journal.getByDate.invalidate({ date: formattedDate });
    },
  });

  const handleSave = () => {
    if (entry) {
      updateEntry.mutate({ id: entry.id, notes, accomplishments, tasks, reflections, mood });
    } else {
      createEntry.mutate({ entryDate: formattedDate, notes, accomplishments, tasks, reflections, mood });
    }
  };

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();

  const entriesMap = new Map();
  monthEntries?.items.forEach((e) => {
    entriesMap.set(format(new Date(e.entryDate), "yyyy-MM-dd"), e);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#e2e8f0] flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#34d399]" />
          Journal
        </h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5eead4]/10 text-[#5eead4] text-sm font-medium hover:bg-[#5eead4]/20 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Entry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e]">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-medium text-[#e2e8f0]">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-[10px] text-[#64748b] py-1">{d}</div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {calendarDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayEntry = entriesMap.get(dateStr);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    className={`relative w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-[#5eead4] text-[#050509] font-medium"
                        : isToday
                        ? "bg-[#5eead4]/20 text-[#5eead4]"
                        : "text-[#e2e8f0] hover:bg-white/[0.05]"
                    }`}
                  >
                    {format(day, "d")}
                    {dayEntry && (
                      <div
                        className="absolute bottom-0.5 w-1 h-1 rounded-full"
                        style={{ backgroundColor: moodConfig[dayEntry.mood as keyof typeof moodConfig]?.color ?? "#5eead4" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood Selector */}
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e]">
            <h3 className="text-sm font-medium text-[#e2e8f0] mb-3">How was your day?</h3>
            <div className="flex items-center gap-2">
              {(Object.entries(moodConfig) as [string, { icon: React.ElementType; color: string; label: string }][]).map(
                ([key, { icon: Icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => setMood(key as "great" | "good" | "neutral" | "bad" | "terrible")}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      mood === key ? "ring-2" : "opacity-50 hover:opacity-75"
                    }`}
                    style={{
                      backgroundColor: `${color}20`,
                      ringColor: color,
                      ...(mood === key ? { ringColor: color } : {}),
                    }}
                    title={moodConfig[key as keyof typeof moodConfig].label}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Entry Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#1a1a2e]">
            <h3 className="text-sm font-medium text-[#e2e8f0] mb-3">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#64748b] uppercase tracking-wider mb-1 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What happened today?"
                  className="w-full h-24 bg-[#0a0a12] text-sm text-[#94a3b8] p-3 rounded-xl border border-[#1a1a2e] outline-none focus:border-[#5eead4]/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b] uppercase tracking-wider mb-1 block">Accomplishments</label>
                <textarea
                  value={accomplishments}
                  onChange={(e) => setAccomplishments(e.target.value)}
                  placeholder="What did you achieve?"
                  className="w-full h-24 bg-[#0a0a12] text-sm text-[#94a3b8] p-3 rounded-xl border border-[#1a1a2e] outline-none focus:border-[#5eead4]/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b] uppercase tracking-wider mb-1 block">Tasks</label>
                <textarea
                  value={tasks}
                  onChange={(e) => setTasks(e.target.value)}
                  placeholder="What tasks did you work on?"
                  className="w-full h-24 bg-[#0a0a12] text-sm text-[#94a3b8] p-3 rounded-xl border border-[#1a1a2e] outline-none focus:border-[#5eead4]/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b] uppercase tracking-wider mb-1 block">Reflections</label>
                <textarea
                  value={reflections}
                  onChange={(e) => setReflections(e.target.value)}
                  placeholder="Any thoughts or reflections?"
                  className="w-full h-24 bg-[#0a0a12] text-sm text-[#94a3b8] p-3 rounded-xl border border-[#1a1a2e] outline-none focus:border-[#5eead4]/30 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

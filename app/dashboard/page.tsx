"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserTopic, getLastCompletedTopic, getUpcomingSchedule, TOPICS, getTopicLevel } from "@/lib/topics";

const LANGUAGE_LABELS: Record<string, string> = {
  arabic: "Arabic 🇸🇦", english: "English 🇺🇸", spanish: "Spanish 🇪🇸",
  french: "French 🇫🇷", german: "German 🇩🇪", mandarin: "Mandarin 🇨🇳",
  japanese: "Japanese 🇯🇵", portuguese: "Portuguese 🇧🇷", italian: "Italian 🇮🇹",
};

const LEVEL_COLORS = {
  Beginner:     { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)",  text: "#34d399" },
  Intermediate: { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.35)",  text: "#60a5fa" },
  Advanced:     { bg: "rgba(168,85,247,0.15)",  border: "rgba(168,85,247,0.35)",  text: "#c084fc" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface UserData {
  name: string; targetLanguage: string; level: string;
  streak: number; wordsLearned: number; lessonsCompleted: number;
  minutesPracticed: number; currentLevel: number; xp: number;
  completedTopics: string[]; todaysDone: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [undoing, setUndoing] = useState(false);
  const router = useRouter();

  async function handleUndoLesson() {
    if (undoing) return;
    setUndoing(true);
    try {
      await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ undoDailyLesson: true }),
      });
      // Refresh user data
      const updated = await fetch("/api/progress").then(r => r.json());
      setUser(updated);
    } finally {
      setUndoing(false);
    }
  }

  useEffect(() => {
    fetch("/api/progress").then(r => r.json()).then(setUser).catch(console.error);
  }, []);

  const langName = user ? (LANGUAGE_LABELS[user.targetLanguage] || user.targetLanguage) : "Your Language";
  const xpToNext = user ? 500 - (user.xp % 500) : 500;
  const xpPercent = user ? ((user.xp % 500) / 500) * 100 : 0;

  // Topic logic: personal curriculum based on user's lesson count
  // When done today → lessonsCompleted was already incremented, so show the COMPLETED topic
  // When not done  → show the NEXT topic to tackle
  const todayTopic = user
    ? (user.todaysDone ? getLastCompletedTopic(user.lessonsCompleted) : getUserTopic(user.lessonsCompleted))
    : "";

  // Schedule: when done → start from completed lesson (so today column shows what was done)
  //           when not done → start from current lesson
  const scheduleStart = user
    ? (user.todaysDone ? user.lessonsCompleted - 1 : user.lessonsCompleted)
    : 0;
  const schedule = user ? getUpcomingSchedule(scheduleStart, 7) : [];

  // Curriculum progress
  const totalTopics = TOPICS.length;
  const currentIdx = user ? user.lessonsCompleted % totalTopics : 0;
  const curriculumPercent = (currentIdx / totalTopics) * 100;
  const curriculumLevel = getTopicLevel(currentIdx);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-float">🌐</div>
          <div className="flex items-center justify-center gap-2">
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  const levelColors = LEVEL_COLORS[curriculumLevel];

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <span className="font-bold gradient-text">LinguaExec</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/conversation" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Conversation</Link>
            <Link href="/what-to-say" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Quick Reply</Link>
            <Link href="/scenarios" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Scenarios</Link>
            <Link href="/dictionary" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Dictionary</Link>
            <Link href="/leaderboard" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Leaderboard</Link>
            <Link href="/settings" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Settings</Link>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">Good {getTimeOfDay()}, {user.name} 👋</h1>
          <p className="text-slate-400">Learning {langName} · {user.level} level</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "🔥", label: "Day Streak", value: `${user.streak}` },
            { icon: "📚", label: "Words Saved", value: `${user.wordsLearned}` },
            { icon: "✅", label: "Total Lessons", value: `${user.lessonsCompleted}` },
            { icon: "⏱️", label: "Minutes", value: `${user.minutesPracticed}` },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black gradient-text">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP bar */}
        <div className="glass rounded-2xl p-6 mb-6" style={{ border: "1px solid rgba(16,185,129,0.15)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-slate-400">Level {user.currentLevel}</span>
              <h3 className="font-bold text-lg gradient-text">{getLevelTitle(user.currentLevel)}</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">{xpToNext} XP to next level</div>
              <div className="text-2xl font-black gradient-text">{user.xp} XP</div>
            </div>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-2 rounded-full transition-all duration-1000"
              style={{ width: `${xpPercent}%`, background: "linear-gradient(90deg, #10b981, #059669)" }} />
          </div>
        </div>

        {/* Curriculum progress bar */}
        <div className="glass rounded-2xl p-5 mb-8" style={{ border: `1px solid ${levelColors.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: levelColors.bg, color: levelColors.text, border: `1px solid ${levelColors.border}` }}>
                {curriculumLevel}
              </span>
              <span className="text-sm text-slate-300 font-medium">Curriculum Progress</span>
            </div>
            <span className="text-xs text-slate-500">Lesson {currentIdx + 1} of {totalTopics}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${curriculumPercent}%`, background: `linear-gradient(90deg, ${levelColors.text}, ${levelColors.text}88)` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-600">Beginner</span>
            <span className="text-xs text-slate-600">Intermediate</span>
            <span className="text-xs text-slate-600">Advanced</span>
          </div>
        </div>

        {/* Today's lesson + quick actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {user.todaysDone ? (
            // Already done today
            <div className="md:col-span-2 glass rounded-2xl p-8" style={{ border: "1px solid rgba(16,185,129,0.3)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Today&apos;s Lesson</div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-black" style={{ background: "#10b981" }}>✓ Done</span>
                  </div>
                  <h2 className="text-xl font-black">{todayTopic}</h2>
                  <p className="text-slate-400 text-sm mt-1">In {langName} · Great job today! 🎉</p>
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>✅</div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Link href={`/lesson?topic=${encodeURIComponent(todayTopic)}`}
                  className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">
                  Review today&apos;s lesson →
                </Link>
                <span className="text-slate-700 text-xs">|</span>
                <span className="text-sm text-slate-500">
                  Next up: <span className="text-slate-300">{getUserTopic(user.lessonsCompleted)}</span>
                </span>
                <span className="text-slate-700 text-xs">|</span>
                <button onClick={handleUndoLesson} disabled={undoing}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40">
                  {undoing ? "Undoing…" : "Marked by mistake? Undo"}
                </button>
              </div>
            </div>
          ) : (
            // Not done yet
            <Link href={`/lesson?topic=${encodeURIComponent(todayTopic)}`}
              className="md:col-span-2 glass rounded-2xl p-8 block glass-hover group"
              style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Today&apos;s Lesson</div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: levelColors.bg, color: levelColors.text, border: `1px solid ${levelColors.border}` }}>
                      {curriculumLevel}
                    </span>
                  </div>
                  <h2 className="text-xl font-black">{todayTopic}</h2>
                  <p className="text-slate-400 text-sm mt-1">In {langName} · ~10 min · Lesson {currentIdx + 1}/{totalTopics}</p>
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>📖</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-400 group-hover:gap-3 transition-all">
                Start lesson <span>→</span>
              </div>
            </Link>
          )}

          {/* Quick actions */}
          <div className="space-y-3">
            <Link href="/what-to-say" className="glass rounded-xl p-4 flex items-center gap-4 glass-hover block"
              style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>💬</div>
              <div><div className="font-semibold text-sm">What Should I Say?</div><div className="text-xs text-slate-500">Get instant phrase help</div></div>
            </Link>
            <Link href="/conversation" className="glass rounded-xl p-4 flex items-center gap-4 glass-hover block">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)" }}>🗣️</div>
              <div><div className="font-semibold text-sm">AI Conversation</div><div className="text-xs text-slate-500">Practice speaking</div></div>
            </Link>
            <Link href="/scenarios" className="glass rounded-xl p-4 flex items-center gap-4 glass-hover block">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)" }}>💼</div>
              <div><div className="font-semibold text-sm">Business Scenarios</div><div className="text-xs text-slate-500">Role-play situations</div></div>
            </Link>
          </div>
        </div>

        {/* Upcoming schedule */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-300">Upcoming Schedule</h3>
            <span className="text-xs text-slate-500">One lesson per day</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {schedule.map(({ date, topic, isToday, lessonNumber }) => {
              const tIdx = TOPICS.indexOf(topic);
              const lv = getTopicLevel(tIdx);
              const lc = LEVEL_COLORS[lv];
              const isDone = isToday && user.todaysDone;
              return (
                <Link key={date.toISOString()} href={`/lesson?topic=${encodeURIComponent(topic)}`}
                  className="text-center group"
                  style={{ pointerEvents: isToday && !user.todaysDone ? "auto" : "none" }}>
                  <div className="text-xs text-slate-500 mb-1">{DAY_NAMES[date.getDay()]}</div>
                  <div className="text-xs text-slate-600 mb-2">{date.getDate()}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 transition-all ${isToday ? "ring-2" : ""}`}
                    style={isDone
                      ? { background: "linear-gradient(135deg, #10b981, #059669)", color: "black", outline: "2px solid #10b981", outlineOffset: "2px" }
                      : isToday
                        ? { background: lc.bg, color: lc.text, outline: `2px solid ${lc.text}`, outlineOffset: "2px" }
                        : { background: "rgba(255,255,255,0.04)", color: "#334155" }}>
                    {isDone ? "✓" : lessonNumber}
                  </div>
                  <div className={`leading-tight ${isToday ? "text-slate-300 font-medium" : "text-slate-600"}`}
                    style={{ fontSize: "9px" }}>
                    {topic.split(" ")[0]}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Create Your Own Session */}
        <div className="glass rounded-2xl p-6" style={{ border: "1px solid rgba(168,85,247,0.2)" }}>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>✨</div>
            <div>
              <h3 className="font-bold text-white text-lg">Create Your Own Session</h3>
              <p className="text-slate-400 text-sm mt-0.5">Enter any topic and get a full AI-generated lesson — vocabulary, phrases, grammar &amp; quiz</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && customTopic.trim()) router.push(`/custom-lesson?topic=${encodeURIComponent(customTopic.trim())}`); }}
              placeholder="e.g. Job interviews, Medical appointments, Airport…"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={() => { if (customTopic.trim()) router.push(`/custom-lesson?topic=${encodeURIComponent(customTopic.trim())}`); }}
              disabled={!customTopic.trim()}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
              Generate →
            </button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {["Job Interview", "At the Doctor", "Airport & Travel", "Shopping", "Phone Calls"].map((s) => (
              <button key={s} onClick={() => setCustomTopic(s)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#c084fc" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getLevelTitle(level: number) {
  const titles = ["Newcomer", "Beginner", "Explorer", "Conversant", "Proficient", "Advanced", "Expert", "Master", "Executive Polyglot"];
  return titles[Math.min(level - 1, titles.length - 1)];
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const LESSON_TOPICS = ["Greetings & Introductions", "Business Meetings", "Travel & Dining", "Negotiations", "Presentations", "Small Talk", "Emails & Writing"];
const LANGUAGE_LABELS: Record<string, string> = { arabic: "Arabic 🇸🇦", english: "English 🇺🇸", spanish: "Spanish 🇪🇸", french: "French 🇫🇷", german: "German 🇩🇪", mandarin: "Mandarin 🇨🇳", japanese: "Japanese 🇯🇵", portuguese: "Portuguese 🇧🇷", italian: "Italian 🇮🇹" };

interface UserData {
  name: string; targetLanguage: string; level: string;
  streak: number; wordsLearned: number; lessonsCompleted: number;
  minutesPracticed: number; currentLevel: number; xp: number;
  completedTopics: string[];
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetch("/api/progress").then(r => r.json()).then(setUser).catch(console.error);
  }, []);

  const langName = user ? (LANGUAGE_LABELS[user.targetLanguage] || user.targetLanguage) : "Your Language";
  const xpToNext = user ? 500 - (user.xp % 500) : 500;
  const xpPercent = user ? ((user.xp % 500) / 500) * 100 : 0;

  // Find the next uncompleted topic
  const completedTopics = user?.completedTopics ?? [];
  const nextTopic = LESSON_TOPICS.find(t => !completedTopics.includes(t)) ?? LESSON_TOPICS[0];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-float">🌐</div>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

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
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-black mb-1">Good {getTimeOfDay()}, {user.name} 👋</h1>
          <p className="text-slate-400">Learning {langName} · {user.level} level</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "🔥", label: "Day Streak", value: `${user.streak}` },
            { icon: "📚", label: "Words Learned", value: `${user.wordsLearned}` },
            { icon: "✅", label: "Lessons Done", value: `${completedTopics.length}/${LESSON_TOPICS.length}` },
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
        <div className="glass rounded-2xl p-6 mb-8" style={{ border: "1px solid rgba(16,185,129,0.15)" }}>
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
            <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${xpPercent}%`, background: "linear-gradient(90deg, #10b981, #059669)" }} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Next lesson highlight */}
          <Link href={`/lesson?topic=${encodeURIComponent(nextTopic)}`}
            className="md:col-span-2 glass rounded-2xl p-8 block glass-hover group"
            style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wider">
                  {completedTopics.includes(nextTopic) ? "Review Lesson" : "Up Next"}
                </div>
                <h2 className="text-xl font-black">{nextTopic}</h2>
                <p className="text-slate-400 text-sm mt-1">In {langName} · ~10 min</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>📖</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-400 group-hover:gap-3 transition-all">
              Start lesson <span>→</span>
            </div>
          </Link>

          {/* Quick actions */}
          <div className="space-y-3">
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
            <Link href="/dictionary" className="glass rounded-xl p-4 flex items-center gap-4 glass-hover block">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}>📖</div>
              <div>
                <div className="font-semibold text-sm">My Dictionary</div>
                <div className="text-xs text-slate-500">{user.wordsLearned} words saved</div>
              </div>
            </Link>
          </div>
        </div>

        {/* All lessons */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-300">All Lessons</h3>
            <span className="text-xs text-slate-500">{completedTopics.length}/{LESSON_TOPICS.length} completed</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {LESSON_TOPICS.map((topic, i) => {
              const done = completedTopics.includes(topic);
              const isNext = topic === nextTopic && !done;
              return (
                <Link key={topic} href={`/lesson?topic=${encodeURIComponent(topic)}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all group"
                  style={{
                    background: done ? "rgba(16,185,129,0.08)" : isNext ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.03)",
                    border: done ? "1px solid rgba(16,185,129,0.25)" : isNext ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={done ? { background: "linear-gradient(135deg, #10b981, #059669)", color: "black" } : { background: "rgba(255,255,255,0.08)", color: "#64748b" }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${done ? "text-slate-300" : "text-slate-400"}`}>{topic}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{done ? "Completed · tap to review" : isNext ? "Up next" : "Locked until previous done"}</div>
                  </div>
                  {isNext && <span className="text-xs text-emerald-400 font-semibold flex-shrink-0">Start →</span>}
                  {done && <span className="text-xs text-slate-600 flex-shrink-0">Review</span>}
                </Link>
              );
            })}
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

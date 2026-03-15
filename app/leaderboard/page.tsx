"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderUser { id: string; name: string; targetLanguage: string; currentLevel: number; xp: number; streak: number; }

const LANGUAGE_LABELS: Record<string, string> = { arabic: "Arabic 🇸🇦", english: "English 🇺🇸", spanish: "Spanish 🇪🇸" };
const LEVEL_TITLES = ["Newcomer", "Beginner", "Explorer", "Conversant", "Proficient", "Advanced", "Expert", "Master", "Executive Polyglot"];

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(data => { setUsers(data.users || []); setCurrentUserId(data.currentUserId || ""); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">← Dashboard</Link>
          <span className="font-bold gradient-text">🏆 Leaderboard</span>
          <div className="text-xs text-slate-500">{users.length} learners</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Global Leaderboard</h1>
          <p className="text-slate-400">Top learners ranked by XP earned</p>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="flex justify-center gap-2"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>
          </div>
        ) : users.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="text-4xl mb-4">🌍</div>
            <p className="text-slate-400">No learners yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, i) => (
              <div key={user.id}
                className="glass rounded-xl p-5 flex items-center gap-4"
                style={user.id === currentUserId
                  ? { background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)" }
                  : { border: "1px solid rgba(255,255,255,0.06)" }}>
                
                {/* Rank */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: i < 3 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-slate-500">#{i + 1}</span>}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">
                    {user.name}
                    {user.id === currentUserId && <span className="ml-2 text-xs text-emerald-400 font-normal">(you)</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {LANGUAGE_LABELS[user.targetLanguage] || user.targetLanguage} · {LEVEL_TITLES[Math.min(user.currentLevel - 1, LEVEL_TITLES.length - 1)]}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <div className="font-black gradient-text text-lg">{user.xp.toLocaleString()} XP</div>
                  <div className="text-xs text-slate-500">🔥 {user.streak} day streak</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const LANG_CODES: Record<string, string> = {
  arabic: "ar", english: "en", spanish: "es", french: "fr",
  german: "de", mandarin: "zh-CN", japanese: "ja", portuguese: "pt", italian: "it",
};

interface SavedWord {
  id: string; word: string; pronunciation: string; translation: string;
  example?: string; language: string; type: string; topic: string; learnedAt: string;
}

function SpeakButton({ text, lang }: { text: string; lang: string }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback(async () => {
    if (speaking) return;
    setSpeaking(true);
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch { setSpeaking(false); }
  }, [text, lang, speaking]);

  return (
    <button onClick={speak} title="Listen"
      className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
      style={{ width: 32, height: 32,
        background: speaking ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.1)",
        border: speaking ? "1px solid #10b981" : "1px solid rgba(16,185,129,0.25)" }}>
      {speaking ? (
        <span className="flex items-end gap-[2px] h-3">
          {[1,2,3].map(i => <span key={i} className="w-[2px] rounded-full bg-emerald-400"
            style={{ height: `${i*3+3}px`, animation: `bounce ${0.4+i*0.1}s ease-in-out infinite alternate` }} />)}
        </span>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      )}
    </button>
  );
}

export default function DictionaryPage() {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "word" | "phrase">("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [userName, setUserName] = useState("");
  const [userLang, setUserLang] = useState("english");

  useEffect(() => {
    Promise.all([
      fetch("/api/dictionary").then(r => r.json()),
      fetch("/api/progress").then(r => r.json()),
    ]).then(([dict, user]) => {
      setWords(dict);
      setUserName(user.name || "");
      setUserLang(user.targetLanguage || "english");
    }).finally(() => setLoading(false));
  }, []);

  const topics = Array.from(new Set(words.map(w => w.topic).filter(Boolean)));
  const langCode = LANG_CODES[userLang] ?? "en";

  const filtered = words.filter(w => {
    const matchSearch = !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.translation.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || w.type === filterType;
    const matchTopic = filterTopic === "all" || w.topic === filterTopic;
    return matchSearch && matchType && matchTopic;
  });

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <style>{`@keyframes bounce { from { transform: scaleY(0.5); } to { transform: scaleY(1.2); } }`}</style>

      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <span className="font-bold gradient-text">LinguaExec</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Leaderboard</Link>
            <Link href="/settings" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Settings</Link>
            {userName && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">My Dictionary 📖</h1>
          <p className="text-slate-400">{words.length} words &amp; phrases saved from your lessons</p>
        </div>

        {/* Search + filters */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search words or translations..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={e => (e.target.style.borderColor = "#10b981")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div className="flex gap-2">
              {(["all", "word", "phrase"] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all"
                  style={filterType === t ? { background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", color: "#10b981" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                  {t === "all" ? "All" : t === "word" ? "Words" : "Phrases"}
                </button>
              ))}
            </div>
          </div>

          {/* Topic filter */}
          {topics.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={() => setFilterTopic("all")}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={filterTopic === "all" ? { background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", color: "#10b981" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>
                All topics
              </button>
              {topics.map(t => (
                <button key={t} onClick={() => setFilterTopic(t)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={filterTopic === t ? { background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", color: "#10b981" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="flex justify-center gap-2"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>
          </div>
        ) : words.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-bold mb-2">No words yet</h3>
            <p className="text-slate-400 text-sm mb-6">Complete a lesson to start building your dictionary</p>
            <Link href="/dashboard" className="px-6 py-3 rounded-full font-bold text-sm text-black inline-block"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              Go to Lessons →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400">No results for &quot;{search}&quot;</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-slate-500 mb-3">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.map(w => (
                <div key={w.id} className="glass rounded-xl p-4 glass-hover"
                  style={{ border: w.type === "phrase" ? "1px solid rgba(59,130,246,0.12)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-white">{w.word}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={w.type === "phrase"
                            ? { background: "rgba(59,130,246,0.15)", color: "#93c5fd" }
                            : { background: "rgba(16,185,129,0.12)", color: "#6ee7b7" }}>
                          {w.type}
                        </span>
                      </div>
                      {w.pronunciation && (
                        <div className="text-xs text-emerald-400 mb-1.5">🔊 {w.pronunciation}</div>
                      )}
                      <div className="text-sm font-semibold text-emerald-400 mb-1">{w.translation}</div>
                      {w.example && <div className="text-xs text-slate-500 italic truncate">{w.example}</div>}
                    </div>
                    <SpeakButton text={w.word} lang={langCode} />
                  </div>
                  {w.topic && (
                    <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="text-xs text-slate-600">{w.topic}</span>
                      <span className="text-xs text-slate-700">{new Date(w.learnedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

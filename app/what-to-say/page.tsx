"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const LANG_CODES: Record<string, string> = {
  arabic: "ar", english: "en", spanish: "es",
  french: "fr", german: "de", mandarin: "zh-CN",
  japanese: "ja", portuguese: "pt", italian: "it",
};

const TONE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Formal:   { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#60a5fa" },
  Casual:   { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#34d399" },
  Polite:   { bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.3)",   text: "#22d3ee" },
  Friendly: { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)",  text: "#c084fc" },
};

const EXAMPLE_SCENARIOS = [
  "Someone greeted me with a local phrase and I don't know how to reply",
  "I need to politely decline a meeting invitation",
  "My colleague gave me a compliment and I want to respond gracefully",
  "I need to ask my boss to speak more slowly",
  "Someone is offering me food but I'm full — how do I decline politely?",
  "I need to apologize for being late to a meeting",
  "I want to ask for help finding something in a store",
  "How do I end a business call professionally?",
];

interface ResponseItem {
  phrase: string;
  pronunciation: string;
  translation: string;
  tone: string;
  note: string;
}
interface WhatToSayData {
  situationSummary: string;
  responses: ResponseItem[];
  culturalTip: string;
}
interface UserData { targetLanguage: string; level: string; }

function SpeakButton({ text, langCode }: { text: string; langCode: string }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback(async () => {
    if (speaking) return;
    setSpeaking(true);
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch { setSpeaking(false); }
  }, [text, langCode, speaking]);

  return (
    <button onClick={speak} title="Listen"
      className="flex items-center justify-center rounded-full flex-shrink-0 transition-all"
      style={{ width: 38, height: 38,
        background: speaking ? "rgba(6,182,212,0.3)" : "rgba(6,182,212,0.1)",
        border: speaking ? "1px solid #06b6d4" : "1px solid rgba(6,182,212,0.25)" }}>
      {speaking ? (
        <span className="flex items-end gap-[2px] h-4">
          {[1,2,3].map(i => (
            <span key={i} className="w-[3px] rounded-full"
              style={{ background: "#22d3ee", height: `${i*4+4}px`,
                animation: `bounce ${0.4+i*0.1}s ease-in-out infinite alternate` }} />
          ))}
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      )}
    </button>
  );
}

export default function WhatToSayPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState<WhatToSayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<Array<{ situation: string; result: WhatToSayData }>>([]);

  useEffect(() => {
    fetch("/api/progress").then(r => r.json()).then(setUser).catch(console.error);
  }, []);

  const langCode = user ? (LANG_CODES[user.targetLanguage] ?? "en") : "en";

  async function handleSubmit() {
    if (!situation.trim() || loading) return;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const res = await fetch("/api/what-to-say", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: situation.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.responses) throw new Error(data.error || "Failed");
      setResult(data);
      setHistory(h => [{ situation: situation.trim(), result: data }, ...h].slice(0, 5));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function useExample(s: string) {
    setSituation(s);
    setResult(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <style>{`@keyframes bounce { from { transform: scaleY(0.5); } to { transform: scaleY(1.2); } }`}</style>

      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <span className="font-bold" style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            What Should I Say?
          </span>
          <div className="text-sm text-slate-500">{user?.targetLanguage ?? "…"}</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="text-3xl font-black mb-2">What Should I Say?</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Describe any real-life situation — someone said something to you, you&apos;re in an awkward moment, you need the right phrase — and get instant, natural responses in {user?.targetLanguage ?? "your language"}.
          </p>
        </div>

        {/* Input area */}
        <div className="glass rounded-2xl p-6 mb-6" style={{ border: "1px solid rgba(6,182,212,0.2)" }}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#22d3ee" }}>
            🎯 Describe the situation
          </label>
          <textarea
            value={situation}
            onChange={e => setSituation(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
            placeholder="e.g. My Arabic colleague greeted me with 'Ahlan wa sahlan' and I didn't know what to say back..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-600">⌘ + Enter to submit</span>
            <button
              onClick={handleSubmit}
              disabled={!situation.trim() || loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
              {loading ? "Thinking…" : "Get Responses →"}
            </button>
          </div>
        </div>

        {/* Example chips */}
        <div className="mb-8">
          <div className="text-xs text-slate-600 uppercase tracking-wider mb-3">Try an example</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SCENARIOS.map(s => (
              <button key={s} onClick={() => useExample(s)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors text-left"
                style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)", color: "#67e8f9" }}>
                {s.length > 50 ? s.slice(0, 50) + "…" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="glass rounded-2xl p-12 text-center mb-8">
            <div className="text-4xl mb-4 animate-float">🤔</div>
            <p className="text-slate-400 mb-4">Thinking of the best responses for your situation…</p>
            <div className="flex justify-center gap-2">
              <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass rounded-2xl p-8 text-center mb-8" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-slate-400 mb-4">Couldn&apos;t generate a response. Please try again.</p>
            <button onClick={handleSubmit} className="px-5 py-2 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
              Retry →
            </button>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="mb-8">
            {/* Situation summary */}
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-slate-300 flex items-start gap-2"
              style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <span className="flex-shrink-0" style={{ color: "#22d3ee" }}>📌</span>
              <span>{result.situationSummary}</span>
            </div>

            {/* Cultural tip */}
            {result.culturalTip && (
              <div className="mb-5 px-4 py-3 rounded-xl flex items-start gap-2"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <span className="text-xl flex-shrink-0">🌍</span>
                <div>
                  <div className="text-xs text-emerald-400 font-semibold mb-1">Cultural Insight</div>
                  <p className="text-sm text-slate-300">{result.culturalTip}</p>
                </div>
              </div>
            )}

            {/* Response cards */}
            <div className="space-y-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                {result.responses.length} suggested responses — pick what fits your moment
              </div>
              {result.responses.map((r, i) => {
                const toneStyle = TONE_STYLES[r.tone] ?? TONE_STYLES.Polite;
                return (
                  <div key={i} className="glass rounded-2xl p-6 transition-all"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-2xl font-bold text-white leading-tight">{r.phrase}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                            style={{ background: toneStyle.bg, color: toneStyle.text, border: `1px solid ${toneStyle.border}` }}>
                            {r.tone}
                          </span>
                        </div>
                        <div className="text-sm font-semibold px-3 py-1 rounded-full inline-block mb-2"
                          style={{ background: "rgba(6,182,212,0.1)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.2)" }}>
                          🔊 {r.pronunciation}
                        </div>
                        <div className="text-emerald-400 font-semibold text-sm mb-2">{r.translation}</div>
                        <div className="text-slate-500 text-sm flex items-start gap-2">
                          <span className="flex-shrink-0">💡</span>
                          <span>{r.note}</span>
                        </div>
                      </div>
                      <SpeakButton text={r.phrase} langCode={langCode} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ask another */}
            <button
              onClick={() => { setSituation(""); setResult(null); }}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all glass glass-hover"
              style={{ border: "1px solid rgba(6,182,212,0.2)", color: "#22d3ee" }}>
              + Ask about another situation
            </button>
          </div>
        )}

        {/* Recent history */}
        {history.length > 1 && (
          <div className="glass rounded-2xl p-5" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-xs text-slate-600 uppercase tracking-wider mb-4">Recent situations</div>
            <div className="space-y-2">
              {history.slice(1).map((h, i) => (
                <button key={i} onClick={() => { setSituation(h.situation); setResult(h.result); }}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 glass-hover"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-slate-600 text-sm">💬</span>
                  <span className="text-sm text-slate-400 truncate">{h.situation}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

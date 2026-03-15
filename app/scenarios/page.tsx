"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { addXP, getProfile } from "@/lib/storage";
import ReactMarkdown from "react-markdown";

interface Scenario {
  id: string; icon: string; title: string; aiRole: string; userRole: string; context: string; difficulty: string; duration: string;
}

const SCENARIOS: Scenario[] = [
  { id: "board-meeting", icon: "🏢", title: "Board Meeting", aiRole: "Board Chairman", userRole: "CEO presenting quarterly results", context: "A quarterly board meeting where you need to present financial results and strategic plans.", difficulty: "Advanced", duration: "15 min" },
  { id: "client-pitch", icon: "🤝", title: "Client Pitch", aiRole: "Potential Client", userRole: "Business Development Executive", context: "Pitching your company's services to a high-value international client.", difficulty: "Intermediate", duration: "10 min" },
  { id: "negotiation", icon: "⚖️", title: "Deal Negotiation", aiRole: "Counterpart Negotiator", userRole: "Lead Negotiator", context: "Negotiating contract terms and pricing in a major business deal.", difficulty: "Advanced", duration: "20 min" },
  { id: "networking", icon: "🍸", title: "Networking Event", aiRole: "Industry Professional", userRole: "Executive at a conference", context: "Making connections at an exclusive industry networking event.", difficulty: "Beginner", duration: "5 min" },
  { id: "team-meeting", icon: "👥", title: "Team Meeting", aiRole: "Direct Report", userRole: "Manager leading a meeting", context: "Leading a virtual team meeting to discuss project status and roadblocks.", difficulty: "Intermediate", duration: "10 min" },
  { id: "restaurant", icon: "🍽️", title: "Business Dinner", aiRole: "Restaurant Host / Business Partner", userRole: "Executive hosting a dinner", context: "Hosting an international business partner for an important dinner meeting.", difficulty: "Beginner", duration: "8 min" },
];

interface Message { role: "user" | "assistant"; content: string; }

export default function ScenariosPage() {
  const [profile, setProfile] = useState<ReturnType<typeof getProfile> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setMounted(true);
  }, []);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText]);

  async function startScenario(s: Scenario) {
    setSelectedScenario(s);
    setMessages([]);
    setLoading(true);

    const openingMessages: Message[] = [{ role: "user", content: "[START SCENARIO]" }];

    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: openingMessages,
          language: profile?.targetLanguage,
          level: profile?.level,
          scenario: s,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n").filter(l => l.startsWith("data: "))) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const p = JSON.parse(data);
              if (p.text) { fullText += p.text; setStreamText(fullText); }
              else if (p.error) { fullText = "⚠️ API unavailable. Please check your Anthropic account credits and spend limit."; }
            } catch { /* ignore */ }
          }
        }
      }

      setMessages([{ role: "assistant", content: fullText }]);
      setStreamText("");
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || !selectedScenario || !profile) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          language: profile.targetLanguage,
          level: profile.level,
          scenario: selectedScenario,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n").filter(l => l.startsWith("data: "))) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const p = JSON.parse(data);
              if (p.text) { fullText += p.text; setStreamText(fullText); }
              else if (p.error) { fullText = "⚠️ API unavailable. Please check your Anthropic account credits and spend limit."; }
            } catch { /* ignore */ }
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullText }]);
      setStreamText("");
      addXP(30);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  const mdComponents = {
    p: ({children}: {children: React.ReactNode}) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    strong: ({children}: {children: React.ReactNode}) => <strong className="font-bold text-white">{children}</strong>,
    ul: ({children}: {children: React.ReactNode}) => <ul className="mb-3 space-y-2 list-none">{children}</ul>,
    li: ({children}: {children: React.ReactNode}) => <li className="pl-1 leading-relaxed">{children}</li>,
  };

  if (!mounted) {
    return <div className="min-h-screen" style={{ background: "#080d1a" }} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please complete onboarding first</p>
          <Link href="/onboarding" className="px-6 py-3 rounded-full font-bold text-black" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>Start →</Link>
        </div>
      </div>
    );
  }

  const langLabel: Record<string, string> = { arabic: "Arabic 🇸🇦", english: "English 🇺🇸", spanish: "Spanish 🇪🇸" };

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">← Dashboard</Link>
          <span className="gradient-text font-bold">Business Scenarios</span>
          <div className="text-xs text-slate-500">{langLabel[profile.targetLanguage]}</div>
        </div>
      </nav>

      {!selectedScenario ? (
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-2">Choose Your Scenario</h1>
            <p className="text-slate-400">Role-play real business situations in {langLabel[profile.targetLanguage]}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SCENARIOS.map((s) => (
              <button key={s.id} onClick={() => startScenario(s)}
                className="glass rounded-2xl p-6 text-left glass-hover transition-all hover:scale-[1.02] group">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-black text-lg mb-1">{s.title}</h3>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">{s.context}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: s.difficulty === "Beginner" ? "rgba(34,197,94,0.15)" : s.difficulty === "Intermediate" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)", color: s.difficulty === "Beginner" ? "#86efac" : s.difficulty === "Intermediate" ? "#fbbf24" : "#fca5a5" }}>
                      {s.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full text-slate-500" style={{ background: "rgba(255,255,255,0.06)" }}>
                      {s.duration}
                    </span>
                  </div>
                  <span className="text-amber-400 text-sm group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-64px)]">
          {/* Scenario header */}
          <div className="px-6 py-4 max-w-3xl mx-auto w-full">
            <div className="glass rounded-xl p-4 flex items-center justify-between" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedScenario.icon}</span>
                <div>
                  <div className="font-bold text-sm">{selectedScenario.title}</div>
                  <div className="text-xs text-slate-400">You: {selectedScenario.userRole} · AI: {selectedScenario.aiRole}</div>
                </div>
              </div>
              <button onClick={() => setSelectedScenario(null)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                Exit
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 max-w-3xl mx-auto w-full">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1 text-xl">
                      {selectedScenario.icon}
                    </div>
                  )}
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={msg.role === "user"
                      ? { background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "white" }
                      : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                    {msg.role === "assistant" ? <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown> : msg.content}
                  </div>
                </div>
              ))}
              {streamText && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl mr-2 flex-shrink-0 mt-1">{selectedScenario.icon}</div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                    <ReactMarkdown components={mdComponents}>{streamText}</ReactMarkdown><span className="cursor-blink ml-0.5">▋</span>
                  </div>
                </div>
              )}
              {loading && !streamText && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl mr-2">{selectedScenario.icon}</div>
                  <div className="rounded-2xl px-4 py-4 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="glass border-t px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="max-w-3xl mx-auto flex items-end gap-3">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Respond as ${selectedScenario.userRole}...`}
                rows={1}
                className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "100px" }}
              />
              <button onClick={sendMessage} disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all disabled:opacity-40 hover:scale-110 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "black" }}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

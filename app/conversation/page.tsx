"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { addXP, getProfile } from "@/lib/storage";

interface Message { role: "user" | "assistant"; content: string; }

const STARTER_PROMPTS = [
  "Introduce yourself as an executive",
  "Practice saying hello and greeting",
  "Ask about a business meeting schedule",
  "Discuss weekend plans politely",
];

export default function ConversationPage() {
  const [profile, setProfile] = useState<ReturnType<typeof getProfile> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setMounted(true);
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText]);

  useEffect(() => {
    // Welcome message
    if (profile && messages.length === 0) {
      const langGreetings: Record<string, string> = {
        arabic: "مرحباً! أنا مساعدك في تعلم اللغة العربية. (Hello! I'm your Arabic learning assistant.) Let's practice together! What would you like to say?",
        english: "Hello! I'm your English conversation partner. Let's practice business English together! What would you like to discuss?",
        spanish: "¡Hola! Soy tu asistente de práctica en español. (Hello! I'm your Spanish practice assistant.) ¿Qué quieres practicar hoy?",
      };
      setMessages([{ role: "assistant", content: langGreetings[profile.targetLanguage] || "Hello! Let's practice together!" }]);
    }
  }, [profile]); // eslint-disable-line

  async function sendMessage(text?: string) {
    const userText = text || input.trim();
    if (!userText || loading || !profile) return;

    const newMessages = [...messages, { role: "user" as const, content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          language: profile.targetLanguage,
          level: profile.level,
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
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamText(fullText);
              }
            } catch { /* ignore */ }
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullText }]);
      setStreamText("");
      addXP(20);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble responding. Please try again." }]);
      setStreamText("");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

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
    <div className="min-h-screen flex flex-col" style={{ background: "#080d1a" }}>
      {/* Nav */}
      <nav className="glass border-b z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">← Dashboard</Link>
          <div className="text-center">
            <div className="font-bold gradient-text text-sm">AI Conversation</div>
            <div className="text-xs text-slate-500">{langLabel[profile.targetLanguage]} · {profile.level}</div>
          </div>
          <div className="text-xs text-amber-400">+20 XP/msg</div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        {/* Starter prompts */}
        {messages.length <= 1 && (
          <div className="mb-6">
            <p className="text-xs text-slate-500 mb-3 text-center">Quick starters:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTER_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="px-4 py-2 rounded-full text-xs glass glass-hover text-slate-400 transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>🤖</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`}
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "white" }
                  : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming */}
          {streamText && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>🤖</div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                {streamText}<span className="cursor-blink ml-0.5">▋</span>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {loading && !streamText && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>🤖</div>
              <div className="rounded-2xl px-4 py-4 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass border-t px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type in ${langLabel[profile.targetLanguage]} or English...`}
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none text-white transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "120px" }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all disabled:opacity-40 hover:scale-110 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "black" }}>
            ↑
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

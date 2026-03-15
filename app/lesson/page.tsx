"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { TOPICS, getUserTopic, getTopicLevel } from "@/lib/topics";

// Map app language keys → Google Translate TTS lang codes
const LANG_CODES: Record<string, string> = {
  arabic: "ar", english: "en", spanish: "es",
  french: "fr", german: "de", mandarin: "zh-CN",
  japanese: "ja", portuguese: "pt", italian: "it",
};

interface VocabItem { word: string; pronunciation: string; translation: string; example: string; }
interface Phrase { phrase: string; pronunciation: string; translation: string; usage: string; }
interface Quiz { question: string; options: string[]; pronunciations?: string[]; correct: number; explanation: string; }
interface GrammarExample { text: string; pronunciation: string; translation: string; }
interface LessonData {
  title: string; subtitle: string;
  vocabulary: VocabItem[]; phrases: Phrase[];
  grammar: { rule: string; explanation: string; examples: (string | GrammarExample)[] };
  culturalTip: string; quiz: Quiz[];
}
interface UserData { name: string; targetLanguage: string; level: string; lessonsCompleted: number; }

function SpeakButton({ text, langCode }: { text: string; langCode: string }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback(async () => {
    if (speaking) return;
    setSpeaking(true);
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch { setSpeaking(false); }
  }, [text, langCode, speaking]);

  return (
    <button onClick={speak} title="Listen to pronunciation"
      className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
      style={{ width: 36, height: 36,
        background: speaking ? "rgba(16,185,129,0.35)" : "rgba(16,185,129,0.15)",
        border: speaking ? "1px solid #10b981" : "1px solid rgba(16,185,129,0.3)" }}>
      {speaking ? (
        <span className="flex items-end gap-[2px] h-4">
          {[1,2,3].map(i => (
            <span key={i} className="w-[3px] rounded-full bg-emerald-400"
              style={{ height: `${i*4+4}px`, animation: `bounce ${0.4+i*0.1}s ease-in-out infinite alternate` }} />
          ))}
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      )}
    </button>
  );
}

function LessonContent() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");

  const [user, setUser] = useState<UserData | null>(null);
  const [mounted, setMounted] = useState(false);

  // Use URL param if it's a known topic; otherwise fall back to user's current curriculum position
  const topic = topicParam && TOPICS.includes(topicParam) ? topicParam : (user ? getUserTopic(user.lessonsCompleted) : (topicParam ?? TOPICS[0]));
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"vocab" | "phrases" | "grammar" | "quiz">("vocab");
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch("/api/progress").then(r => r.json()).then(setUser).catch(console.error);
    setMounted(true);
  }, []);

  const langCode = user ? (LANG_CODES[user.targetLanguage] ?? "en") : "en";

  async function loadLesson() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: user.targetLanguage, level: user.level, topic }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.vocabulary) throw new Error(data.error || "Invalid lesson data");
      setLesson(data);
    } catch (err) {
      console.error("Failed to load lesson", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) loadLesson(); }, [user]); // eslint-disable-line

  async function handleQuizSubmit() {
    if (!lesson) return;
    setQuizSubmitted(true);
    const correct = quizAnswers.filter((a, i) => a === lesson.quiz[i]?.correct).length;
    const xpEarned = correct * 50 + 100;

    // 1. Update XP + lesson count
    await fetch("/api/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xp: xpEarned, wordsLearned: lesson.vocabulary.length, lessonCompleted: true }),
    });

    // 2. Mark topic as completed
    await fetch("/api/dictionary", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    // 3. Save vocabulary + phrases to dictionary
    const words = [
      ...lesson.vocabulary.map(v => ({ word: v.word, pronunciation: v.pronunciation, translation: v.translation, example: v.example, type: "word" })),
      ...lesson.phrases.map(p => ({ word: p.phrase, pronunciation: p.pronunciation, translation: p.translation, example: p.usage, type: "phrase" })),
    ];
    await fetch("/api/dictionary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words, topic, language: user?.targetLanguage }),
    });

    setCompleted(true);
  }

  if (!mounted) return <div className="min-h-screen" style={{ background: "#080d1a" }} />;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
        <div className="flex gap-2"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>
      </div>
    );
  }

  const topicIndex = TOPICS.indexOf(topic);
  const nextTopic = TOPICS[topicIndex + 1] ?? null;

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <style>{`@keyframes bounce { from { transform: scaleY(0.5); } to { transform: scaleY(1.2); } }`}</style>

      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">← Dashboard</Link>
          <span className="gradient-text font-bold">Lesson</span>
          <div className="text-sm text-slate-500">{user.targetLanguage} · {user.level}</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">📖 Lesson {topicIndex + 1} of {TOPICS.length}</div>
            {(() => {
              const lv = getTopicLevel(topicIndex);
              const colors = { Beginner: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)", text: "#34d399" }, Intermediate: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.35)", text: "#60a5fa" }, Advanced: { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.35)", text: "#c084fc" } };
              const c = colors[lv];
              return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{lv}</span>;
            })()}
          </div>
          <h1 className="text-3xl font-black">{topic}</h1>
          {lesson && <p className="text-slate-400 mt-1">{lesson.subtitle}</p>}
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="text-4xl mb-4 animate-float">🤖</div>
            <p className="text-slate-400 mb-2">AI is preparing your lesson...</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
            </div>
          </div>
        ) : lesson ? (
          <>
            {lesson.culturalTip && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <span className="text-xl">🌍</span>
                <div>
                  <div className="text-xs text-emerald-400 font-semibold mb-1">Cultural Insight</div>
                  <p className="text-sm text-slate-300">{lesson.culturalTip}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-6 flex-wrap">
              {(["vocab", "phrases", "grammar", "quiz"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                  style={tab === t ? { background: "linear-gradient(135deg, #10b981, #059669)", color: "black" } : { background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                  {t === "vocab" ? "📚 Vocabulary" : t === "phrases" ? "💬 Phrases" : t === "grammar" ? "📝 Grammar" : "🎯 Quiz"}
                </button>
              ))}
            </div>

            {tab === "vocab" && (
              <div className="grid md:grid-cols-2 gap-4">
                {(lesson.vocabulary ?? []).map((item, i) => (
                  <div key={i} className="glass rounded-xl p-5 glass-hover">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="text-xl font-bold text-white">{item.word}</div>
                      <SpeakButton text={item.word} langCode={langCode} />
                    </div>
                    <div className="text-sm font-semibold px-3 py-1 rounded-full inline-block text-emerald-300 mb-2" style={{ background: "rgba(16,185,129,0.15)" }}>🔊 {item.pronunciation}</div>
                    <div className="text-emerald-400 font-semibold text-sm mb-2">{item.translation}</div>
                    <div className="text-slate-400 text-sm italic">{item.example}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "phrases" && (
              <div className="space-y-4">
                {(lesson.phrases ?? []).map((phrase, i) => (
                  <div key={i} className="glass rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="text-lg font-bold text-white">{phrase.phrase}</div>
                      <SpeakButton text={phrase.phrase} langCode={langCode} />
                    </div>
                    <div className="text-sm font-semibold px-3 py-1 rounded-full inline-block text-emerald-300 mb-3" style={{ background: "rgba(16,185,129,0.15)" }}>🔊 {phrase.pronunciation}</div>
                    <div className="text-emerald-400 font-semibold text-sm mb-2">{phrase.translation}</div>
                    <div className="text-slate-400 text-sm flex items-start gap-2"><span>💡</span><span>{phrase.usage}</span></div>
                  </div>
                ))}
              </div>
            )}

            {tab === "grammar" && (
              <div className="glass rounded-2xl p-8">
                <div className="text-xs text-emerald-400 font-semibold mb-2 uppercase tracking-wider">Grammar Rule</div>
                <h3 className="text-xl font-black mb-4">{lesson.grammar.rule}</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">{lesson.grammar.explanation}</p>
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Examples</div>
                  {(lesson.grammar?.examples ?? []).map((ex, i) => {
                    const isObj = typeof ex === "object" && ex !== null;
                    const text = isObj ? (ex as GrammarExample).text : (ex as string);
                    return (
                      <div key={i} className="p-4 rounded-lg" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-3">
                            <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                            <span className="text-white font-semibold text-base">{text}</span>
                          </div>
                          <SpeakButton text={text} langCode={langCode} />
                        </div>
                        {isObj && (ex as GrammarExample).pronunciation && (
                          <div className="ml-6 text-sm font-semibold px-3 py-0.5 rounded-full inline-block text-emerald-300 mb-1" style={{ background: "rgba(16,185,129,0.15)" }}>🔊 {(ex as GrammarExample).pronunciation}</div>
                        )}
                        {isObj && (ex as GrammarExample).translation && (
                          <div className="ml-6 text-sm text-slate-400 mt-1">{(ex as GrammarExample).translation}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "quiz" && (
              <div className="space-y-6">
                {(lesson.quiz ?? []).map((q, qi) => (
                  <div key={qi} className="glass rounded-2xl p-6">
                    <div className="font-bold mb-4 text-lg">{qi + 1}. {q.question}</div>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const selected = quizAnswers[qi] === oi;
                        const isCorrect = quizSubmitted && oi === q.correct;
                        const isWrong = quizSubmitted && selected && oi !== q.correct;
                        return (
                          <div key={oi} className="flex items-center gap-2">
                            <button disabled={quizSubmitted}
                              onClick={() => setQuizAnswers(a => { const n = [...a]; n[qi] = oi; return n; })}
                              className="flex-1 text-left px-4 py-3 rounded-xl transition-all"
                              style={isCorrect ? { background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)", color: "#86efac" }
                                : isWrong ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#fca5a5" }
                                : selected ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#6ee7b7" }
                                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                              <div className="font-semibold text-base">{opt}</div>
                              {q.pronunciations?.[oi] && <div className="text-xs mt-0.5 opacity-70">{q.pronunciations[oi]}</div>}
                            </button>
                            <SpeakButton text={opt} langCode={langCode} />
                          </div>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <div className="mt-3 text-sm text-slate-400 flex items-start gap-2"><span>💡</span><span>{q.explanation}</span></div>
                    )}
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button onClick={handleQuizSubmit} disabled={quizAnswers.length !== lesson.quiz.length}
                    className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "black" }}>
                    Submit Answers →
                  </button>
                ) : completed ? (
                  <div className="text-center p-8 glass rounded-2xl" style={{ border: "1px solid rgba(16,185,129,0.3)" }}>
                    <div className="text-4xl mb-3">🎉</div>
                    <h3 className="text-xl font-black gradient-text mb-2">Lesson Complete!</h3>
                    <p className="text-slate-400 text-sm mb-2">+{quizAnswers.filter((a, i) => a === lesson.quiz[i]?.correct).length * 50 + 100} XP earned</p>
                    <p className="text-slate-500 text-xs mb-6">Words saved to your Dictionary ✓</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      {nextTopic && (
                        <Link href={`/lesson?topic=${encodeURIComponent(nextTopic)}`}
                          className="px-6 py-3 rounded-full font-bold text-sm text-black"
                          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                          Next: {nextTopic} →
                        </Link>
                      )}
                      <Link href="/dictionary" className="px-6 py-3 rounded-full font-bold text-sm text-black"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                        View Dictionary 📖
                      </Link>
                      <Link href="/dashboard" className="px-6 py-3 rounded-full font-semibold text-sm glass glass-hover">
                        Dashboard
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">Failed to load lesson</p>
            <button onClick={loadLesson} className="px-6 py-3 rounded-full font-bold text-black" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              Retry →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#080d1a" }} />}>
      <LessonContent />
    </Suspense>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile, addXP, addWordsLearned, addLessonCompleted } from "@/lib/storage";

const TOPICS = ["Greetings & Introductions", "Business Meetings", "Travel & Dining", "Negotiations", "Presentations", "Small Talk", "Emails & Writing"];

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

export default function LessonPage() {
  const [profile, setProfile] = useState<ReturnType<typeof getProfile> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [topic] = useState(() => TOPICS[new Date().getDay() % TOPICS.length]);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setMounted(true);
  }, []);
  const [tab, setTab] = useState<"vocab" | "phrases" | "grammar" | "quiz">("vocab");
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function loadLesson() {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: profile.targetLanguage, level: profile.level, topic }),
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

  useEffect(() => { if (profile) loadLesson(); }, [profile]); // eslint-disable-line

  function handleQuizSubmit() {
    setQuizSubmitted(true);
    if (!lesson) return;
    const correct = quizAnswers.filter((a, i) => a === lesson.quiz[i]?.correct).length;
    addXP(correct * 50 + 100);
    addWordsLearned(lesson.vocabulary.length);
    addLessonCompleted();
    setCompleted(true);
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

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <span className="gradient-text font-bold">Today&apos;s Lesson</span>
          <div className="text-sm text-slate-500">{profile.targetLanguage} · {profile.level}</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="text-amber-400 text-sm font-semibold mb-1 uppercase tracking-wider">📖 Today&apos;s Topic</div>
          <h1 className="text-3xl font-black">{topic}</h1>
          {lesson && <p className="text-slate-400 mt-1">{lesson.subtitle}</p>}
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="text-4xl mb-4 animate-float">🤖</div>
            <p className="text-slate-400 mb-2">AI is preparing your lesson...</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        ) : lesson ? (
          <>
            {/* Cultural tip banner */}
            {lesson.culturalTip && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <span className="text-xl">🌍</span>
                <div>
                  <div className="text-xs text-amber-400 font-semibold mb-1">Cultural Insight</div>
                  <p className="text-sm text-slate-300">{lesson.culturalTip}</p>
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {(["vocab", "phrases", "grammar", "quiz"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                  style={tab === t ? { background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "black" } : { background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                  {t === "vocab" ? "📚 Vocabulary" : t === "phrases" ? "💬 Phrases" : t === "grammar" ? "📝 Grammar" : "🎯 Quiz"}
                </button>
              ))}
            </div>

            {/* Vocabulary */}
            {tab === "vocab" && (
              <div className="grid md:grid-cols-2 gap-4">
                {(lesson.vocabulary ?? []).map((item, i) => (
                  <div key={i} className="glass rounded-xl p-5 glass-hover">
                    <div className="mb-2">
                      <div className="text-xl font-bold text-white mb-1">{item.word}</div>
                      <div className="text-sm font-semibold px-3 py-1 rounded-full inline-block text-amber-300" style={{ background: "rgba(245,158,11,0.15)" }}>🔊 {item.pronunciation}</div>
                    </div>
                    <div className="text-amber-400 font-semibold text-sm mb-2">{item.translation}</div>
                    <div className="text-slate-400 text-sm italic">{item.example}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Phrases */}
            {tab === "phrases" && (
              <div className="space-y-4">
                {(lesson.phrases ?? []).map((phrase, i) => (
                  <div key={i} className="glass rounded-xl p-5">
                    <div className="text-lg font-bold text-white mb-2">{phrase.phrase}</div>
                    <div className="text-sm font-semibold px-3 py-1 rounded-full inline-block text-amber-300 mb-3" style={{ background: "rgba(245,158,11,0.15)" }}>🔊 {phrase.pronunciation}</div>
                    <div className="text-amber-400 font-semibold text-sm mb-2">{phrase.translation}</div>
                    <div className="text-slate-400 text-sm flex items-start gap-2">
                      <span>💡</span> <span>{phrase.usage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grammar */}
            {tab === "grammar" && (
              <div className="glass rounded-2xl p-8">
                <div className="text-xs text-amber-400 font-semibold mb-2 uppercase tracking-wider">Grammar Rule</div>
                <h3 className="text-xl font-black mb-4">{lesson.grammar.rule}</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">{lesson.grammar.explanation}</p>
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Examples</div>
                  {(lesson.grammar?.examples ?? []).map((ex, i) => {
                    const isObj = typeof ex === "object" && ex !== null;
                    return (
                      <div key={i} className="p-4 rounded-lg" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)" }}>
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
                          <span className="text-white font-semibold text-base">{isObj ? (ex as GrammarExample).text : ex}</span>
                        </div>
                        {isObj && (ex as GrammarExample).pronunciation && (
                          <div className="ml-6 text-sm font-semibold px-3 py-0.5 rounded-full inline-block text-amber-300 mb-1" style={{ background: "rgba(245,158,11,0.15)" }}>
                            🔊 {(ex as GrammarExample).pronunciation}
                          </div>
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

            {/* Quiz */}
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
                          <button key={oi} disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(a => { const n = [...a]; n[qi] = oi; return n; })}
                            className="w-full text-left px-4 py-3 rounded-xl transition-all"
                            style={isCorrect ? { background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)", color: "#86efac" }
                              : isWrong ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#fca5a5" }
                              : selected ? { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#fbbf24" }
                              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                            <div className="font-semibold text-base">{opt}</div>
                            {q.pronunciations?.[oi] && (
                              <div className="text-xs mt-0.5 opacity-70">{q.pronunciations[oi]}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <div className="mt-3 text-sm text-slate-400 flex items-start gap-2">
                        <span>💡</span> <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button onClick={handleQuizSubmit} disabled={quizAnswers.length !== lesson.quiz.length}
                    className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "black" }}>
                    Submit Answers →
                  </button>
                ) : completed ? (
                  <div className="text-center p-8 glass rounded-2xl" style={{ border: "1px solid rgba(245,158,11,0.3)" }}>
                    <div className="text-4xl mb-3">🎉</div>
                    <h3 className="text-xl font-black gradient-text mb-2">Lesson Complete!</h3>
                    <p className="text-slate-400 text-sm mb-6">+{quizAnswers.filter((a, i) => a === lesson.quiz[i]?.correct).length * 50 + 100} XP earned</p>
                    <div className="flex gap-3 justify-center">
                      <Link href="/conversation" className="px-6 py-3 rounded-full font-bold text-sm text-black" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                        Practice Conversation →
                      </Link>
                      <Link href="/dashboard" className="px-6 py-3 rounded-full font-semibold text-sm glass glass-hover">
                        Back to Dashboard
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
            <button onClick={loadLesson} className="px-6 py-3 rounded-full font-bold text-black" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
              Retry →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

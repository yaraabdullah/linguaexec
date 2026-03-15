"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["language", "level", "goals", "time", "name"] as const;
type Step = typeof STEPS[number];

const LANGUAGES = [
  { id: "arabic", flag: "🇸🇦", name: "Arabic", native: "العربية", desc: "Master the language of 420M+ speakers" },
  { id: "english", flag: "🇺🇸", name: "English", native: "English", desc: "The global language of business" },
  { id: "spanish", flag: "🇪🇸", name: "Spanish", native: "Español", desc: "Open doors across 21 countries" },
];

const LEVELS = [
  { id: "beginner", icon: "🌱", label: "Beginner", desc: "Starting from scratch or very basic knowledge" },
  { id: "intermediate", icon: "🌿", label: "Intermediate", desc: "Can handle simple conversations" },
  { id: "advanced", icon: "🌳", label: "Advanced", desc: "Fluent but need business refinement" },
];

const GOALS = [
  "Business meetings", "Client presentations", "Negotiations",
  "Networking events", "Email communication", "Travel", "Cultural fluency",
];

const TIMES = [5, 10, 15, 20, 30];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("language");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ language: "", level: "", goals: [] as string[], time: 10, name: "" });

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function next() {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep);
    else finish();
  }

  async function finish() {
    setLoading(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || "Executive",
          targetLanguage: form.language,
          nativeLanguage: "English",
          level: form.level,
          goals: form.goals,
          dailyMinutes: form.time,
        }),
      });
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  }

  const canContinue = () => {
    if (step === "language") return form.language !== "";
    if (step === "level") return form.level !== "";
    if (step === "goals") return form.goals.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ background: "#080d1a" }}>
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">🌐</span>
          <span className="text-xl font-bold gradient-text">LinguaExec</span>
        </div>
        <p className="text-slate-400 text-sm">Step {stepIndex + 1} of {STEPS.length}</p>
        <div className="w-64 h-1 rounded-full mt-3 mx-auto" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #10b981, #059669)" }} />
        </div>
      </div>

      <div className="w-full max-w-lg glass rounded-3xl p-8 animate-fade-in-up" style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
        {step === "language" && (
          <div>
            <h2 className="text-2xl font-black mb-2">What language do you want to master?</h2>
            <p className="text-slate-400 text-sm mb-6">Choose your target language</p>
            <div className="space-y-3">
              {LANGUAGES.map((lang) => (
                <button key={lang.id} onClick={() => setForm(f => ({ ...f, language: lang.id }))}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left"
                  style={form.language === lang.id
                    ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.5)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-3xl">{lang.flag}</span>
                  <div>
                    <div className="font-bold">{lang.name} <span className="text-slate-400 font-normal text-sm">· {lang.native}</span></div>
                    <div className="text-xs text-slate-500">{lang.desc}</div>
                  </div>
                  {form.language === lang.id && <span className="ml-auto text-emerald-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "level" && (
          <div>
            <h2 className="text-2xl font-black mb-2">What&apos;s your current level?</h2>
            <p className="text-slate-400 text-sm mb-6">Be honest — AI will adapt to you</p>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button key={l.id} onClick={() => setForm(f => ({ ...f, level: l.id }))}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left"
                  style={form.level === l.id
                    ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.5)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-2xl">{l.icon}</span>
                  <div>
                    <div className="font-bold">{l.label}</div>
                    <div className="text-xs text-slate-500">{l.desc}</div>
                  </div>
                  {form.level === l.id && <span className="ml-auto text-emerald-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "goals" && (
          <div>
            <h2 className="text-2xl font-black mb-2">What are your goals?</h2>
            <p className="text-slate-400 text-sm mb-6">Select all that apply</p>
            <div className="flex flex-wrap gap-3">
              {GOALS.map((g) => {
                const selected = form.goals.includes(g);
                return (
                  <button key={g} onClick={() => setForm(f => ({
                    ...f, goals: selected ? f.goals.filter(x => x !== g) : [...f.goals, g]
                  }))}
                    className="px-4 py-2 rounded-full text-sm transition-all"
                    style={selected
                      ? { background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.6)", color: "#34d399" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                    {selected ? "✓ " : ""}{g}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "time" && (
          <div>
            <h2 className="text-2xl font-black mb-2">How many minutes per day?</h2>
            <p className="text-slate-400 text-sm mb-6">Consistency beats intensity. Even 5 mins works.</p>
            <div className="flex flex-wrap gap-3">
              {TIMES.map((t) => (
                <button key={t} onClick={() => setForm(f => ({ ...f, time: t }))}
                  className="px-6 py-4 rounded-xl text-2xl font-black transition-all"
                  style={form.time === t
                    ? { background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.6)", color: "#34d399" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                  {t}<span className="text-sm font-normal">m</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-400">Selected: <span className="text-emerald-400 font-bold">{form.time} minutes/day</span></p>
          </div>
        )}

        {step === "name" && (
          <div>
            <h2 className="text-2xl font-black mb-2">What should we call you?</h2>
            <p className="text-slate-400 text-sm mb-6">Your AI tutor will use this</p>
            <input
              type="text"
              placeholder="Your name or title (e.g. Alex, Dr. Smith)"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-5 py-4 rounded-xl text-white text-lg outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
              onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
              autoFocus
            />
          </div>
        )}

        <button onClick={next} disabled={!canContinue() || loading}
          className="mt-8 w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
          style={{ background: canContinue() ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.1)", color: canContinue() ? "black" : "gray" }}>
          {loading ? "Setting up..." : step === "name" ? "🚀 Start Learning" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

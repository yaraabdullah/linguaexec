"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const LANGUAGES = [
  { value: "arabic", label: "Arabic 🇸🇦" },
  { value: "english", label: "English 🇺🇸" },
  { value: "spanish", label: "Spanish 🇪🇸" },
  { value: "french", label: "French 🇫🇷" },
  { value: "german", label: "German 🇩🇪" },
  { value: "mandarin", label: "Mandarin 🇨🇳" },
  { value: "japanese", label: "Japanese 🇯🇵" },
  { value: "portuguese", label: "Portuguese 🇧🇷" },
  { value: "italian", label: "Italian 🇮🇹" },
];

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const DAILY_MINUTES = [5, 10, 15, 20, 30];

interface UserProfile {
  name: string;
  email: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: string;
  dailyMinutes: number;
  streak: number;
  xp: number;
  wordsLearned: number;
  lessonsCompleted: number;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: "", targetLanguage: "", nativeLanguage: "", level: "", dailyMinutes: 10 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || "",
          targetLanguage: data.targetLanguage || "english",
          nativeLanguage: data.nativeLanguage || "English",
          level: data.level || "beginner",
          dailyMinutes: data.dailyMinutes || 10,
        });
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setProfile((prev) => prev ? { ...prev, ...form } : prev);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      {/* Nav */}
      <nav className="glass border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <span className="font-bold gradient-text">LinguaExec</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">🏆 Leaderboard</Link>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">Settings</h1>
          <p className="text-slate-400">Update your profile and learning preferences</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Stats sidebar */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-black mx-auto mb-3"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{profile.name}</div>
                <div className="text-xs text-slate-500 mt-1">{profile.email}</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Your Stats</div>
              {[
                { icon: "🔥", label: "Streak", value: `${profile.streak} days` },
                { icon: "⚡", label: "XP", value: `${profile.xp}` },
                { icon: "📚", label: "Words", value: `${profile.wordsLearned}` },
                { icon: "✅", label: "Lessons", value: `${profile.lessonsCompleted}` },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{s.icon}</span>{s.label}
                  </div>
                  <div className="text-sm font-semibold gradient-text">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSave} className="space-y-5">
              {/* Display Name */}
              <div className="glass rounded-2xl p-6">
                <h2 className="font-bold text-slate-300 mb-4">Profile</h2>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              {/* Language Settings */}
              <div className="glass rounded-2xl p-6">
                <h2 className="font-bold text-slate-300 mb-4">Language Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">I&apos;m learning</label>
                    <div className="grid grid-cols-2 gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => setForm({ ...form, targetLanguage: lang.value })}
                          className="px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                          style={{
                            background: form.targetLanguage === lang.value ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                            border: form.targetLanguage === lang.value ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                            color: form.targetLanguage === lang.value ? "#10b981" : "#94a3b8",
                          }}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">My native language</label>
                    <select
                      value={form.nativeLanguage}
                      onChange={(e) => setForm({ ...form, nativeLanguage: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.label.split(" ")[0]} style={{ background: "#0f172a" }}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Level & Daily Goal */}
              <div className="glass rounded-2xl p-6">
                <h2 className="font-bold text-slate-300 mb-4">Learning Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Current Level</label>
                    <div className="flex gap-2">
                      {LEVELS.map((lvl) => (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => setForm({ ...form, level: lvl.value })}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: form.level === lvl.value ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                            border: form.level === lvl.value ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                            color: form.level === lvl.value ? "#10b981" : "#94a3b8",
                          }}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Daily Goal</label>
                    <div className="flex gap-2">
                      {DAILY_MINUTES.map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setForm({ ...form, dailyMinutes: min })}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: form.dailyMinutes === min ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                            border: form.dailyMinutes === min ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                            color: form.dailyMinutes === min ? "#10b981" : "#94a3b8",
                          }}
                        >
                          {min}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </div>
              )}
              {saved && (
                <div className="rounded-xl px-4 py-3 text-sm text-emerald-400" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  ✓ Changes saved successfully
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-bold text-black transition-all text-sm"
                style={{
                  background: saving ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg, #10b981, #059669)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    if (signInResult?.error) { setError("Account created but login failed. Please go to login page."); setLoading(false); return; }
    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#080d1a" }}>
      <div className="w-full max-w-md glass rounded-3xl p-8" style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl">🌐</Link>
          <h1 className="text-2xl font-black gradient-text mt-2">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Start your language journey</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Your name" value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          <input type="email" placeholder="Email address" required value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          <input type="password" placeholder="Password (min 8 chars)" required value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-black transition-all disabled:opacity-50 hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

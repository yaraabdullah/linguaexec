"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  // Strip host/port — only keep the pathname so we never redirect to a stale localhost URL
  const callbackUrl = (() => {
    try { return new URL(rawCallback).pathname; } catch { return rawCallback.startsWith("/") ? rawCallback : "/dashboard"; }
  })();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Invalid email or password" : `Sign in failed: ${result.error}`);
      setLoading(false);
      return;
    }
    if (!result?.ok) {
      setError("Sign in failed — please check your credentials and try again");
      setLoading(false);
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#080d1a" }}>
      <div className="w-full max-w-md glass rounded-3xl p-8" style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl">🌐</Link>
          <h1 className="text-2xl font-black gradient-text mt-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue learning</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email address" required value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          <input type="password" placeholder="Password" required value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-black transition-all disabled:opacity-50 hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          New to LinguaExec?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen" style={{ background: "#080d1a" }} />}><LoginForm /></Suspense>;
}

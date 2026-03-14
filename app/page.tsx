"use client";
import Link from "next/link";

const languages = [
  { flag: "🇸🇦", name: "Arabic", native: "العربية", learners: "12,400+", color: "from-green-500/20 to-emerald-600/20", border: "border-green-500/30" },
  { flag: "🇺🇸", name: "English", native: "English", learners: "28,900+", color: "from-blue-500/20 to-indigo-600/20", border: "border-blue-500/30" },
  { flag: "🇪🇸", name: "Spanish", native: "Español", learners: "19,200+", color: "from-red-500/20 to-orange-600/20", border: "border-red-500/30" },
];

const features = [
  { icon: "🤖", title: "AI Conversation Partner", desc: "Practice speaking with an AI tutor that corrects your mistakes in real-time, 24/7." },
  { icon: "⚡", title: "Micro-Lessons", desc: "5–15 minute sessions designed for packed schedules. Learn on the go, every day." },
  { icon: "💼", title: "Business Scenarios", desc: "Role-play real executive situations: board meetings, negotiations, and client calls." },
  { icon: "📊", title: "Adaptive Progress", desc: "AI tracks your weak spots and optimizes your learning path automatically." },
  { icon: "🌍", title: "Cultural Intelligence", desc: "Learn business etiquette and cultural nuances alongside the language." },
  { icon: "🔄", title: "Spaced Repetition", desc: "Smart review system ensures vocabulary sticks long-term with minimal effort." },
];

const testimonials = [
  { name: "Sarah Chen", role: "CEO, TechVentures", quote: "I closed a deal in Spanish after just 3 weeks. The business scenarios are incredibly realistic.", avatar: "SC" },
  { name: "Ahmed Al-Rashid", role: "VP Strategy, Gulf Corp", quote: "Learning Arabic for my Dubai expansion was seamless. The AI tutor never gets impatient.", avatar: "AA" },
  { name: "Marcus Weber", role: "Managing Director, EuroFund", quote: "Finally a language app that understands executive time constraints. 10 minutes a day, real results.", avatar: "MW" },
];

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <span className="text-xl font-bold gradient-text">LinguaExec</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
            <a href="#languages" className="hover:text-amber-400 transition-colors">Languages</a>
            <a href="#testimonials" className="hover:text-amber-400 transition-colors">Success Stories</a>
          </div>
          <Link href="/onboarding"
            className="px-5 py-2 rounded-full text-sm font-semibold text-black transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
            Start Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass gold-border mb-8 text-sm text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Powered by Claude AI · No human tutors needed
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Master Any Language.<br />
            <span className="gradient-text">On Your Schedule.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered language learning built for executives. Arabic, English, Spanish —
            in 10 minutes a day with zero human dependency.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/onboarding"
              className="px-8 py-4 rounded-full text-lg font-bold text-black transition-all hover:scale-105 gold-glow"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
              Get Started Free →
            </Link>
            <Link href="/dashboard"
              className="px-8 py-4 rounded-full text-lg font-semibold text-slate-300 glass glass-hover transition-all">
              View Dashboard
            </Link>
          </div>

          {/* Floating language badges */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[["🇸🇦 Arabic", "0s"], ["🇺🇸 English", "1s"], ["🇪🇸 Spanish", "2s"]].map(([lang, delay]) => (
              <div key={lang} className="px-5 py-3 rounded-full glass gold-border text-lg font-medium animate-float" style={{ animationDelay: delay }}>
                {lang}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "60K+", label: "Active Learners" },
            { value: "94%", label: "Success Rate" },
            { value: "3 Langs", label: "Supported" },
            { value: "100% AI", label: "No Humans Needed" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
              <div className="text-slate-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Languages */}
      <section id="languages" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">Choose Your Language</h2>
          <p className="text-slate-400 text-center mb-12">Three languages. Unlimited potential.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {languages.map((lang) => (
              <Link key={lang.name} href="/onboarding"
                className={`p-8 rounded-2xl glass glass-hover border ${lang.border} transition-all hover:scale-105 group`}>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${lang.color} flex items-center justify-center text-3xl mb-4`}>
                  {lang.flag}
                </div>
                <h3 className="text-xl font-bold mb-1">{lang.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{lang.native}</p>
                <div className="text-xs text-amber-400">{lang.learners} executives learning →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">Everything You Need</h2>
          <p className="text-slate-400 text-center mb-16">All AI. No excuses. No waiting.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl glass glass-hover transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">Trusted by Leaders</h2>
          <p className="text-slate-400 text-center mb-16">Real executives. Real results.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl glass gold-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-16 gold-border">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl font-black mb-4">Ready to Get Fluent?</h2>
          <p className="text-slate-400 mb-8">Join 60,000+ executives already learning with AI. Start speaking in days, not years.</p>
          <Link href="/onboarding"
            className="inline-block px-10 py-5 rounded-full text-xl font-bold text-black transition-all hover:scale-105 gold-glow"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
            Start Your Journey →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-slate-600 text-sm border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🌐</span>
          <span className="font-bold text-slate-400">LinguaExec</span>
        </div>
        <p>AI-powered language learning for the modern executive · Powered by Claude AI</p>
      </footer>
    </div>
  );
}

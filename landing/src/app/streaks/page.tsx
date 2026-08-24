import Link from "next/link";
import { Flame, Award, Share2, Sparkles, ArrowLeft, CheckCircle2, Trophy, Quote, Smartphone, Globe, Laptop } from "lucide-react";

export default function StreaksPage() {
  const achievements = [
    { title: "Gothic Connoisseur 🏰", desc: "Read or listened to 3 chilling Gothic masterworks.", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30", iconColor: "text-amber-500" },
    { title: "Stoic Philosopher 📜", desc: "Mastered ancient wisdom by completing Meditations.", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", iconColor: "text-emerald-500" },
    { title: "Night Owl Listener 🌙", desc: "Enjoyed an audiobook session past 10 PM with rain soundscapes.", color: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/30", iconColor: "text-purple-500" },
    { title: "Trilingual Polyglot 🌐", desc: "Switched between English, Spanish, and French editions.", color: "from-sky-500/20 to-sky-500/5", border: "border-sky-500/30", iconColor: "text-sky-500" },
    { title: "Streak Titan 🔥", desc: "Maintained a 7-day consecutive reading streak on Liiro.", color: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/30", iconColor: "text-rose-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-black font-serif tracking-tight">Liiro</span>
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-500/20 flex items-center gap-1">
              <Flame size={12} className="text-amber-500" /> STREAKS & BADGES
            </span>
          </div>

          <a
            href="http://localhost:8086"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-full shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles size={14} /> Open App
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Flame size={15} className="text-amber-500 animate-pulse" /> Daily Reading Streaks & Social Sharing Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-serif tracking-tight text-white leading-tight">
            Build Unstoppable Reading Habits. <br />
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              Share Your Journey with 1-Tap Quote Cards.
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Stay motivated with daily 15-minute goal flame tracking, unlock prestige literary badges, and export stunning aesthetic quote cards directly to Instagram Stories or X.
          </p>

          {/* Cross Platform Availability Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Laptop size={14} className="text-amber-400" /> Available on Web
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Smartphone size={14} className="text-indigo-400" /> Available on iOS
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Globe size={14} className="text-sky-400" /> Available on Android
            </span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Flame Streaks Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-amber-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Flame size={26} />
            </div>
            <h3 className="text-xl font-bold font-serif text-white">Daily Flame Streaks</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track consecutive active reading days with 🔥 flame badges. Set custom daily goals (15m–60m) and never break the chain.
            </p>
          </div>

          {/* Achievement Badges Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Trophy size={26} />
            </div>
            <h3 className="text-xl font-bold font-serif text-white">Milestone Badges</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Unlock prestige badges as you complete masterworks in Gothic horror, Stoic philosophy, or multi-language editions.
            </p>
          </div>

          {/* Quote Cards Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-rose-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Share2 size={26} />
            </div>
            <h3 className="text-xl font-bold font-serif text-white">1-Tap Quote Exporter</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Select any quote from Jekyll & Hyde or Meditations, choose an aesthetic template (Gothic Gold, Sepia), and share directly to social media.
            </p>
          </div>
        </div>
      </section>

      {/* Badges Gallery */}
      <section className="py-16 px-6 max-w-5xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-3xl">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-black font-serif">Unlock Prestige Reader Badges</h2>
          <p className="text-slate-400 text-sm">Earn prestige recognition for your literary explorations</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <div key={ach.title} className={`bg-gradient-to-b ${ach.color} border ${ach.border} p-6 rounded-2xl space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-serif text-white">{ach.title}</span>
                <CheckCircle2 size={18} className={ach.iconColor} />
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{ach.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 text-center px-6">
        <div className="max-w-3xl mx-auto space-y-8 bg-gradient-to-tr from-amber-500/10 via-indigo-600/10 to-violet-600/10 p-12 rounded-3xl border border-amber-500/20">
          <h2 className="text-3xl sm:text-4xl font-black font-serif text-white">Start Your Reading Streak Today</h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
            Join thousands of classic book lovers building daily reading habits on Liiro Ebook & Audiobooks.
          </p>

          <a
            href="http://localhost:8086"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-sm rounded-full shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <Sparkles size={18} /> Launch Liiro App
          </a>
        </div>
      </section>
    </div>
  );
}

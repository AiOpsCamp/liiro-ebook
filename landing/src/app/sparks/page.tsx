"use client";

import React from "react";
import Link from "next/link";
import { Zap, Sparkles, Headphones, ArrowRight, ShieldCheck, CheckCircle2, Smartphone, Globe, Monitor } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LiiroSparksPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/5 dark:via-zinc-950 dark:to-zinc-950 border-b border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 mb-6">
            <Zap size={14} />
            <span>SIGNATURE FEATURE</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            ⚡ Liiro Sparks: 15-Min Executive Audio Summaries
          </h1>

          <p className="text-slate-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Master the core wisdom, key quotes, and executive takeaways of long literary masterworks in under 15 minutes. Perfect for busy commuters and fast learners.
          </p>

          {/* Cross-Platform Badge */}
          <div className="inline-flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-bold shadow-lg mb-10">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Monitor size={15} /> <span>Web</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-sky-400">
              <Smartphone size={15} /> <span>iOS</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Smartphone size={15} /> <span>Android</span>
            </div>
            <span>•</span>
            <span className="text-slate-300">Available Anytime, Anywhere</span>
          </div>

          <div className="flex justify-center gap-4">
            <a
              href="http://localhost:8086/summary/the-strange-case-of-dr-jekyll-and-mr-hyde"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-full shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Zap size={16} />
              Try Dr. Jekyll Sparks Now ❯
            </a>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-slate-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xl mb-4">
                5-7
              </div>
              <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-2">Key Insight Cards</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Breakdown of central themes, character motivations, and historical context summarized into 5 to 7 bullet point insight cards.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xl mb-4">
                🎧
              </div>
              <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-2">15-Min Audio Stream</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Professional voice narration synthesizing the entire story into a 15-minute executive summary for on-the-go listening.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xl mb-4">
                1-Tap
              </div>
              <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-2">Jump to Full Book</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Loved the Sparks summary? Tap 'Read Full Book' anytime to seamlessly transition into the complete unabridged masterwork.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

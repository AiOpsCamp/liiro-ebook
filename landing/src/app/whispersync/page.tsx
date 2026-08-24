"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Sparkles, Smartphone, Monitor, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function WhispersyncPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      <section className="py-20 bg-gradient-to-b from-sky-500/10 via-white to-white dark:from-sky-500/5 dark:via-zinc-950 dark:to-zinc-950 border-b border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-sky-500 bg-sky-500/10 border border-sky-500/20 mb-6">
            <BookOpen size={14} />
            <span>KARAOKE AUDIO ALIGNMENT</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            🎤 Whispersync Karaoke Text Sync
          </h1>

          <p className="text-slate-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Experience real-time word and sentence-level karaoke text highlighting synchronized with Kokoro Neural TTS narration across English 🇬🇧, Spanish 🇪🇸, and French 🇫🇷 editions.
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
              href="http://localhost:8086/details/the-strange-case-of-dr-jekyll-and-mr-hyde"
              className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-sm rounded-full shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
            >
              <BookOpen size={16} />
              Try Whispersync Karaoke Now ❯
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

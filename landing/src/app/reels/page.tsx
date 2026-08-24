"use client";

import React from "react";
import Link from "next/link";
import { Film, Sparkles, Smartphone, Monitor, Play, Heart, Bookmark, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BookReelsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      <section className="py-20 bg-gradient-to-b from-indigo-500/10 via-white to-white dark:from-indigo-500/5 dark:via-zinc-950 dark:to-zinc-950 border-b border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Film size={14} />
            <span>VISUAL DISCOVERY ENGINE</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            🎥 Book Reels: Short Video & Quote Feed
          </h1>

          <p className="text-slate-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Experience books visually through Instagram & TikTok-style 60fps vertical video teasers, ambient quote cards, narrator previews, and instant 1-tap book switching.
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
              href="http://localhost:8086/reels"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-full shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <Film size={16} />
              Open Reels Feed ❯
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

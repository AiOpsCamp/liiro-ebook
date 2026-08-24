"use client";

import React from "react";
import Link from "next/link";
import { Car, Sparkles, Smartphone, Monitor, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CarModePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      <section className="py-20 bg-gradient-to-b from-emerald-500/10 via-white to-white dark:from-emerald-500/5 dark:via-zinc-950 dark:to-zinc-950 border-b border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Car size={14} />
            <span>SAFE DRIVING UI</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            🚗 Audible-Style Driving Car Mode
          </h1>

          <p className="text-slate-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Listen safely on the road with an ultra-high contrast dark canvas, giant 96px touch targets, 76px skip controls, and 1-tap driving bookmarks.
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
              href="http://localhost:8086/car-mode/the-strange-case-of-dr-jekyll-and-mr-hyde"
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-full shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Car size={16} />
              Open Car Mode Player ❯
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

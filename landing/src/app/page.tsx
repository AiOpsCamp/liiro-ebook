"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  Star, 
  ArrowRight, 
  Check, 
  BookOpen, 
  Film, 
  Zap, 
  Car, 
  ShieldCheck, 
  Globe2, 
  Sparkles,
  CloudRain,
  Activity,
  Heart,
  Users
} from "lucide-react";

import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [activeSoundscape, setActiveSoundscape] = useState("Rain on Windowpane");

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex flex-col lg:flex-row relative w-full lg:min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-slate-50 dark:from-zinc-900/40 dark:via-zinc-950 dark:to-zinc-950">
        
        {/* Left Column (Hero Copy & CTAs) */}
        <div className="flex-1 flex flex-col items-center lg:items-start justify-center p-8 md:p-16 lg:p-20 z-10 text-center lg:text-left">
          <div className="w-full max-w-[620px] flex flex-col items-center lg:items-start">
            
            {/* Top Eyebrow Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="tracking-widest uppercase">THE NEXT-GEN EBOOK & AUDIOBOOK SAAS</span>
            </motion.div>

            {/* Title & Headline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <h1 className="font-serif text-[42px] sm:text-[56px] lg:text-[64px] font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white mb-4">
                Read, listen, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-indigo-500 to-violet-500">experience</span> masterworks.
              </h1>
            </motion.div>
            
            {/* Subtext description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[16px] sm:text-[18px] text-slate-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-[540px]"
            >
              Immerse yourself in unabridged classics with Whispersync Karaoke alignment, 15-Minute Blinkist Key Takeaway audio summaries, Ambient Reading Soundscapes, and short Book Reels.
            </motion.p>
            
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <a
                href="http://localhost:8086"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-base rounded-full shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Launch Web App ❯
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="http://localhost:8086/reels"
                className="w-full sm:w-auto px-6 py-4 border border-amber-500/30 hover:border-amber-500 text-amber-500 font-bold text-sm rounded-full transition-all text-center flex items-center justify-center gap-2"
              >
                <Film size={18} />
                Watch Book Reels
              </a>
            </motion.div>

            {/* Feature Highlights Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 pt-8 border-t border-slate-200/60 dark:border-zinc-800/60 w-full flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">4.9/5 Rating</span>
              </div>
              <div className="hidden sm:block w-[1px] h-4 bg-slate-200 dark:bg-zinc-800"></div>
              <div className="flex items-center gap-1.5">
                <Globe2 size={15} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">EN • ES • FR</span>
              </div>
              <div className="hidden sm:block w-[1px] h-4 bg-slate-200 dark:bg-zinc-800"></div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-indigo-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">5 Family PIN Profiles</span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Right Column (Interactive Feature Card Preview) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 relative">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[480px] bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col p-6 gap-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">NOW PLAYING</span>
                <h3 className="font-bold text-lg text-white">Dr. Jekyll and Mr. Hyde</h3>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-full">
                Whispersync 🎤
              </span>
            </div>

            {/* Karaoke Sentence Preview */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-sm leading-relaxed text-slate-400">
                Mr. Utterson the lawyer was a man of a rugged countenance that was never lighted by a smile; cold, scanty and embarrassed in discourse; backward in sentiment...
              </p>
              <p className="text-sm leading-relaxed text-amber-400 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                “Man is not truly one, but truly two.”
              </p>
            </div>

            {/* Ambient Soundscapes Switcher */}
            <div>
              <span className="text-xs font-bold text-slate-400 mb-2 block">AMBIENT SOUNDSCAPE</span>
              <div className="flex flex-wrap gap-2">
                {["Rain on Windowpane", "Cozy Fireplace", "Gothic Library"].map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveSoundscape(name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      activeSoundscape === name
                        ? "bg-amber-500 text-slate-950 border-amber-400"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    🌧️ {name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* 7 Signature Pillars Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-amber-400 font-bold text-xs tracking-widest uppercase mb-3 block">
              7 SIGNATURE TECHNICAL PILLARS
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">
              Why Liiro is the Ultimate Ebook & Audiobook Platform
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pillar 1: Blinks */}
            <div id="blinks" className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all">
              <Zap className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">⚡ 15-Min Blinkist Key Takeaways</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Master long masterworks in under 15 minutes with 5–7 bullet point key insight cards and high-speed audio summaries.
              </p>
              <a href="http://localhost:8086/summary/the-strange-case-of-dr-jekyll-and-mr-hyde" className="text-amber-400 text-xs font-bold hover:underline">
                Try Summary Mode ❯
              </a>
            </div>

            {/* Pillar 2: Book Reels */}
            <div id="reels" className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all">
              <Film className="w-10 h-10 text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">🎥 Short Video Book Reels Feed</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Instagram & TikTok-style 60fps vertical swipeable feed featuring video clips, quote cards, and 1-tap direct book switching.
              </p>
              <a href="http://localhost:8086/reels" className="text-indigo-400 text-xs font-bold hover:underline">
                Explore Feed ❯
              </a>
            </div>

            {/* Pillar 3: Whispersync */}
            <div id="whispersync" className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all">
              <BookOpen className="w-10 h-10 text-sky-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">🎤 Whispersync Karaoke Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Real-time sentence and word-level forced alignment generated via OpenAI Whisper and Kokoro Neural TTS.
              </p>
              <span className="text-sky-400 text-xs font-bold">EN • ES • FR Editions</span>
            </div>

            {/* Pillar 4: Ambient Soundscapes */}
            <div id="soundscapes" className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all">
              <CloudRain className="w-10 h-10 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">🌧️ Ambient Soundscapes Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Mix high-fidelity Hetzner S3 soundscapes (Rain, Fireplace, Forest, Coffee Shop, Library) underneath narration.
              </p>
              <span className="text-emerald-400 text-xs font-bold">Dual-Audio Volume Mixer</span>
            </div>

            {/* Pillar 5: Car Mode */}
            <div id="carmode" className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all">
              <Car className="w-10 h-10 text-amber-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">🚗 Audible Driving Car Mode</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                High-contrast driving canvas with giant 96px touch targets and 1-tap bookmarks for hands-free driving playback.
              </p>
              <a href="http://localhost:8086/car-mode/the-strange-case-of-dr-jekyll-and-mr-hyde" className="text-amber-500 text-xs font-bold hover:underline">
                View Driving Mode ❯
              </a>
            </div>

            {/* Pillar 6: Family Profiles */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all">
              <Users className="w-10 h-10 text-violet-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">👨‍👩‍👧 5 Family Profiles & PIN Lock</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Support for 5 isolated sub-accounts per subscription with 4-digit PIN lock and age-tiered Kids Mode (0-12 yrs).
              </p>
              <span className="text-violet-400 text-xs font-bold">Parental PIN Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-amber-500 font-bold text-xs tracking-widest uppercase mb-3 block">
            TRANSPARENT PRICING
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-16">
            Choose Your Liiro Reader Tier
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-left shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Basic Reader</h3>
              <p className="text-sm text-slate-500 mb-6">Perfect for single readers & commuters</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$9.99</span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-zinc-300 mb-8">
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Full Unabridged Masterworks Library</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Whispersync Karaoke Audio Sync</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> 15-Min Blinkist Audio Summaries</li>
              </ul>
              <a href="http://localhost:8086" className="w-full block text-center py-3.5 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 text-white font-bold text-sm rounded-full transition-all">
                Get Started
              </a>
            </div>

            {/* Plan 2 */}
            <div className="bg-gradient-to-b from-amber-500/10 to-indigo-600/10 border-2 border-amber-500 rounded-3xl p-8 text-left shadow-xl relative">
              <span className="absolute -top-3.5 right-6 px-3 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-full">
                MOST POPULAR
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Family & Pro</h3>
              <p className="text-sm text-slate-500 mb-6">Full family sharing & premium tools</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$19.99</span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-zinc-300 mb-8">
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> 5 Isolated Family Sub-Accounts</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> 4-Digit PIN Lock & Kids Mode</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Book Reels Feed & Ambient Soundscapes</li>
              </ul>
              <a href="http://localhost:8086" className="w-full block text-center py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-full transition-all shadow-md shadow-amber-500/20">
                Start 14-Day Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <Footer />
    </div>
  );
}

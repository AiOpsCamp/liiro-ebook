"use client";

import Link from "next/link";
import { BookOpen, Film, Zap, Car, Shield, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-slate-200/60 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Liiro <span className="text-amber-500 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 font-sans font-bold">EBOOK & AUDIO</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-zinc-400">
          <Link href="/reels" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <Film size={15} className="text-amber-500" />
            Book Reels
          </Link>
          <Link href="/sparks" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            <Zap size={15} className="text-indigo-500" />
            Liiro Sparks ⚡
          </Link>
          <Link href="/whispersync" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5">
            <BookOpen size={15} className="text-sky-500" />
            Whispersync
          </Link>
          <Link href="/car-mode" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Car size={15} className="text-emerald-500" />
            Car Mode
          </Link>
          <Link href="/categories" className="hover:text-primary transition-colors">
            Catalog
          </Link>
          <Link href="/#pricing" className="hover:text-primary transition-colors">
            Pricing
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <a
            href="http://localhost:8086"
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-sm rounded-full shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            Open Web App
          </a>
        </div>
      </div>
    </header>
  );
}

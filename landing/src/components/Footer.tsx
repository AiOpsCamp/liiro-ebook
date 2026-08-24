"use client";

import Link from "next/link";
import { Sparkles, BookOpen, Headphones, Shield, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-lg">
                L
              </div>
              <span className="font-serif text-xl font-bold text-white">Liiro Ebook & Audio</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              The next-generation SaaS platform for unabridged masterworks with Whispersync Karaoke, 15-Min Blinks summaries, Ambient Soundscapes, and short Book Reels.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-wider uppercase">Features</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/whispersync" className="hover:text-amber-400 transition-colors">Whispersync Karaoke</Link></li>
              <li><Link href="/sparks" className="hover:text-amber-400 transition-colors">Liiro Sparks ⚡ (15-Min Summaries)</Link></li>
              <li><Link href="/reels" className="hover:text-amber-400 transition-colors">Book Reels Feed</Link></li>
              <li><Link href="/car-mode" className="hover:text-amber-400 transition-colors">Audible Driving Car Mode</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-wider uppercase">Library</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="http://localhost:8086" className="hover:text-amber-400 transition-colors">Gothic Fiction & Horror</Link></li>
              <li><Link href="http://localhost:8086" className="hover:text-amber-400 transition-colors">Victorian Masterworks</Link></li>
              <li><Link href="http://localhost:8086" className="hover:text-amber-400 transition-colors">Philosophy & Ethics</Link></li>
              <li><Link href="http://localhost:8086" className="hover:text-amber-400 transition-colors">Children's Illustrated Classics</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-wider uppercase">Subscription</h4>
            <p className="text-sm text-slate-400 mb-4">
              Get unlimited access to 1,000+ unabridged classics, Whispersync audio, and 5 family profiles.
            </p>
            <a
              href="http://localhost:8086"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-full transition-all"
            >
              <Sparkles size={14} />
              Start Free Trial
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Liiro Ebook & Audiobook Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

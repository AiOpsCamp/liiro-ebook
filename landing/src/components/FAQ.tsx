"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What makes Liiro different from Audible or Blinkist?",
    answer: "Audible only offers full audiobooks, and Blinkist only offers summaries. Liiro gives you both in one platform! You can master any book in 15 minutes with Key Takeaway Blinks, or dive into the full unabridged eBook & audiobook with Whispersync Karaoke alignment.",
  },
  {
    question: "What is Whispersync Karaoke Text Sync?",
    answer: "Whispersync synchronizes text reading with Kokoro Neural TTS speech in real-time. Words and sentences highlight automatically as the voice narrator speaks across English, Spanish, and French editions.",
  },
  {
    question: "How do Book Reels work?",
    answer: "Book Reels is an Instagram/TikTok-style 60fps vertical video feed where readers can discover short dramatic book teasers, visual quote cards, and narrator previews. Every reel features a 1-tap 'Read Full Book ❯' button.",
  },
  {
    question: "What are Ambient Reading Soundscapes?",
    answer: "Liiro features a built-in dual audio engine that layers ambient background soundscapes (Rain on Windowpane, Fireplace Crackle, Mystic Forest, Coffee Shop, Victorian Gothic Library) underneath your audiobook narration.",
  },
  {
    question: "How does the Family Profiles PIN lock work?",
    answer: "Each Liiro subscription includes up to 5 isolated sub-accounts. Parents can set a 4-digit PIN lock on adult profiles and activate age-tiered Kids Mode (0-3, 3-6, 6-9, 9-12 years).",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-slate-50 dark:bg-zinc-900/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-amber-500 font-bold text-xs tracking-widest uppercase mb-2 block">
            Got Questions?
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white text-base hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60 pt-4">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

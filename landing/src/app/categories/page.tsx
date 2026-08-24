"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  Globe2, 
  Star,
  CheckCircle2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface EbookItem {
  id: string;
  title: string;
  author: string;
  genre: string;
  coverUrl: string;
  badge: string;
  description: string;
  audioDuration: string;
  languages: string[];
  slug: string;
}

const CATALOG_BOOKS: EbookItem[] = [
  // Gothic Fiction
  {
    id: "jekyll-hyde",
    title: "Dr. Jekyll and Mr. Hyde",
    author: "Robert Louis Stevenson",
    genre: "Gothic Fiction & Horror",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
    badge: "Whispersync 🎤",
    description: "A dark Victorian inquiry into the duality of human nature, morality, and subconscious desires.",
    audioDuration: "3h 15m",
    languages: ["🇬🇧 EN", "🇪🇸 ES", "🇫🇷 FR"],
    slug: "the-strange-case-of-dr-jekyll-and-mr-hyde",
  },
  {
    id: "frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    genre: "Gothic Fiction & Horror",
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800",
    badge: "Multi-Voice Audio 🎙️",
    description: "Mary Shelley's foundational sci-fi masterpiece exploring creation, ambition, and isolation.",
    audioDuration: "8h 40m",
    languages: ["🇬🇧 EN", "🇪🇸 ES"],
    slug: "frankenstein-or-the-modern-prometheus",
  },
  {
    id: "dracula",
    title: "Dracula",
    author: "Bram Stoker",
    genre: "Gothic Fiction & Horror",
    coverUrl: "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=800",
    badge: "15-Min Blinks ⚡",
    description: "The seminal epistolary vampire novel chronicling Count Dracula's attempt to move from Transylvania to England.",
    audioDuration: "16h 10m",
    languages: ["🇬🇧 EN"],
    slug: "dracula",
  },

  // Victorian Romance & Drama
  {
    id: "pride-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Victorian Romance",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800",
    badge: "Full eBook + Audio 🎧",
    description: "Jane Austen's witty romantic masterpiece following Elizabeth Bennet and Mr. Darcy.",
    audioDuration: "11h 55m",
    languages: ["🇬🇧 EN", "🇪🇸 ES", "🇫🇷 FR"],
    slug: "pride-and-prejudice",
  },
  {
    id: "jane-eyre",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    genre: "Victorian Romance",
    coverUrl: "https://images.unsplash.com/photo-1474939557548-f842486be195?q=80&w=800",
    badge: "Whispersync 🎤",
    description: "An intense emotional journey of independence, moral integrity, and passion at Thornfield Hall.",
    audioDuration: "19h 20m",
    languages: ["🇬🇧 EN"],
    slug: "jane-eyre",
  },
  {
    id: "wuthering-heights",
    title: "Wuthering Heights",
    author: "Emily Brontë",
    genre: "Victorian Romance",
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800",
    badge: "15-Min Blinks ⚡",
    description: "A wild, tempestuous tale of passion and revenge on the Yorkshire moors between Heathcliff and Catherine.",
    audioDuration: "14h 30m",
    languages: ["🇬🇧 EN"],
    slug: "wuthering-heights",
  },

  // Mystery & Detectives
  {
    id: "sherlock-holmes",
    title: "The Adventures of Sherlock Holmes",
    author: "Sir Arthur Conan Doyle",
    genre: "Mystery & Detectives",
    coverUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800",
    badge: "Multi-Voice Audio 🎙️",
    description: "The classic collection of 12 detective mysteries featuring Sherlock Holmes and Dr. John Watson.",
    audioDuration: "10h 15m",
    languages: ["🇬🇧 EN", "🇪🇸 ES"],
    slug: "the-adventures-of-sherlock-holmes",
  },
  {
    id: "monte-cristo",
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    genre: "Mystery & Detectives",
    coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800",
    badge: "Full eBook + Audio 🎧",
    description: "An epic tale of betrayal, false imprisonment, escape, and meticulous vengeance in 19th-century Europe.",
    audioDuration: "46h 50m",
    languages: ["🇬🇧 EN", "🇫🇷 FR"],
    slug: "the-count-of-monte-cristo",
  },

  // Fantasy & Wonder
  {
    id: "alice-wonderland",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    genre: "Fantasy & Wonder",
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800",
    badge: "Multi-Voice Audio 🎙️",
    description: "Step down the rabbit hole into a surreal world of nonsensical logic, Cheshire Cats, and Mad Hatters.",
    audioDuration: "2h 45m",
    languages: ["🇬🇧 EN", "🇪🇸 ES", "🇫🇷 FR"],
    slug: "alices-adventures-in-wonderland",
  },
  {
    id: "peter-pan",
    title: "Peter Pan",
    author: "J.M. Barrie",
    genre: "Fantasy & Wonder",
    coverUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800",
    badge: "15-Min Blinks ⚡",
    description: "Fly away to Neverland with Peter, Wendy, Tinker Bell, and Captain Hook in this timeless fantasy.",
    audioDuration: "4h 10m",
    languages: ["🇬🇧 EN"],
    slug: "peter-pan",
  },

  // Philosophy & Ethics
  {
    id: "meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    genre: "Philosophy & Stoicism",
    coverUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800",
    badge: "15-Min Blinks ⚡",
    description: "Private Stoic journal entries of the Roman Emperor Marcus Aurelius on duty, resilience, and inner peace.",
    audioDuration: "5h 05m",
    languages: ["🇬🇧 EN", "🇪🇸 ES"],
    slug: "meditations",
  },
  {
    id: "art-of-war",
    title: "The Art of War",
    author: "Sun Tzu",
    genre: "Philosophy & Stoicism",
    coverUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800",
    badge: "15-Min Blinks ⚡",
    description: "Ancient Chinese military treatise offering timeless tactical principles on strategy and conflict resolution.",
    audioDuration: "1h 15m",
    languages: ["🇬🇧 EN"],
    slug: "the-art-of-war",
  },

  // Epic Literature & Sea Adventure
  {
    id: "moby-dick",
    title: "Moby Dick",
    author: "Herman Melville",
    genre: "Epic Literature",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
    badge: "Whispersync 🎤",
    description: "Captain Ahab's obsessive pursuit of the white whale Moby Dick across the treacherous open oceans.",
    audioDuration: "21h 30m",
    languages: ["🇬🇧 EN"],
    slug: "moby-dick",
  },
  {
    id: "treasure-island",
    title: "Treasure Island",
    author: "Robert Louis Stevenson",
    genre: "Epic Literature",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800",
    badge: "Multi-Voice Audio 🎙️",
    description: "The definitive pirate adventure starring Jim Hawkins, Long John Silver, and buried treasure.",
    audioDuration: "6h 45m",
    languages: ["🇬🇧 EN", "🇪🇸 ES"],
    slug: "treasure-island",
  },
];

const GENRE_CATEGORIES = [
  "All Masterworks",
  "Gothic Fiction & Horror",
  "Victorian Romance",
  "Mystery & Detectives",
  "Fantasy & Wonder",
  "Philosophy & Stoicism",
  "Epic Literature",
];

export default function MasterworkCatalogPage() {
  const [selectedGenre, setSelectedGenre] = useState("All Masterworks");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = CATALOG_BOOKS.filter((book) => {
    const matchesGenre = selectedGenre === "All Masterworks" || book.genre === selectedGenre;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      {/* Hero Header Banner */}
      <section className="py-16 bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/5 dark:via-zinc-950 dark:to-zinc-950 border-b border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 mb-4">
            <BookOpen size={14} />
            <span>100% AUTHENTIC LITERARY MASTERWORKS</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            Explore 1,000+ Timeless Classics
          </h1>

          {/* Hard-hitting Anti-AI Marketing Manifesto Hook */}
          <div className="max-w-3xl mx-auto bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 text-left mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shrink-0 mt-1">
                💡
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Don't Waste Your Time Listening to Shallow, AI-Generated Summary Rubbish
                </h3>
                <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  Unlike platforms serving low-quality AI auto-generated summaries, Liiro gives you real depth, masterly prose, and authentic human wisdom. Experience full unabridged classics or curated 15-minute executive summaries narrated by professional voice talent.
                </p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books by title, author, or keyword..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Filter Tabs & Catalog Grid */}
      <section className="py-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Genre Category Pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {GENRE_CATEGORIES.map((genre) => {
              const isActive = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>

          {/* Ebook Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all group"
              >
                <div>
                  <div className="flex gap-4 mb-4">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-24 h-36 object-cover rounded-2xl shadow-md border border-slate-200 dark:border-zinc-800 shrink-0 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-extrabold rounded-full mb-2">
                        {book.badge}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1 truncate">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-3">
                        {book.author}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Headphones size={12} className="text-amber-500" />
                          {book.audioDuration}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                    {book.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {book.languages.map((lang) => (
                      <span key={lang} className="text-[10px] font-bold px-2 py-0.5 bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={`http://localhost:8086/details/${book.slug}`}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-2xl text-center transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  Read & Listen Full Book ❯
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Search, Sparkles } from "lucide-react";

// Category data with matching colors and Unsplash images
const categories = [
  {
    id: "tension",
    name: "Tension",
    group: "Fiction",
    bgColor: "bg-[#d8b4fe]", // Light purple
    image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400&auto=format&fit=crop",
    description: "Suspense, thrillers, and mystery novels that keep you on edge.",
  },
  {
    id: "novels",
    name: "Novels",
    group: "Fiction",
    bgColor: "bg-[#e0e7ff]", // Light blue-indigo
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop",
    description: "Contemporary and classic literary fiction from top authors.",
  },
  {
    id: "information",
    name: "Information",
    group: "Non-Fiction",
    bgColor: "bg-[#fef08a]", // Light yellow
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop",
    description: "Expand your mind with science, research, and factual knowledge.",
  },
  {
    id: "love",
    name: "Love",
    group: "Fiction",
    bgColor: "bg-[#ffedd5]", // Light peach/orange
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop",
    description: "Warm, passionate, and emotional romantic journeys.",
  },
  {
    id: "biographies",
    name: "Biographies",
    group: "Non-Fiction",
    bgColor: "bg-[#fecaca]", // Light red
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400&auto=format&fit=crop",
    description: "Inspiring lives, memoirs, and personal stories of remarkable people.",
  },
  {
    id: "true-crime",
    name: "True Crime",
    group: "Non-Fiction",
    bgColor: "bg-[#fbcfe8]", // Light pink
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop",
    description: "Real-life mysteries, detective investigations, and dark chronicles.",
  },
  {
    id: "fantasy",
    name: "Fantasy",
    group: "Fiction",
    bgColor: "bg-[#dcfce7]", // Light green
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop",
    description: "Epic tales of magic, dragons, mythical worlds, and adventure.",
  },
  {
    id: "issue",
    name: "Issue",
    group: "Non-Fiction",
    bgColor: "bg-[#e9d5ff]", // Light violet
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=400&auto=format&fit=crop",
    description: "Social discussions, politics, economics, and contemporary issues.",
  },
  // Extra categories
  {
    id: "sci-fi",
    name: "Sci-Fi",
    group: "Fiction",
    bgColor: "bg-[#c084fc]", // Purple-magenta
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop",
    description: "Futuristic technology, space exploration, and dystopian societies.",
  },
  {
    id: "history",
    name: "History",
    group: "Non-Fiction",
    bgColor: "bg-[#fed7aa]", // Light orange
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400&auto=format&fit=crop",
    description: "Journey back in time to explore the events that shaped our world.",
  },
  {
    id: "self-development",
    name: "Self-Development",
    group: "Non-Fiction",
    bgColor: "bg-[#ccfbf1]", // Light teal
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop",
    description: "Improve your health, habits, mindfulness, and personal growth.",
  },
  {
    id: "kids",
    name: "Kids",
    group: "Kids & Young Adult",
    bgColor: "bg-[#bfdbfe]", // Light blue
    image: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?q=80&w=400&auto=format&fit=crop",
    description: "Fun stories, fairytales, and educational books for children.",
  },
  {
    id: "young-adult",
    name: "Young Adult",
    group: "Kids & Young Adult",
    bgColor: "bg-[#f5d0fe]", // Light fuchsia
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop",
    description: "Relatable stories, coming-of-age journeys, and modern YA drama.",
  },
  {
    id: "business",
    name: "Business & Money",
    group: "Non-Fiction",
    bgColor: "bg-[#cbd5e1]", // Slate-gray
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop",
    description: "Strategy, investment, start-ups, and career acceleration advice.",
  },
];

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const groups = ["All", "Fiction", "Non-Fiction", "Kids & Young Adult"];

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            cat.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === "All" || cat.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [searchQuery, selectedGroup]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fafafa] text-black">
      <Navbar />


              {/* Hero Header */}
      <section className="py-20 px-6 flex flex-col items-center justify-center text-center bg-white border-b border-gray-100">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-3 bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
        >
          <Sparkles size={14} /> Discover Your Next Listen
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-[48px] sm:text-[64px] font-bold tracking-tight text-slate-900 mb-4"
        >
          Categories
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-slate-500 text-[16px] sm:text-lg max-w-lg mb-10"
        >
          Browse one of our categories to find your perfect audiobook or e-book.
        </motion.p>

        {/* Search & Filter Controls */}
        <div className="w-full max-w-2xl px-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-slate-100 text-black border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-primary transition-all text-[15px]"
            />
          </div>
          
          {/* Quick Group Filters */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1 shrink-0">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedGroup === group
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-800 border-gray-200 hover:border-gray-400"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <main className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-16 flex-1">
        {filteredCategories.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((cat) => {
                const colorHex = cat.bgColor.replace("bg-[", "").replace("]", "");
                return (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group bg-white border rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all duration-300"
                    style={{ borderColor: colorHex }}
                  >
                  {/* Colored Header image area */}
                  <div className={`relative h-[220px] w-full ${cat.bgColor} flex items-center justify-center p-6 overflow-hidden`}>
                    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Text Details Area */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans font-bold text-lg text-gray-900 group-hover:text-black transition-colors">
                          {cat.name}
                        </span>
                        <div className="text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                        {cat.group}
                      </span>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="w-full text-center py-20">
            <p className="text-gray-500 text-lg">No categories found matching your criteria.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedGroup("All"); }}
              className="mt-4 px-6 py-2.5 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Headphones, BookOpen, ArrowRight, ChevronLeft, ChevronRight, Languages } from "lucide-react";

const books = [
  {
    id: 1,
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600",
    tags: ["A2", "B1"],
    language: "French",
    badge: "Most Popular",
  },
  {
    id: 2,
    title: "El Aleph",
    author: "Jorge Luis Borges",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
    tags: ["B2", "C1"],
    language: "Spanish",
    badge: "Classic",
  },
  {
    id: 3,
    title: "Die Verwandlung",
    author: "Franz Kafka",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1614113489855-66422ad300a4?auto=format&fit=crop&q=80&w=600",
    tags: ["B1", "B2"],
    language: "German",
    badge: "Must Read",
  },
  {
    id: 4,
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1474932430478-367d16b99031?auto=format&fit=crop&q=80&w=600",
    tags: ["B2"],
    language: "Japanese",
    badge: "Trending",
  },
  {
    id: 5,
    title: "Il Nome della Rosa",
    author: "Umberto Eco",
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600",
    tags: ["C1"],
    language: "Italian",
    badge: "Advanced",
  },
  {
    id: 6,
    title: "O Alquimista",
    author: "Paulo Coelho",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600",
    tags: ["A2", "B1"],
    language: "Portuguese",
    badge: "Beginner Friendly",
  },
  {
    id: 7,
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600",
    tags: ["C1", "C2"],
    language: "Russian",
    badge: "Mastery",
  },
];

export default function BookCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-zinc-950 text-white py-24 flex flex-col items-center overflow-hidden border-t border-zinc-900">
      {/* Header Area */}
      <div className="max-w-3xl px-6 flex flex-col items-center text-center mb-16">
        <span className="text-[11px] font-bold tracking-widest text-primary uppercase block mb-3">LANGUAGE LIBRARY</span>
        <h2 className="font-serif text-[42px] sm:text-[56px] font-bold tracking-tight mb-6">
          Explore the world in its own words
        </h2>
        <p className="text-[15px] sm:text-base text-gray-400 leading-relaxed mb-8 max-w-2xl">
          Dive into our curated library of bilingual books, graded readers, and historical classics. 
          Each book features synchronized native audio and interactive vocabulary tracking to ensure 
          you learn while you read.
        </p>
        <a
          href="/categories"
          className="text-[15px] text-gray-300 hover:text-primary underline underline-offset-4 transition-colors font-medium flex items-center gap-2"
        >
          <Languages size={16} />
          Browse all 20+ languages
        </a>
      </div>

      {/* Carousel Wrapper and controls */}
      <div className="w-full max-w-[1400px] px-6 md:px-12 lg:px-20 mb-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-white hover:text-primary transition-colors font-bold text-lg">
          Trending Books <ArrowRight size={18} className="text-primary" />
        </a>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll("left")}
            className="p-2 border border-zinc-800 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="p-2 border border-zinc-800 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scroller */}
      <div 
        ref={containerRef}
        className="w-full pl-6 md:pl-12 lg:pl-20 flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar pb-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {books.map((book, idx) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="flex-shrink-0 w-[190px] sm:w-[230px] snap-start flex flex-col gap-3 group cursor-pointer"
          >
            {/* Premium Dark Card Container */}
            <div className="bg-zinc-900 border border-zinc-800/80 p-3.5 rounded-2xl flex flex-col h-[340px] relative transition-all duration-300 group-hover:-translate-y-2 group-hover:border-primary/50 group-hover:shadow-[0_10px_30px_rgba(80,70,230,0.15)]">
              {/* Top Icons */}
              <div className="flex items-center justify-between mb-3 text-zinc-400 px-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {book.language}
                </div>
                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  <Headphones size={15} />
                  <BookOpen size={15} />
                </div>
              </div>

              {/* Cover Image */}
              <div className="relative w-full flex-1 mb-3 bg-zinc-800 rounded-xl overflow-hidden shadow-inner">
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 190px, 230px"
                />
                
                {/* Custom Styled Badge */}
                <div className="absolute top-0 right-0 bg-primary/90 backdrop-blur-sm text-white text-[9px] font-extrabold px-3 py-1.5 rounded-bl-xl flex items-center justify-center">
                  <span className="tracking-wider uppercase">{book.badge}</span>
                </div>

                <div className="absolute bottom-2 right-2 flex gap-1">
                  {book.tags.map(tag => (
                    <div key={tag} className="bg-zinc-950/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-800">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>

              {/* Title & Author inside card */}
              <div className="flex flex-col px-1">
                <h3 className="text-zinc-100 text-[14px] font-bold leading-snug line-clamp-1 group-hover:text-white transition-colors">{book.title}</h3>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-zinc-500 text-[12px] line-clamp-1">{book.author}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-bold text-zinc-300">{book.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {/* Empty padding element for end of scroll */}
        <div className="flex-shrink-0 w-6 md:w-12 lg:w-20"></div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}

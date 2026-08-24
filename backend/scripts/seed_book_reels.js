"use strict";

require("dotenv").config();
const connectDB = require("../src/db/connect");
const BookReel = require("../src/models/BookReel.model");

async function seedBookReels() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Book Reels Seeding...");

    await BookReel.deleteMany({});

    const sampleReels = [
      {
        storySlug: "the-strange-case-of-dr-jekyll-and-mr-hyde",
        storyTitle: "The Strange Case of Dr. Jekyll and Mr. Hyde",
        bookTitlePill: "📖 Dr. Jekyll & Mr. Hyde",
        creatorName: "Liiro Originals",
        creatorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
        mediaType: "video",
        mediaUrl: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/fireplace_crackle.mp3",
        posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
        caption: "“Man is not truly one, but truly two.” Discover Robert Louis Stevenson's Gothic masterpiece on the dual nature of man and Victorian repression.",
        likesCount: 1420,
        commentsCount: 88,
        sharesCount: 310,
        tags: ["gothic", "classics", "psychology"],
        isFeatured: true,
      },
      {
        storySlug: "alices-adventures-in-wonderland",
        storyTitle: "Alice's Adventures in Wonderland",
        bookTitlePill: "📖 Alice in Wonderland",
        creatorName: "Goodreads Curator",
        creatorAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
        mediaType: "image",
        mediaUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800",
        audioUrl: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/rain_windowpane.mp3",
        caption: "“Curiouser and curiouser!” Step down the rabbit hole into a surreal world where logic and language defy adult rules.",
        likesCount: 2850,
        commentsCount: 142,
        sharesCount: 520,
        tags: ["fantasy", "classics", "adventure"],
        isFeatured: true,
      },
      {
        storySlug: "frankenstein-or-the-modern-prometheus",
        storyTitle: "Frankenstein",
        bookTitlePill: "📖 Frankenstein",
        creatorName: "Voice Actor Adam",
        creatorAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
        mediaType: "image",
        mediaUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800",
        audioUrl: "https://multicamp-prod-storage.nbg1.your-objectstorage.com/Liiro-Ebook-Prod/ambient/gothic_library.mp3",
        caption: "“Beware; for I am fearless, and therefore powerful.” Mary Shelley's tragic tale of creation and isolation.",
        likesCount: 980,
        commentsCount: 45,
        sharesCount: 190,
        tags: ["horror", "gothic", "sci-fi"],
        isFeatured: true,
      },
    ];

    await BookReel.insertMany(sampleReels);
    console.log("✅ Successfully seeded 3 high-performance Book Reels!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding book reels:", error);
    process.exit(1);
  }
}

seedBookReels();

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../projects/langoreads/.env") });

const uri = process.env.MONGO_URL || "mongodb://admin:PROD_PASSWORD_2026@127.0.0.1:27017/langoread_prod?authSource=admin";

const SERIES_DEFINITIONS = [
  {
    title: "Sherlock Holmes Canon",
    slug: "sherlock-holmes-canon",
    author: "Arthur Conan Doyle",
    description: "The complete world-famous detective stories featuring Sherlock Holmes and Dr. John H. Watson at 221B Baker Street.",
    regexes: [/sherlock|scarlet|sign-of-the-four|baskervilles|valley-of-fear|his-last-bow/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/arthur-conan-doyle_the-adventures-of-sherlock-holmes@master/src/epub/images/cover.jpg"
  },
  {
    title: "The Oz Chronicles",
    slug: "the-oz-chronicles",
    author: "L. Frank Baum",
    description: "The magical adventures in the Land of Oz with Dorothy, the Scarecrow, Tin Woodman, Cowardly Lion, and Princess Ozma.",
    regexes: [/wizard-of-oz|land-of-oz|ozma-of-oz|dorothy-and-the-wizard|road-to-oz|emerald-city/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/l-frank-baum_the-wonderful-wizard-of-oz@master/src/epub/images/cover.jpg"
  },
  {
    title: "Barsoom & John Carter Saga",
    slug: "barsoom-john-carter-saga",
    author: "Edgar Rice Burroughs",
    description: "The epic planetary romance saga of John Carter on the dying red planet Mars (Barsoom).",
    regexes: [/princess-of-mars|gods-of-mars|warlord-of-mars|thuvia-maid-of-mars|chessmen-of-mars|moon-maid/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/edgar-rice-burroughs_a-princess-of-mars@master/src/epub/images/cover.jpg"
  },
  {
    title: "The Jungle Book Collection",
    slug: "the-jungle-book-collection",
    author: "Rudyard Kipling",
    description: "Tales of Mowgli, Baloo, Bagheera, Shere Khan, and classic animal fables in the Indian jungle.",
    regexes: [/jungle-book|just-so-stories/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/rudyard-kipling_the-jungle-book@master/src/epub/images/cover.jpg"
  },
  {
    title: "Anne of Green Gables Series",
    slug: "anne-of-green-gables-series",
    author: "L. M. Montgomery",
    description: "The beloved stories of spirited orphan Anne Shirley growing up on Prince Edward Island.",
    regexes: [/anne-of-green-gables|anne-of-avonlea|anne-of-the-island|annes-house-of-dreams/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/l-m-montgomery_anne-of-green-gables@master/src/epub/images/cover.jpg"
  },
  {
    title: "Father Brown Mysteries",
    slug: "father-brown-mysteries",
    author: "G. K. Chesterton",
    description: "The classic detective mysteries solved by the quiet, deeply intuitive Roman Catholic priest Father Brown.",
    regexes: [/father-brown/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/g-k-chesterton_the-innocence-of-father-brown@master/src/epub/images/cover.jpg"
  },
  {
    title: "Doctor Dolittle Series",
    slug: "doctor-dolittle-series",
    author: "Hugh Lofting",
    description: "The whimsical adventures of Dr. John Dolittle, the physician who speaks animal languages.",
    regexes: [/doctor-dolittle/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/hugh-lofting_the-story-of-doctor-dolittle@master/src/epub/images/cover.jpg"
  },
  {
    title: "The Princess & Curdie Tales",
    slug: "the-princess-and-curdie-tales",
    author: "George MacDonald",
    description: "The foundational high fantasy tales of Princess Irene, Curdie the miner boy, and mountain goblins.",
    regexes: [/princess-and-the-goblin|princess-and-curdie/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/george-macdonald_the-princess-and-the-goblin@master/src/epub/images/cover.jpg"
  },
  {
    title: "Scientific Romances & Sci-Fi Classics",
    slug: "scientific-romances-wells",
    author: "H. G. Wells",
    description: "Pioneering science fiction masterworks exploring time travel, alien invasions, and invisible men.",
    regexes: [/time-machine|war-of-the-worlds|invisible-man|island-of-doctor-moreau|first-men-in-the-moon|in-the-days-of-the-comet/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/h-g-wells_the-time-machine@master/src/epub/images/cover.jpg"
  },
  {
    title: "Tarzan of the Apes Saga",
    slug: "tarzan-saga",
    author: "Edgar Rice Burroughs",
    description: "The iconic jungle adventure series of John Clayton, Lord Greystoke, raised by great apes.",
    regexes: [/tarzan/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/edgar-rice-burroughs_tarzan-of-the-apes@master/src/epub/images/cover.jpg"
  },
  {
    title: "Extraordinary Voyages (Voyages Extraordinaires)",
    slug: "extraordinary-voyages-verne",
    author: "Jules Verne",
    description: "High-adventure science and exploration novels across sea, land, air, and space.",
    regexes: [/eighty-days|journey-to-the-center|leagues-under-the-seas|mysterious-island|from-the-earth-to-the-moon|round-the-moon/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/jules-verne_around-the-world-in-eighty-days_george-makepeace-towle@master/src/epub/images/cover.jpg"
  },
  {
    title: "Jeeves & Psmith Humor Series",
    slug: "jeeves-and-psmith-series",
    author: "P. G. Wodehouse",
    description: "Brilliant comedic tales of Bertie Wooster, his peerless valet Jeeves, and smooth-talking Psmith.",
    regexes: [/jeeves|psmith|uneasy-money|damsel-in-distress/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/p-g-wodehouse_a-damsel-in-distress@master/src/epub/images/cover.jpg"
  },
  {
    title: "Emily of New Moon Trilogy",
    slug: "emily-of-new-moon-trilogy",
    author: "L. M. Montgomery",
    description: "The poignant coming-of-age trilogy of young aspiring writer Emily Byrd Starr.",
    regexes: [/emily-of-new-moon|emily-climbs|emilys-quest/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/l-m-montgomery_anne-of-green-gables@master/src/epub/images/cover.jpg"
  },
  {
    title: "Agatha Christie Detective Classics",
    slug: "agatha-christie-detective-classics",
    author: "Agatha Christie",
    description: "Masterful detective mysteries featuring Hercule Poirot and Tommy and Tuppence.",
    regexes: [/roger-ackroyd|secret-of-chimneys|mysterious-affair-at-styles|the-man-in-the-brown-suit/i],
    coverImageUrl: "https://cdn.jsdelivr.net/gh/standardebooks/agatha-christie_the-murder-of-roger-ackroyd@master/src/epub/images/cover.jpg"
  }
];

async function populateBookSeries() {
  await mongoose.connect(uri);
  const Story = require("../projects/langoreads/models/Story.model.js");
  const BookSeries = require("../projects/langoreads/models/BookSeries.model.js");

  const allStories = await Story.find({ isPublished: true }).lean();
  console.log(`📚 Scanning ${allStories.length} books in DB to build Book Series...`);

  let totalSeriesCreated = 0;

  for (const def of SERIES_DEFINITIONS) {
    const matchedBookIds = [];

    for (const story of allStories) {
      const match = def.regexes.some((rx) => rx.test(story.slug) || rx.test(story.title?.en || story.title || ""));
      if (match) {
        matchedBookIds.push(story._id);
      }
    }

    if (matchedBookIds.length > 0) {
      await BookSeries.findOneAndUpdate(
        { slug: def.slug },
        {
          title: { en: def.title },
          slug: def.slug,
          author: def.author,
          description: { en: def.description },
          coverImageUrl: def.coverImageUrl,
          books: matchedBookIds,
          bookCount: matchedBookIds.length,
          isPublished: true,
          isFeatured: true
        },
        { upsert: true, new: true }
      );

      totalSeriesCreated++;
      console.log(`  📚 [Series #${totalSeriesCreated}] '${def.title}' — ${matchedBookIds.length} Books Grouped (Slug: ${def.slug})`);
    }
  }

  console.log("\n==================================================");
  console.log(`🏆 BOOK SERIES POPULATION COMPLETE!`);
  console.log(`   Total Curated Book Series Created: ${totalSeriesCreated}`);
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(0);
}

populateBookSeries().catch((err) => {
  console.error("❌ Error populating series:", err);
  process.exit(1);
});

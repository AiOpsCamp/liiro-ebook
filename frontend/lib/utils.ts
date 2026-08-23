import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "./colors";

// Lazy-load SecureStore only on native platforms
let SecureStore: any = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

export function cn(...inputs: any) {
  return twMerge(clsx(inputs));
}

// Save the token — uses SecureStore on native, AsyncStorage on web
async function saveToken(key: string, value: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

// Get the token
async function getToken(key: string) {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

// Delete the token
async function deleteToken(key: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// Generate a UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEVICE_ID_KEY = "unique_device_id";

// Get or create a unique device ID that persists across app reinstalls
async function getUniqueDeviceId(): Promise<string> {
  try {
    let existingId: string | null = null;
    if (Platform.OS === "web") {
      existingId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    } else {
      existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    }
    if (existingId) {
      return existingId;
    }

    // Generate new UUID and store it
    const newId = generateUUID();
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    } else {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    }
    return newId;
  } catch (error) {
    console.error("Error getting/setting device ID:", error);
    // Fallback to a generated ID (won't persist if storage fails)
    return generateUUID();
  }
}

export const secureUrl = (url = "") =>
  url?.startsWith("http://") ? url?.replace("http://", "https://") : url;

interface LanguageAndCountry {
  language: string;
  country: string;
  flag: string;
}

export const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const getSafeUrl = (url?: unknown): string | undefined => {
  // Guard non-string inputs: some term/example audio fields can arrive as
  // objects/Maps (multi-language) rather than a plain URL string.
  if (typeof url !== "string" || url.length === 0) return undefined;
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  if (url.startsWith("//")) return `https:${url}`;
  return url;
};

export const languagesAndCountry: LanguageAndCountry[] = [
  { language: "Spanish", country: "Spain", flag: "https://flagcdn.com/w160/es.png" },
  { language: "French", country: "France", flag: "https://flagcdn.com/w160/fr.png" },
  { language: "German", country: "Germany", flag: "https://flagcdn.com/w160/de.png" },
  { language: "Italian", country: "Italy", flag: "https://flagcdn.com/w160/it.png" },
  { language: "Portuguese", country: "Portugal", flag: "https://flagcdn.com/w160/pt.png" },
  { language: "Dutch", country: "Netherlands", flag: "https://flagcdn.com/w160/nl.png" },
  { language: "English", country: "United Kingdom", flag: "https://flagcdn.com/w160/gb.png" },
  { language: "Swedish", country: "Sweden", flag: "https://flagcdn.com/w160/se.png" },
  { language: "Danish", country: "Denmark", flag: "https://flagcdn.com/w160/dk.png" },
  { language: "Finnish", country: "Finland", flag: "https://flagcdn.com/w160/fi.png" },
  { language: "Estonian", country: "Estonia", flag: "https://flagcdn.com/w160/ee.png" },
  { language: "Bulgarian", country: "Bulgaria", flag: "https://flagcdn.com/w160/bg.png" },
  { language: "Croatian", country: "Croatia", flag: "https://flagcdn.com/w160/hr.png" },
  { language: "Czech", country: "Czech Republic", flag: "https://flagcdn.com/w160/cz.png" },
  { language: "Greek", country: "Greece", flag: "https://flagcdn.com/w160/gr.png" },
  { language: "Hungarian", country: "Hungary", flag: "https://flagcdn.com/w160/hu.png" },
  { language: "Irish", country: "Ireland", flag: "https://flagcdn.com/w160/ie.png" },
  { language: "Latvian", country: "Latvia", flag: "https://flagcdn.com/w160/lv.png" },
  { language: "Lithuanian", country: "Lithuania", flag: "https://flagcdn.com/w160/lt.png" },
  { language: "Maltese", country: "Malta", flag: "https://flagcdn.com/w160/mt.png" },
  { language: "Polish", country: "Poland", flag: "https://flagcdn.com/w160/pl.png" },
  { language: "Romanian", country: "Romania", flag: "https://flagcdn.com/w160/ro.png" },
  { language: "Slovak", country: "Slovakia", flag: "https://flagcdn.com/w160/sk.png" },
  { language: "Slovenian", country: "Slovenia", flag: "https://flagcdn.com/w160/si.png" },
  { language: "Russian", country: "Russia", flag: "https://flagcdn.com/w160/ru.png" },
  { language: "Norwegian", country: "Norway", flag: "https://flagcdn.com/w160/no.png" },
  { language: "Icelandic", country: "Iceland", flag: "https://flagcdn.com/w160/is.png" },
  { language: "Ukrainian", country: "Ukraine", flag: "https://flagcdn.com/w160/ua.png" },
  { language: "Bengali", country: "Bangladesh", flag: "https://flagcdn.com/w160/bd.png" },
  { language: "Chinese", country: "China", flag: "https://flagcdn.com/w160/cn.png" },
  { language: "Japanese", country: "Japan", flag: "https://flagcdn.com/w160/jp.png" },
  { language: "Bangla", country: "Bangladesh", flag: "https://flagcdn.com/w160/bd.png" },
  { language: "Serbian", country: "Serbia", flag: "https://flagcdn.com/w160/rs.png" },
  { language: "Faroese", country: "Faroe Islands", flag: "https://flagcdn.com/w160/fo.png" },
  { language: "Korean", country: "South Korea", flag: "https://flagcdn.com/w160/kr.png" },
  { language: "Arabic", country: "Saudi Arabia", flag: "https://flagcdn.com/w160/sa.png" },
  {
    language: "Bosnian",
    country: "Bosnia and Herzegovina",
    flag: "https://flagcdn.com/w160/ba.png",
  },
  { language: "Hindi", country: "India", flag: "https://flagcdn.com/w160/in.png" },
  { language: "Turkish", country: "Turkey", flag: "https://flagcdn.com/w160/tr.png" },
  { language: "Vietnamese", country: "Vietnam", flag: "https://flagcdn.com/w160/vn.png" },
  { language: "Belarusian", country: "Belarus", flag: "https://flagcdn.com/w160/by.png" },
  { language: "Catalan", country: "Andorra", flag: "https://flagcdn.com/w160/ad.png" },
  { language: "Macedonian", country: "North Macedonia", flag: "https://flagcdn.com/w160/mk.png" },
  { language: "Indonesian", country: "Indonesia", flag: "https://flagcdn.com/w160/id.png" },
  { language: "Chinese (Simplified)", country: "China", flag: "https://flagcdn.com/w160/cn.png" },
  { language: "Urdu", country: "Pakistan", flag: "https://flagcdn.com/w160/pk.png" },
  { language: "Hebrew", country: "Israel", flag: "https://flagcdn.com/w160/il.png" },
  { language: "Malay", country: "Malaysia", flag: "https://flagcdn.com/w160/my.png" },
  { language: "Swahili", country: "Kenya", flag: "https://flagcdn.com/w160/ke.png" },
  { language: "Thai", country: "Thailand", flag: "https://flagcdn.com/w160/th.png" },
  { language: "Filipino", country: "Philippines", flag: "https://flagcdn.com/w160/ph.png" },
  { language: "Persian", country: "Iran", flag: "https://flagcdn.com/w160/ir.png" },
  { language: "Galician", country: "Spain", flag: "https://flagcdn.com/w160/es.png" },
  { language: "Basque", country: "Spain", flag: "https://flagcdn.com/w160/es.png" },
  { language: "Afrikaans", country: "South Africa", flag: "https://flagcdn.com/w160/za.png" },
  { language: "Punjabi", country: "India", flag: "https://flagcdn.com/w160/in.png" },
  { language: "Tamil", country: "India", flag: "https://flagcdn.com/w160/in.png" },
  { language: "Telugu", country: "India", flag: "https://flagcdn.com/w160/in.png" },
  { language: "Gujarati", country: "India", flag: "https://flagcdn.com/w160/in.png" },
  { language: "Somali", country: "Somalia", flag: "https://flagcdn.com/w160/so.png" },
  { language: "Amharic", country: "Ethiopia", flag: "https://flagcdn.com/w160/et.png" },
  { language: "Hausa", country: "Nigeria", flag: "https://flagcdn.com/w160/ng.png" },
  { language: "Igbo", country: "Nigeria", flag: "https://flagcdn.com/w160/ng.png" },
  { language: "Yoruba", country: "Nigeria", flag: "https://flagcdn.com/w160/ng.png" },
  { language: "Nepali", country: "Nepal", flag: "https://flagcdn.com/w160/np.png" },
  { language: "Haitian Creole", country: "Haiti", flag: "https://flagcdn.com/w160/ht.png" },
  { language: "Irish", country: "Ireland", flag: "https://flagcdn.com/w160/ie.png" },
  { language: "Irish Gaelic", country: "Ireland", flag: "https://flagcdn.com/w160/ie.png" },
  { language: "Scottish Gaelic", country: "Scotland", flag: "https://flagcdn.com/w160/gb-sct.png" },
  { language: "Esperanto", country: "Constructed", flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Flag_of_Esperanto.svg/320px-Flag_of_Esperanto.svg.png" },
  { language: "Latin", country: "Vatican City", flag: "https://flagcdn.com/w160/va.png" },
  { language: "Zulu", country: "South Africa", flag: "https://flagcdn.com/w160/za.png" },
  { language: "ukrainian", country: "ukrainin", flag: "https://flagcdn.com/w160/ua.png" },
  { language: "Albanian", country: "Albania", flag: "https://flagcdn.com/w160/al.png" },
  { language: "Malayalam", country: "India", flag: "https://flagcdn.com/w160/in.png" },
  { language: "Welsh", country: "Wales", flag: "https://flagcdn.com/w160/gb-wls.png" },
  { language: "Chinese (Traditional)", country: "Taiwan", flag: "https://flagcdn.com/w160/tw.png" },
  { language: "Cantonese", country: "Hong Kong", flag: "https://flagcdn.com/w160/hk.png" },
  { language: "Javanese", country: "Indonesia", flag: "https://flagcdn.com/w160/id.png" },
  { language: "Kannada", country: "India", flag: "https://flagcdn.com/w160/in.png" },
  { language: "Sinhala", country: "Sri Lanka", flag: "https://flagcdn.com/w160/lk.png" },
];

export const getFlagUrl = (languageName: string): string => {
  if (!languageName) return "https://placehold.co/200x200.png";
  const name = languageName.toLowerCase().trim();
  const language = languagesAndCountry?.find((lang: any) => lang.language?.toLowerCase() === name);
  return language?.flag || "https://placehold.co/200x200.png";
};

const INTEREST_OPTIONS = [
  // Learning & Creativity
  "Reading",
  "Writing",
  "Art & Design",
  "Photography",
  "Music",
  "Film/TV",
  "Theatre",
  "DIY/Crafts",
  // Tech & Science
  "Tech",
  "Programming/Coding",
  "AI & Machine Learning",
  "Science",
  "Space/Astronomy",
  "Gaming",
  "Esports",
  // Lifestyle & Wellness
  "Fitness",
  "Yoga/Pilates",
  "Meditation/Mindfulness",
  "Self-care",
  "Mental health",
  "Nutrition",
  "Food/Cooking",
  "Baking",
  // Social & Culture
  "Languages",
  "Culture",
  "History",
  "Politics",
  "LGBTQ+",
  "Making friends",
  "Parenting",
  // Nature & Outdoors
  "Outdoors",
  "Hiking/Camping",
  "Animals",
  "Pets",
  "Gardening",
  "Climate change",
  "Sustainability/Environment",
  // Hobbies & Entertainment
  "Sports",
  "Travel",
  "Fashion",
  "Shopping",
  "Board Games/Tabletop",
  "Comics/Anime",
  "Astrology",
  // Work & Growth
  "Work life",
  "Entrepreneurship/Startups",
  "Finance/Investing",
  "Productivity",
  "Career development",
  "Studies/Academics",
  // Relationships & Lifestyle Goals
  "Romance",
  "Self-improvement",
  "Volunteering/Activism",
];

export const colors = { ...COLORS };

export { saveToken, getToken, deleteToken, INTEREST_OPTIONS, getUniqueDeviceId };

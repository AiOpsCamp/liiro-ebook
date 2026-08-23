// contentCache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseURL } from "@/config/config";
import { getToken } from "@/lib/utils";
import type { GroupedVocabularyData, ContentItem } from "@/types/content-types";

const DATA_KEY = "vocab:grouped";
const META_KEY = "vocab:grouped:meta";
const TTL = 2 * 24 * 60 * 60 * 1000; // 2 days

type Meta = { savedAt: number; staleAfter: number };

let snapshot: GroupedVocabularyData | null = null;
let meta: Meta | null = null;
let _isLoading = false;

let loadingFromDisk: Promise<void> | null = null;
let loadedFromDisk = false;

let inflight: Promise<GroupedVocabularyData | null> | null = null;

const DEBUG = false;
const log = (...a: any[]) => {
  if (DEBUG) console.log("[contentCache]", ...a);
};

// ---------- subscribe/emit ----------
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getSnapshot() {
  return snapshot;
}
export function getLoadingState() {
  return _isLoading;
}

// ---------- helpers ----------
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function isFresh(m: Meta | null) {
  return !!m && Date.now() < m.staleAfter;
}

// migrate legacy shapes -> grouped
function migrateIfNeeded(obj: any): GroupedVocabularyData | null {
  if (obj && typeof obj === "object" && obj.categories && typeof obj.categories === "object") {
    return obj as GroupedVocabularyData;
  }
  if (Array.isArray(obj)) {
    const packs = obj as ContentItem[];
    const grouped: GroupedVocabularyData = {
      metadata: { totalCategories: 0, totalLexiconPacks: packs.length, totalSubcategories: 0 },
      categories: {},
    };
    for (const p of packs) {
      const cat = p.category ?? "Uncategorized";
      const sub = p.subcategory ?? "General";
      grouped.categories[cat] ??= { categoryCount: 0, subcategories: {} };
      grouped.categories[cat].subcategories[sub] ??= { subcategoryCount: 0, packs: [] };
      grouped.categories[cat].subcategories[sub].packs.push(p);
    }
    for (const c of Object.values(grouped.categories)) {
      c.categoryCount = Object.values(c.subcategories).reduce((n, s) => n + s.packs.length, 0);
    }
    grouped.metadata.totalCategories = Object.keys(grouped.categories).length;
    grouped.metadata.totalSubcategories = Object.values(grouped.categories).reduce(
      (n, c) => n + Object.keys(c.subcategories).length,
      0
    );
    return grouped;
  }
  return null;
}

async function readDisk() {
  const [raw, metaRaw] = await AsyncStorage.multiGet([DATA_KEY, META_KEY]);
  const parsed = safeParse<any>(raw[1]);
  meta = safeParse<Meta>(metaRaw[1]);

  if (meta && !meta.staleAfter) {
    const savedAt = meta.savedAt || Date.now();
    meta = { savedAt, staleAfter: savedAt + TTL };
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  snapshot = migrateIfNeeded(parsed);
  log("readDisk -> hasData:", !!snapshot, "fresh:", isFresh(meta));
}

async function writeDisk(data: GroupedVocabularyData) {
  const now = Date.now();
  meta = { savedAt: now, staleAfter: now + TTL };
  snapshot = data;
  await AsyncStorage.multiSet([
    [DATA_KEY, JSON.stringify(data)],
    [META_KEY, JSON.stringify(meta)],
  ]);
  log("writeDisk -> savedAt:", meta.savedAt, "staleAfter:", meta.staleAfter);
}

async function fetchRemote(): Promise<GroupedVocabularyData> {
  const token = await getToken("token");
  const res = await fetch(`${getApiBaseURL()}/lexicon/vocabularyPacks/group`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Race-free: hydrate memory from disk and EMIT after it completes */
export async function ensureLoadedFromDisk() {
  if (loadedFromDisk) return;
  if (!loadingFromDisk) {
    _isLoading = true;
    emit();
    loadingFromDisk = (async () => {
      try {
        await readDisk();
      } finally {
        loadedFromDisk = true;
        _isLoading = false;
        emit(); // notify subscribers after snapshot is ready
      }
    })();
  }
  await loadingFromDisk;
}

/** Hard-gated revalidate: NO network if fresh and not forced */
export async function revalidate(opts: { force?: boolean } = {}) {
  const { force = false } = opts;

  // make sure disk hydration fully completed (awaits the promise)
  await ensureLoadedFromDisk();

  // hard gate
  if (!force && snapshot && isFresh(meta)) {
    log("revalidate -> hard cache hit (no network)");
    return snapshot;
  }

  // dedupe
  if (inflight) return inflight;

  _isLoading = !snapshot; // only show loading if no cached data
  if (_isLoading) emit();

  inflight = (async () => {
    try {
      log("revalidate -> fetching…");
      const data = await fetchRemote();
      await writeDisk(data);
      emit();
      return data;
    } catch {
      log("revalidate -> fetch failed, returning snapshot");
      return snapshot;
    } finally {
      _isLoading = false;
      inflight = null;
      emit();
    }
  })();

  return inflight;
}

export function getMeta() {
  return meta;
}
export async function clearCache() {
  snapshot = null;
  meta = null;
  loadedFromDisk = false;
  loadingFromDisk = null;
  inflight = null;
  await AsyncStorage.multiRemove([DATA_KEY, META_KEY]);
  emit();
}

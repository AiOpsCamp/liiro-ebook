import AsyncStorage from "@react-native-async-storage/async-storage";

export type ActivityDoc = {
  slug: number | string;
  name: string;
  image_url: string;
  activity: {
    [dateISO: string]: {
      [page: string]: { totalActive: number };
    };
  };
};

const keyForSlug = (slug: number | string) => `activity:${slug}`;

export function makeLocalDayISO(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const tzMin = start.getTimezoneOffset();
  const sign = tzMin > 0 ? "-" : "+";
  const abs = Math.abs(tzMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const YYYY = start.getFullYear();
  const MM = String(start.getMonth() + 1).padStart(2, "0");
  const DD = String(start.getDate()).padStart(2, "0");
  return `${YYYY}-${MM}-${DD}T00:00:00.000${sign}${hh}:${mm}`;
}

export async function readDoc(slug: number | string): Promise<ActivityDoc> {
  const raw = await AsyncStorage.getItem(keyForSlug(slug));
  if (!raw) return { slug, name: "", image_url: "", activity: {} };
  try {
    const p = JSON.parse(raw) as ActivityDoc;
    return {
      slug: p.slug ?? slug,
      name: p.name ?? "",
      image_url: p.image_url ?? "",
      activity: p.activity ?? {},
    };
  } catch {
    return { slug, name: "", image_url: "", activity: {} };
  }
}

export async function writeDoc(doc: ActivityDoc) {
  await AsyncStorage.setItem(keyForSlug(doc.slug), JSON.stringify(doc));
}

export async function upsertMeta(
  slug: number | string,
  meta: Partial<Pick<ActivityDoc, "name" | "image_url">>
) {
  const doc = await readDoc(slug);
  const next: ActivityDoc = {
    ...doc,
    name: meta.name ?? doc.name,
    image_url: meta.image_url ?? doc.image_url,
  };
  await writeDoc(next);
  return next;
}

export async function addActiveSeconds(
  slug: number | string,
  page: string,
  seconds: number,
  dateKey = makeLocalDayISO(new Date())
) {
  if (seconds <= 0) return readDoc(slug);
  const doc = await readDoc(slug);
  if (!doc.activity[dateKey]) doc.activity[dateKey] = {};
  if (!doc.activity[dateKey][page]) doc.activity[dateKey][page] = { totalActive: 0 };
  doc.activity[dateKey][page].totalActive += Math.floor(seconds);
  await writeDoc(doc);
  return doc;
}

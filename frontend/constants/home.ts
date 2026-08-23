// Matches the shape actually returned by mapPack() in
// multicamp-backend/src/modules/lexicon/controllers/lexicon.dashboard.controller.js —
// keep these in sync if that function's output changes.
export interface VocabularyPack {
  _id: string;
  // Some pack sources defensively fall back to `id` instead of `_id` — kept
  // optional here so those existing `p._id ?? p.id` call sites still compile.
  id?: string;
  slug: string;
  name: string;
  description?: string;
  category: string | null;
  categoryId?: string | null;
  moduleId?: string | null;
  image_url: string;
  free_access: boolean;
  freeAccess: boolean;
  level: string | null;
  difficulty: string | null;
  // Language(s) this pack's content is available in (e.g. ["fi"]). Only
  // populated once the backend's mapPack() includes it in its response.
  languages?: string[];
  isEnrolled?: boolean;
  isFavourite?: boolean;
  // Only populated for enrolled packs
  progressPercent?: number;
  isCompleted?: boolean;
  totalTerms?: number;
  totalLearned?: number;
  access: {
    free: boolean;
    premium: boolean;
  };
}

export interface Colors {
  lemonLeafDark: string;
  A2CA71Dark: string;
  forestCoreDark: string;
  sunbeamDark: string;
  white: string;
  gray700: string;
  blueDark: string;
  successDark: string;
}

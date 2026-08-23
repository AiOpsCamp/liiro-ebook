/**
 * Resolve the correct "start" route for an exercise based on its type(s).
 *
 * The Exercise model carries a `types` array (reading | listening | writing |
 * speaking); legacy documents may still expose a single `type`. Each type has
 * its own detail flow, so entry points (dashboard cards, "view all", etc.)
 * should route by type instead of assuming reading.
 */
export type ExerciseLike = {
  slug: string;
  type?: string | null;
  types?: string[] | null;
};

/** Lowercased, de-duped type list with a legacy single-`type` fallback. */
export function exerciseTypes(item: ExerciseLike): string[] {
  const raw =
    Array.isArray(item?.types) && item.types.length
      ? item.types
      : item?.type
      ? [item.type]
      : [];
  return Array.from(
    new Set(raw.map((t) => String(t || "").toLowerCase().trim()).filter(Boolean))
  );
}

/** Primary type used to pick a flow. Reading/listening take precedence over
 *  writing/speaking when an exercise is multi-type (they have richer readers). */
export function primaryExerciseType(item: ExerciseLike): string {
  const types = exerciseTypes(item);
  if (types.includes("dialogue")) return "dialogue";
  if (types.includes("reading")) return "reading";
  if (types.includes("listening")) return "listening";
  if (types.includes("writing")) return "writing";
  if (types.includes("speaking")) return "speaking";
  return types[0] || "reading";
}

/** Route object for the exercise's detail/start screen. */
export function getExerciseStartRoute(item: ExerciseLike): {
  pathname: string;
  params: { slug: string };
} {
  const type = primaryExerciseType(item);
  let pathname = "/reading/details/start";
  if (type === "writing") {
    pathname = "/writing/details/start";
  } else if (type === "listening") {
    pathname = "/listening/details/start";
  } else if (type === "dialogue") {
    pathname = `/dialogue/details/${item.slug}`;
  }
  return { pathname, params: { slug: item.slug } };
}

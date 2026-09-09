/**
 * Tag helpers. Tags are free text, so this trims them, collapses inner
 * whitespace, and drops duplicates (case-insensitively, keeping the first
 * spelling the user typed).
 */
export function normaliseTag(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = normaliseTag(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

/** Splits "sci-fi, slow burn" style input into individual tags. */
export function splitTags(input: string): string[] {
  return uniqueTags(input.split(/[,\n]/));
}

/** Case-insensitive membership test. */
export function hasTag(tags: string[], tag: string): boolean {
  const key = tag.toLowerCase();
  return tags.some((t) => t.toLowerCase() === key);
}

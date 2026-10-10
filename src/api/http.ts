// Shared plumbing for the lookup sources in ./lookup. Every request goes
// through getJson so they all get the same timeout and logging.
const TIMEOUT_MS = 10000;

// Rejects after a delay so a hung request fails instead of loading forever.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

interface GetJsonOptions {
  /** A key or token in the URL or headers, masked in the log. */
  secret?: string;
  headers?: Record<string, string>;
}

// Single request point, with a timeout and step-by-step logging (visible in the
// Metro terminal).
export async function getJson<T>(
  url: string,
  { secret, headers }: GetJsonOptions = {},
): Promise<T> {
  console.log('[lookup] GET', secret ? url.split(secret).join('***') : url);
  const res = await withTimeout(fetch(url, { headers }), TIMEOUT_MS);
  console.log('[lookup] status', res.status, 'ok:', res.ok);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

/**
 * Builds a query string, skipping empty values. Written out by hand because
 * the URLSearchParams that ships with React Native is incomplete.
 */
export function query(params: Record<string, string | number | undefined>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
}

/** First four-digit year in a date or year string, such as "2005-10-04". */
export function yearOf(value?: string | null): number | undefined {
  const match = value?.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : undefined;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Turns the HTML some sources return for a summary into plain text: line
 * breaks and paragraphs become newlines, other tags are dropped, and the
 * common entities are decoded.
 */
export function stripHtml(value?: string | null): string | undefined {
  if (!value) return undefined;
  const text = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&(\w+);/g, (whole, name) => ENTITIES[name] ?? whole)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text || undefined;
}

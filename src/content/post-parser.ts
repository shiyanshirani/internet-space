// Pure parsing, no Vite APIs: shared by the app (posts.ts, via import.meta.glob)
// and the build-time RSS plugin (via fs), so both see identical posts.

export type Post = {
  slug: string;
  title: string;
  /** ISO `YYYY-MM-DD` from the filename, or "" if the filename has no date. */
  date: string;
  tags: string[];
  body: string;
};

type Frontmatter = { title?: string; tags?: string[] };

/**
 * Minimal parser for the flat `key: value` / `key: [a, b]` frontmatter these
 * posts use. Deliberately not a full YAML parser (no nesting, no multiline
 * scalars) — a real YAML lib (e.g. js-yaml) would be the right call the
 * moment frontmatter grows past this shape.
 */
function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const [, frontmatter, content] = match;
  const data: Frontmatter = {};

  for (const line of frontmatter.split("\n")) {
    const lineMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!lineMatch) continue;
    const [, key, rawValue] = lineMatch;
    const value = rawValue.trim();

    if (key === "title") {
      data.title = value;
    } else if (key === "tags") {
      data.tags = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  return { data, content };
}

function filename(path: string): string {
  return path.split("/").pop() ?? "";
}

function slugFromFilename(path: string): string {
  return filename(path).replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{1,2}-/, "");
}

// ISO rather than a display string, so dates sort correctly as strings and
// can be handed to the RSS feed as real dates.
function dateFromFilename(path: string): string {
  const match = filename(path).match(/^(\d{4})-(\d{2})-(\d{1,2})-/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function parsePost(path: string, raw: string): Post {
  const { data, content } = parseFrontmatter(raw);
  const slug = slugFromFilename(path);
  return {
    slug,
    title: data.title ?? slug,
    date: dateFromFilename(path),
    tags: data.tags ?? [],
    body: content.trim(),
  };
}

/** Parse raw markdown files (keyed by path) into posts, newest first. */
export function parsePosts(files: Record<string, string>): Post[] {
  return Object.entries(files)
    .map(([path, raw]) => parsePost(path, raw))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Midnight UTC for an ISO post date; UTC so no timezone shifts the day. */
export function postDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function formatPostDate(iso: string): string {
  if (!iso) return "";
  return postDate(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

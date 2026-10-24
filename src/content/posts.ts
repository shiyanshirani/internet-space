export type Post = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  body: string;
};

const files = import.meta.glob("./posts/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

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

function slugFromFilename(path: string): string {
  const name = path.split("/").pop() ?? "";
  return name.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{1,2}-/, "");
}

function dateFromFilename(path: string): string {
  const name = path.split("/").pop() ?? "";
  const match = name.match(/^(\d{4})-(\d{2})-(\d{1,2})-/);
  if (!match) return "";
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw);
    return {
      slug: slugFromFilename(path),
      title: data.title ?? slugFromFilename(path),
      date: dateFromFilename(path),
      tags: data.tags ?? [],
      body: content.trim(),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

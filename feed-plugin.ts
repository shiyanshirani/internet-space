import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Feed } from "feed";
import type { Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Plugin } from "vite";
import { parsePosts, postDate, type Post } from "./src/content/post-parser";
import { remarkKramdownIal } from "./src/content/remark-kramdown-ial";

const EXCERPT_LENGTH = 280;

export type FeedConfig = {
  /** Absolute origin the site is served from, e.g. https://example.com (no trailing slash). */
  siteUrl: string;
  postsDir: string;
  title: string;
  description: string;
  author: string;
};

function readPostFiles(dir: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const path of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
    if (path.endsWith(".md")) files[path] = readFileSync(join(dir, path), "utf8");
  }
  return files;
}

// Same kramdown handling as the rendered site, so `{:target="_blank"}` markers
// don't leak into excerpts.
const markdownParser = unified().use(remarkParse).use(remarkKramdownIal);

function paragraphText(node: RootContent): string {
  if (node.type !== "paragraph") return "";
  return toString(node, { includeImageAlt: false }).replace(/\s+/g, " ").trim();
}

// First paragraph with real text (posts often open with an image-only
// paragraph), cut at a word boundary.
function excerpt(markdown: string): string {
  // The kramdown plugin only annotates nodes, so the tree is still a Root.
  const tree = markdownParser.runSync(markdownParser.parse(markdown)) as Root;
  const text = tree.children.map(paragraphText).find(Boolean) ?? "";
  if (text.length <= EXCERPT_LENGTH) return text;
  return `${text.slice(0, text.lastIndexOf(" ", EXCERPT_LENGTH))}…`;
}

function buildFeed(posts: Post[], config: FeedConfig): string {
  // Undated posts have no pubDate to give feed readers; they stay site-only.
  const dated = posts.filter((post) => post.date);

  const feed = new Feed({
    id: `${config.siteUrl}/`,
    link: `${config.siteUrl}/`,
    title: config.title,
    description: config.description,
    language: "en",
    updated: dated.length ? postDate(dated[0].date) : undefined,
    feedLinks: { rss: `${config.siteUrl}/feed.xml` },
    author: { name: config.author, link: `${config.siteUrl}/` },
    copyright: `© ${config.author}`,
  });

  for (const post of dated) {
    const url = `${config.siteUrl}/${post.slug}`;
    feed.addItem({
      id: url,
      link: url,
      title: post.title,
      date: postDate(post.date),
      description: excerpt(post.body),
      category: post.tags.map((tag) => ({ name: tag })),
    });
  }

  return feed.rss2();
}

const FEED_FILE = "feed.xml";

function renderFeed(config: FeedConfig): string {
  return buildFeed(parsePosts(readPostFiles(config.postsDir)), config);
}

/**
 * Emits `feed.xml` (RSS 2.0) into the build output from the markdown posts,
 * and serves it from the dev server too.
 */
export function rssFeed(config: FeedConfig): Plugin {
  return {
    name: "rss-feed",
    configureServer(server) {
      // Without this the dev server's SPA fallback answers /feed.xml with
      // index.html. Rebuilt per request so post edits show up immediately.
      server.middlewares.use(`/${FEED_FILE}`, (_req, res) => {
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.end(renderFeed(config));
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: FEED_FILE, source: renderFeed(config) });
    },
  };
}

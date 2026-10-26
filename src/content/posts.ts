import { parsePosts, type Post } from "@/content/post-parser";

export type { Post };

const files = import.meta.glob("./posts/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const posts: Post[] = parsePosts(files);

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/**
 * Blog post data layer.
 *
 * Posts are stored as JSON objects in content/blog/.
 * Each file is a .json with frontmatter-style metadata + body content.
 *
 * To add a new post: create a .json file in content/blog/ with:
 * {
 *   "slug": "how-to-find-mahjong-near-you",
 *   "title": "How to Find Mahjong Games Near You",
 *   "description": "A complete guide to finding mahjong...",
 *   "date": "2026-04-01",
 *   "author": "Jack",
 *   "category": "Guide",
 *   "image": "/images/blog/mahjong-guide.jpg",  // optional
 *   "body": "Full article content here. Supports basic HTML."
 * }
 */

import * as fs from "fs";
import * as path from "path";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  image: string | null;
  body: string;
}

let _cachedPosts: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (_cachedPosts) return _cachedPosts;

  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));
  const posts: BlogPost[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const post = JSON.parse(raw) as BlogPost;
      if (post.slug && post.title && post.body) {
        posts.push(post);
      }
    } catch {
      console.warn(`Failed to parse blog post: ${file}`);
    }
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  _cachedPosts = posts;
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  return getAllPosts().find((p) => p.slug === slug) || null;
}

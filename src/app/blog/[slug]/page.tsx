import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

/** Strip dangerous HTML tags and event handlers from blog content (defense-in-depth) */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|button|link|meta|base|applet)[\s>][^]*?>/gi, "")
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      ...(post.image ? { images: [post.image] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-hotpink-500">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/blog" className="hover:text-hotpink-500">Blog</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 truncate">{post.title}</span>
      </nav>

      <article>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-hotpink-500 uppercase tracking-wider">{post.category}</span>
            <span className="text-xs text-slate-400">
              {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-xs text-slate-400">by {post.author}</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-slate-500">{post.description}</p>
        </div>

        {post.image && (
          <img src={post.image} alt="" className="w-full rounded-xl mb-8" />
        )}

        <div
          className="prose prose-slate max-w-none prose-headings:font-[family-name:var(--font-heading)] prose-a:text-hotpink-500 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
        />
      </article>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-hotpink-500 hover:text-hotpink-600">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    </div>
  );
}

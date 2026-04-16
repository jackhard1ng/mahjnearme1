import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

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
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      ...(post.image ? { images: [post.image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.image ? { images: [post.image] } : {}),
    },
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "MahjNearMe",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    articleSection: post.category,
    ...(post.image ? { image: post.image.startsWith("http") ? post.image : `${SITE_URL}${post.image}` } : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
          <Image
            src={post.image}
            alt={post.title}
            width={1200}
            height={630}
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="w-full h-auto rounded-xl mb-8"
          />
        )}

        <div
          className="prose prose-slate max-w-none prose-headings:font-[family-name:var(--font-heading)] prose-a:text-hotpink-500 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.body }}
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

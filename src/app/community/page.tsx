"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getCitiesWithGames } from "@/lib/mock-data";
import { slugify, getStateName } from "@/lib/utils";
import {
  MessageSquare,
  MapPin,
  ThumbsUp,
  Flag,
  Plus,
  X,
  Send,
  Loader2,
  Shield,
  ChevronRight,
  Search,
  Users,
  ArrowRight,
} from "lucide-react";
import type { ForumPost } from "@/types";

const allCities = getCitiesWithGames();

export default function CommunityPage() {
  const { user, userProfile, isContributor } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredCities = citySearch
    ? allCities.filter(
        (c) =>
          c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
          getStateName(c.state).toLowerCase().includes(citySearch.toLowerCase())
      )
    : allCities;

  useEffect(() => {
    loadPosts();
  }, [selectedCity]);

  async function loadPosts() {
    setLoading(true);
    try {
      const citySlug = selectedCity || "";
      const res = await fetch(
        `/api/forum?city=${encodeURIComponent(citySlug)}`
      );
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPost(e: FormEvent) {
    e.preventDefault();
    if (!user || !newPostTitle.trim() || !newPostBody.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citySlug: selectedCity || null,
          authorId: user.uid,
          authorName: userProfile?.displayName || "Anonymous",
          authorPhotoURL: userProfile?.photoURL || null,
          authorIsContributor: isContributor,
          title: newPostTitle,
          body: newPostBody,
        }),
      });
      if (res.ok) {
        setNewPostTitle("");
        setNewPostBody("");
        setShowNewPost(false);
        loadPosts();
      }
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpvote(postId: string) {
    if (!user) return;
    try {
      await fetch("/api/forum", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: user.uid,
          action: "upvote",
        }),
      });
      loadPosts();
    } catch {
      // silent fail
    }
  }

  async function handleFlag(postId: string) {
    if (!user) return;
    try {
      await fetch("/api/forum", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: user.uid,
          action: "flag",
        }),
      });
      loadPosts();
    } catch {
      // silent fail
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/40a8a8ed77d5469f174ff66a88f95aa5.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-20 sm:pb-14 text-center relative">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl text-white mb-3 tracking-tight drop-shadow-lg">
            Community{" "}
            <span className="text-skyblue-200">Forum</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Connect with local mahjong players, verify listings, share tips, and
            find your next game.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar: City Boards */}
          <aside>
            <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-20">
              <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-hotpink-500" />
                City Boards
              </h2>

              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search cities..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                />
              </div>

              <div className="space-y-0.5 max-h-96 overflow-y-auto">
                <button
                  onClick={() => setSelectedCity(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCity === null
                      ? "bg-hotpink-50 text-hotpink-600 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  General Discussion
                </button>
                {filteredCities.map((c) => {
                  const slug = `${slugify(c.city)}-${c.state.toLowerCase()}`;
                  return (
                    <button
                      key={slug}
                      onClick={() => setSelectedCity(slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedCity === slug
                          ? "bg-hotpink-50 text-hotpink-600 font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>
                        {c.city}, {c.state}
                      </span>
                      <span className="text-xs text-slate-400">
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal">
                {selectedCity
                  ? (() => {
                      const parts = selectedCity.split("-");
                      const stateAbbr = parts.pop()!;
                      const cityName = parts
                        .map(
                          (w) => w.charAt(0).toUpperCase() + w.slice(1)
                        )
                        .join(" ");
                      return `${cityName}, ${stateAbbr.toUpperCase()}`;
                    })()
                  : "General Discussion"}
              </h2>
              {user ? (
                <button
                  onClick={() => setShowNewPost(!showNewPost)}
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  {showNewPost ? (
                    <>
                      <X className="w-4 h-4" /> Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> New Post
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  Log in to post
                </Link>
              )}
            </div>

            {/* New Post Form */}
            {showNewPost && user && (
              <div className="bg-white border border-hotpink-200 rounded-xl p-6 mb-6">
                <form onSubmit={handleNewPost} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder='e.g., "Is this game still active?" or "New group just started in midtown"'
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      value={newPostBody}
                      onChange={(e) => setNewPostBody(e.target.value)}
                      rows={3}
                      placeholder="Share details, ask questions, or start a discussion..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Post
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-shimmer h-32 rounded-xl"
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-charcoal mb-2">
                  No posts yet
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Be the first to start a conversation
                  {selectedCity ? " about this city" : ""}!
                </p>
                {!user && (
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 text-hotpink-500 font-semibold text-sm hover:text-hotpink-600"
                  >
                    Sign up to post <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-hotpink-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Author Avatar */}
                      <div className="shrink-0">
                        {post.authorPhotoURL ? (
                          <img
                            src={post.authorPhotoURL}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-hotpink-100 flex items-center justify-center">
                            <span className="text-hotpink-600 font-bold text-sm">
                              {(post.authorName || "?")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Author Info */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-charcoal text-sm">
                            {post.authorName}
                          </span>
                          {post.authorIsContributor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                              <Shield className="w-3 h-3" /> Contributor
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(post.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          href={`/community/post/${post.id}`}
                          className="block"
                        >
                          <h3 className="font-semibold text-charcoal hover:text-hotpink-500 transition-colors mb-1">
                            {post.title}
                          </h3>
                        </Link>

                        {/* Body Preview */}
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                          {post.body}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleUpvote(post.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${
                              post.upvotedBy?.includes(user?.uid || "")
                                ? "text-hotpink-500"
                                : "text-slate-400 hover:text-hotpink-500"
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{post.upvotes || 0}</span>
                          </button>
                          <Link
                            href={`/community/post/${post.id}`}
                            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-skyblue-500 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Reply
                          </Link>
                          <button
                            onClick={() => handleFlag(post.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${
                              post.flaggedBy?.includes(user?.uid || "")
                                ? "text-amber-500"
                                : "text-slate-400 hover:text-amber-500"
                            }`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contributor CTA */}
        <div className="mt-12 bg-skyblue-50 border border-skyblue-200 rounded-xl p-6 text-center">
          <Users className="w-8 h-8 text-skyblue-500 mx-auto mb-3" />
          <h3 className="font-semibold text-charcoal mb-2">
            Want to help moderate your city&apos;s forum?
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Community contributors are automatically moderators for their
            city&apos;s board.
          </p>
          <Link
            href="/contribute"
            className="inline-flex items-center gap-2 bg-skyblue-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-skyblue-500 transition-colors"
          >
            Become a Contributor <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

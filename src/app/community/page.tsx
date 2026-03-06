"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getCitiesWithGames } from "@/lib/mock-data";
import { getMetrosWithGames, getMetroCitiesSubtitle, findMetroByAbbreviation, findMetroForCity } from "@/lib/metro-regions";
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
  Lock,
  CheckCircle,
  Clock,
  Info,
} from "lucide-react";
import type { ForumPost, ForumPostType } from "@/types";

const allCities = getCitiesWithGames();
const metrosWithGames = getMetrosWithGames(allCities);

export default function CommunityPage() {
  const { user, userProfile, isContributor, hasAccess, hasMetroAccess } = useAuth();
  const [selectedMetro, setSelectedMetro] = useState<string | null>(null);
  const [metroSearch, setMetroSearch] = useState("");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 20;
  const [showNewPost, setShowNewPost] = useState(false);
  const [postType, setPostType] = useState<ForumPostType>("quick_note");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredMetros = metroSearch
    ? metrosWithGames.filter(
        (m) =>
          m.metro.metro.toLowerCase().includes(metroSearch.toLowerCase()) ||
          m.metro.state.toLowerCase().includes(metroSearch.toLowerCase()) ||
          m.metro.cities.some((c) =>
            c.toLowerCase().includes(metroSearch.toLowerCase())
          )
      )
    : metrosWithGames;

  const selectedMetroData = selectedMetro
    ? findMetroByAbbreviation(selectedMetro)
    : null;

  useEffect(() => {
    setPage(0);
    loadPosts(true);
  }, [selectedMetro]);

  async function loadPosts(reset = false) {
    setLoading(true);
    try {
      const metro = selectedMetro || "";
      const offset = reset ? 0 : page * POSTS_PER_PAGE;
      const res = await fetch(
        `/api/forum?metro=${encodeURIComponent(metro)}&limit=${POSTS_PER_PAGE + 1}&offset=${offset}`
      );
      if (res.ok) {
        const data = await res.json();
        const allPosts = data.posts || [];
        const hasMorePosts = allPosts.length > POSTS_PER_PAGE;
        const displayPosts = hasMorePosts ? allPosts.slice(0, POSTS_PER_PAGE) : allPosts;

        if (reset) {
          setPosts(displayPosts);
        } else {
          setPosts((prev) => [...prev, ...displayPosts]);
        }
        setHasMore(hasMorePosts);
      } else {
        if (reset) setPosts([]);
      }
    } catch {
      if (reset) setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  function loadMorePosts() {
    setPage((p) => p + 1);
    loadPosts(false);
  }

  async function handleNewPost(e: FormEvent) {
    e.preventDefault();
    const isQuickNote = postType === "quick_note";
    if (!user || (!isQuickNote && !newPostTitle.trim()) || !newPostBody.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postType,
          metroSlug: selectedMetro || null,
          authorId: user.uid,
          authorName: userProfile?.displayName || "Anonymous",
          authorPhotoURL: userProfile?.photoURL || null,
          authorIsContributor: isContributor,
          title: isQuickNote ? "" : newPostTitle,
          body: newPostBody,
        }),
      });
      if (res.ok) {
        setNewPostTitle("");
        setNewPostBody("");
        setShowNewPost(false);
        setPostType("quick_note");
        loadPosts(true);
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
          {/* Sidebar: Metro Boards */}
          <aside>
            <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-20">
              <h2 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-hotpink-500" />
                Metro Boards
              </h2>

              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={metroSearch}
                  onChange={(e) => setMetroSearch(e.target.value)}
                  placeholder="Search metros or cities..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                />
              </div>

              <div className="space-y-0.5 max-h-96 overflow-y-auto">
                <button
                  onClick={() => setSelectedMetro(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedMetro === null
                      ? "bg-hotpink-50 text-hotpink-600 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  General Discussion
                </button>
                {filteredMetros.map((m) => (
                  <button
                    key={m.metro.abbreviation}
                    onClick={() => setSelectedMetro(m.metro.abbreviation)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedMetro === m.metro.abbreviation
                        ? "bg-hotpink-50 text-hotpink-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{m.metro.metro}</span>
                      <span className="text-xs text-slate-400">
                        {m.totalGames}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {m.activeCities.slice(0, 3).join(", ")}
                      {m.activeCities.length > 3 && " ..."}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal">
                  {selectedMetroData
                    ? selectedMetroData.metro
                    : "General Discussion"}
                </h2>
                {selectedMetroData && (
                  <p className="text-sm text-slate-500 mt-1">
                    {getMetroCitiesSubtitle(selectedMetroData)}
                  </p>
                )}
              </div>
              {user && hasAccess ? (
                <button
                  onClick={() => setShowNewPost(!showNewPost)}
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors shrink-0"
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
              ) : user ? (
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 bg-slate-100 text-slate-500 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors shrink-0"
                >
                  <Lock className="w-4 h-4" /> Upgrade to post
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors shrink-0"
                >
                  Log in to post
                </Link>
              )}
            </div>

            {/* New Post Form */}
            {showNewPost && user && (
              <div className="bg-white border border-hotpink-200 rounded-xl p-6 mb-6">
                {/* Post type toggle */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 mb-4">
                  <button
                    type="button"
                    onClick={() => setPostType("quick_note")}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                      postType === "quick_note"
                        ? "bg-white text-charcoal shadow-sm"
                        : "text-slate-500 hover:text-charcoal"
                    }`}
                  >
                    Quick Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType("full")}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                      postType === "full"
                        ? "bg-white text-charcoal shadow-sm"
                        : "text-slate-500 hover:text-charcoal"
                    }`}
                  >
                    Full Post
                  </button>
                </div>

                <form onSubmit={handleNewPost} className="space-y-4">
                  {postType === "full" && (
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
                  )}
                  <div>
                    <textarea
                      value={newPostBody}
                      onChange={(e) => {
                        if (postType === "quick_note" && e.target.value.length > 280) return;
                        setNewPostBody(e.target.value);
                      }}
                      rows={postType === "quick_note" ? 2 : 3}
                      placeholder={
                        postType === "quick_note"
                          ? "What's on your mind? (280 characters)"
                          : "Share details, ask questions, or start a discussion..."
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                      required
                    />
                    {postType === "quick_note" && (
                      <p className="text-right text-xs text-slate-400 mt-1">
                        {newPostBody.length}/280
                      </p>
                    )}
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
                          <Send className="w-4 h-4" /> {postType === "quick_note" ? "Post Note" : "Post"}
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
                  {selectedMetroData ? ` about the ${selectedMetroData.metro} area` : ""}!
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
                {/* Auto-generated welcome post for metro boards (show if no pinned general discussion from API) */}
                {selectedMetroData && !posts.some((p) => p.isSticky && p.isGeneralDiscussion) && (
                  <div className="bg-skyblue-50 border border-skyblue-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-skyblue-200 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-skyblue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-charcoal text-sm">MahjNearMe</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-skyblue-200 text-skyblue-700">
                            Pinned
                          </span>
                        </div>
                        <h3 className="font-semibold text-charcoal mb-1">
                          Welcome to the {selectedMetroData.metro} board
                        </h3>
                        <p className="text-sm text-slate-600">
                          This is the place to ask questions, find partners, share news about local games, and connect with other players in the area. New to the scene? Start here.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {posts.map((post, idx) => {
                  const isQuickNote = post.postType === "quick_note";
                  const isSticky = post.isSticky;

                  return (
                    <div
                      key={`${post.id}-${idx}`}
                      className={`border rounded-xl hover:border-hotpink-200 transition-colors ${
                        isSticky
                          ? "bg-skyblue-50 border-skyblue-200 p-5"
                          : isQuickNote
                          ? "bg-white border-slate-200 p-4"
                          : "bg-white border-slate-200 p-5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Author Avatar */}
                        <div className="shrink-0">
                          {post.authorPhotoURL ? (
                            <img
                              src={post.authorPhotoURL}
                              alt=""
                              className={`rounded-full object-cover ${isQuickNote ? "w-8 h-8" : "w-10 h-10"}`}
                            />
                          ) : (
                            <div className={`rounded-full bg-hotpink-100 flex items-center justify-center ${isQuickNote ? "w-8 h-8" : "w-10 h-10"}`}>
                              <span className={`text-hotpink-600 font-bold ${isQuickNote ? "text-xs" : "text-sm"}`}>
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
                            {isSticky && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-skyblue-200 text-skyblue-700">
                                Pinned
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

                          {/* Title (full posts only) */}
                          {!isQuickNote && post.title && (
                            <Link
                              href={`/community/post/${post.id}`}
                              className="block"
                            >
                              <h3 className="font-semibold text-charcoal hover:text-hotpink-500 transition-colors mb-1">
                                {post.title}
                              </h3>
                            </Link>
                          )}

                          {/* Body */}
                          <p className={`text-slate-500 mb-3 ${isQuickNote ? "text-sm" : "text-sm line-clamp-2"}`}>
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
                  );
                })}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={loadMorePosts}
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                      ) : (
                        "Load More Posts"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contributor Application (low-key section) */}
        <ContributorApplySection />
      </div>
    </>
  );
}

const CONNECTION_OPTIONS = [
  { value: "regular_player", label: "I'm a regular player" },
  { value: "multiple_venues", label: "I play at multiple venues" },
  { value: "active_in_groups", label: "I'm active in local mahjong groups" },
  { value: "help_new_players", label: "I help new players find games" },
];

function ContributorApplySection() {
  const { user, userProfile, isContributor } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    connections: [] as string[],
    story: "",
  });

  const hasAlreadyApplied = userProfile?.contributorAppliedAt !== null && userProfile?.contributorAppliedAt !== undefined;
  const isPendingReview = userProfile?.contributorStatus === "pending";
  const isApproved = isContributor;

  const resolvedMetro = useMemo(() => {
    if (!form.city) return null;
    const cityPart = form.city.split(",")[0].trim();
    return findMetroForCity(cityPart);
  }, [form.city]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contributor-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId: user.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Approved contributors see a simple acknowledgment
  if (isApproved) {
    return (
      <div className="mt-10 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span>You&apos;re an active contributor. Thank you for keeping your metro&apos;s listings accurate.</span>
        </div>
      </div>
    );
  }

  // Pending review
  if (hasAlreadyApplied || submitted) {
    return (
      <div className="mt-10 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Clock className="w-4 h-4 text-skyblue-500 shrink-0" />
          <span>
            {isPendingReview || submitted
              ? "Your contributor application is under review. We'll be in touch within 72 hours."
              : "We've already received your application. We'll be in touch soon."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-slate-200 pt-8">
      <div className="max-w-xl">
        <h3 className="text-sm font-medium text-slate-600 mb-1">Help keep your city accurate</h3>
        <p className="text-xs text-slate-400 mb-3">
          If you&apos;re active in your local mahjong scene and want to maintain listings for your area, apply below.
        </p>

        {!user ? (
          <p className="text-xs text-slate-400">
            <Link href="/login" className="text-hotpink-500 hover:text-hotpink-600">Log in</Link> or{" "}
            <Link href="/signup" className="text-hotpink-500 hover:text-hotpink-600">sign up</Link> to apply.
          </p>
        ) : !expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-skyblue-500 hover:text-skyblue-600 font-medium"
          >
            Apply to contribute
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-skyblue-200"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-skyblue-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-skyblue-200"
                placeholder="e.g., Tulsa, OK"
              />
              {resolvedMetro && (
                <div className="flex items-center gap-2 mt-1.5 text-xs text-skyblue-600 bg-skyblue-50 rounded-lg px-3 py-1.5">
                  <Info className="w-3 h-3 shrink-0" />
                  You&apos;ll be contributing for the <strong>{resolvedMetro.metro}</strong> metro region
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">How are you connected to mahjong in your area? *</label>
              <div className="space-y-1.5">
                {CONNECTION_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.connections.includes(value)}
                      onChange={(e) => {
                        const connections = e.target.checked
                          ? [...form.connections, value]
                          : form.connections.filter((c) => c !== value);
                        setForm({ ...form, connections });
                      }}
                      className="rounded border-slate-300 text-hotpink-500 focus:ring-hotpink-400"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tell us about your mahjong life in {resolvedMetro ? `the ${resolvedMetro.metro} area` : form.city || "your area"} *
              </label>
              <textarea
                required
                rows={3}
                value={form.story}
                onChange={(e) => setForm({ ...form, story: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-skyblue-200"
                placeholder="Where do you play? How did you find your games?"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || form.connections.length === 0}
                className="flex items-center gap-2 bg-skyblue-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-skyblue-500 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Submit Application</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

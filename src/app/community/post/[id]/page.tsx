"use client";

import { useState, useEffect, FormEvent, use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ThumbsUp,
  Flag,
  Shield,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";
import type { ForumPost, ForumReply } from "@/types";

export default function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, userProfile, isContributor } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum?postId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post || null);
        setReplies(data.replies || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!user || !replyBody.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/forum", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          authorId: user.uid,
          authorName: userProfile?.displayName || "Anonymous",
          authorPhotoURL: userProfile?.photoURL || null,
          authorIsContributor: isContributor,
          body: replyBody,
        }),
      });
      if (res.ok) {
        setReplyBody("");
        loadPost();
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
      loadPost();
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
      loadPost();
    } catch {
      // silent fail
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-64 rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h1 className="font-semibold text-xl text-charcoal mb-2">
          Post not found
        </h1>
        <Link
          href="/community"
          className="text-hotpink-500 font-medium hover:text-hotpink-600"
        >
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-hotpink-500 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </Link>

      {/* Post */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          {post.authorPhotoURL ? (
            <img
              src={post.authorPhotoURL}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-hotpink-100 flex items-center justify-center">
              <span className="text-hotpink-600 font-bold">
                {(post.authorName || "?")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-charcoal">
                {post.authorName}
              </span>
              {post.authorIsContributor && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                  <Shield className="w-3 h-3" /> Contributor
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
          {post.title}
        </h1>
        <p className="text-slate-600 whitespace-pre-wrap mb-4">{post.body}</p>

        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
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

      {/* Replies */}
      <h2 className="font-semibold text-charcoal mb-4">
        {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
      </h2>

      {replies.length > 0 && (
        <div className="space-y-4 mb-6">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                {reply.authorPhotoURL ? (
                  <img
                    src={reply.authorPhotoURL}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-hotpink-100 flex items-center justify-center">
                    <span className="text-hotpink-600 font-bold text-sm">
                      {(reply.authorName || "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-charcoal text-sm">
                      {reply.authorName}
                    </span>
                    {reply.authorIsContributor && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                        <Shield className="w-3 h-3" /> Contributor
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(reply.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {user ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <form onSubmit={handleReply} className="space-y-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
              placeholder="Write a reply..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Replying...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Reply
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
          <p className="text-sm text-slate-500 mb-3">
            Log in to join the conversation.
          </p>
          <Link
            href="/login"
            className="text-hotpink-500 font-semibold text-sm hover:text-hotpink-600"
          >
            Log In
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-hotpink-500 animate-spin" />
      </div>
    }>
      <ForgotPasswordPage />
    </Suspense>
  );
}

function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const redirectParam = searchParams.get("redirect");

  // Preserve plan/redirect params on the "Back to log in" links so a user
  // who hit this page mid-subscribe flow doesn't silently lose their
  // checkout intent.
  const loginHref = (() => {
    const params = new URLSearchParams();
    if (planParam) params.set("plan", planParam);
    if (redirectParam) params.set("redirect", redirectParam);
    const qs = params.toString();
    return qs ? `/login?${qs}` : "/login";
  })();

  const signupHref = (() => {
    const params = new URLSearchParams();
    if (planParam) params.set("plan", planParam);
    if (redirectParam) params.set("redirect", redirectParam);
    const qs = params.toString();
    return qs ? `/signup?${qs}` : "/signup";
  })();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Firebase reveals whether an email exists via `user-not-found`.
        // To avoid account enumeration, show the same success state either
        // way — matches Firebase's own best practice.
        if (err.message.includes("user-not-found")) {
          setSent(true);
        } else if (err.message.includes("invalid-email")) {
          setError("Please enter a valid email address.");
        } else if (err.message.includes("too-many-requests")) {
          setError("Too many requests. Please try again in a few minutes.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-hotpink-50/50 to-skyblue-50">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-hotpink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal">
              MahjNearMe
            </span>
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl text-charcoal mb-2">
            Reset your password
          </h1>
          <p className="text-slate-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex w-12 h-12 rounded-full bg-green-50 items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="font-semibold text-lg text-charcoal mb-2">
                Check your email
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                If an account exists for <strong className="text-charcoal">{email}</strong>, we&apos;ve sent a password reset link. Follow the instructions in the email to choose a new password.
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Didn&apos;t get the email? Check your spam folder, or try again in a few minutes.
              </p>
              <Link
                href={loginHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-hotpink-500 hover:text-hotpink-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to log in
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 border border-skyblue-300 rounded-xl text-sm text-charcoal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-hotpink-500/20 focus:border-hotpink-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-hotpink-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-hotpink-600 focus:outline-none focus:ring-2 focus:ring-hotpink-500/20 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href={loginHref}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-charcoal transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to log in
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href={signupHref} className="text-hotpink-500 hover:text-hotpink-600 font-semibold">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

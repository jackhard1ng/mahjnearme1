"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_EMAILS = ["jack@fluttrr.com", "jack@mahjnearme.com"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isAdmin, loading } = useAuth();
  const router = useRouter();
  const emailIsAdmin = ADMIN_EMAILS.includes((user?.email || "").toLowerCase()) || ADMIN_EMAILS.includes((userProfile?.email || "").toLowerCase());
  const hasAdmin = isAdmin || emailIsAdmin;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !hasAdmin) {
      router.push("/");
    }
  }, [user, loading, router, hasAdmin]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  if (!user || !hasAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">Access Denied</h1>
        <p className="text-slate-500">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !isAdmin) {
      router.push("/");
    }
  }, [user, loading, router, isAdmin]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">Access Denied</h1>
        <p className="text-slate-500">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

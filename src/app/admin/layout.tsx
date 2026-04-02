"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const ADMIN_EMAILS = ["jack@fluttrr.com", "jack@mahjnearme.com"];

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/mobile", label: "Approvals" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/submissions", label: "Submissions" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  return (
    <>
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-hotpink-500 text-hotpink-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </>
  );
}

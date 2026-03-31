"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Settings, LayoutDashboard, ChevronDown, CalendarDays, Heart, MessageSquare, Briefcase, GraduationCap } from "lucide-react";

export default function Header() {
  const { user, userProfile, signOut, isAdmin, isContributor, isOrganizer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-hotpink-500 sticky top-0 z-50 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0.5">
            {"MahjNearMe".split("").map((char, i) => (
              <span
                key={i}
                className="inline-flex items-center justify-center h-9 rounded-[5px] text-[18px] font-extrabold leading-none shadow-sm"
                style={{
                  fontFamily: "var(--font-heading), 'Fredoka', sans-serif",
                  color: "#3E8B3E",
                  textShadow: "0 1px 0 rgba(0,0,0,0.08)",
                  background: "linear-gradient(to bottom, #FFFFF0, #F0EFE0)",
                  borderBottom: "3px solid #87CEEB",
                  padding: char.toLowerCase() === "m" || char.toLowerCase() === "n" ? "0 5px" : "0 3.5px",
                  minWidth: char.toLowerCase() === "i" || char.toLowerCase() === "j" ? "16px" : undefined,
                  textAlign: "center" as const,
                }}
              >
                {char}
              </span>
            ))}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
              Find Games
            </Link>
            <Link href="/cities" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
              Browse
            </Link>
            <Link href="/events" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
              Destination Events
            </Link>
            <Link href="/giveaways" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
              Giveaways
            </Link>
            <Link href="/instructors" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
              Instructors
            </Link>
            <Link href="/about" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
              About
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-white hover:text-skyblue-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden lg:inline">{userProfile?.displayName || "Account"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    <Link
                      href="/calendar"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-hotpink-50"
                    >
                      <CalendarDays className="w-4 h-4" />
                      My Calendar
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-hotpink-50"
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </Link>
                    {isOrganizer ? (
                      <Link
                        href="/organizer"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-hotpink-50"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Organizer Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/claim-listing"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-hotpink-50"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Claim Your Listings
                      </Link>
                    )}
                    {isContributor && (
                      <Link
                        href="/contributor-panel"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-hotpink-50"
                      >
                        <Briefcase className="w-4 h-4" />
                        Contributor Panel
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-hotpink-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-2 border-slate-200" />
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-hotpink-600 hover:bg-hotpink-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-hotpink-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-skyblue-100 hover:text-hotpink-700 transition-all shadow-sm"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 space-y-3">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
            >
              Find Games
            </Link>
            <Link
              href="/cities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
            >
              Browse
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
            >
              Destination Events
            </Link>
            <Link
              href="/giveaways"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
            >
              Giveaways
            </Link>
            <Link
              href="/instructors"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
            >
              Instructors
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
            >
              About
            </Link>
            <hr className="border-white/20" />
            {user ? (
              <>
                {isOrganizer ? (
                  <Link
                    href="/organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
                  >
                    Organizer Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/claim-listing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
                  >
                    Claim Your Listings
                  </Link>
                )}
                <Link
                  href="/calendar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
                >
                  My Calendar
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
                >
                  Account Settings
                </Link>
                {isContributor && (
                  <Link
                    href="/contributor-panel"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-white hover:bg-white/10 rounded-lg font-medium"
                  >
                    Contributor Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg font-medium w-full text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2 px-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-white border border-white/30 rounded-lg font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 bg-white text-hotpink-500 rounded-lg font-bold"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Settings, LayoutDashboard, ChevronDown } from "lucide-react";

export default function Header() {
  const { user, userProfile, signOut, isAdmin, isOrganizer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-ivory-50 border-b border-ivory-300 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-jade-600 to-jade-700 rounded-lg flex items-center justify-center shadow-sm border border-jade-500">
              <span className="text-white font-bold text-lg" aria-hidden="true">🀄</span>
            </div>
            <span className="font-[family-name:var(--font-heading)] font-bold text-xl text-slate-800">
              Mahj<span className="text-jade-600">Near</span>Me
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-slate-600 hover:text-jade-600 transition-colors text-sm font-medium">
              Find Games
            </Link>
            <Link href="/cities" className="text-slate-600 hover:text-jade-600 transition-colors text-sm font-medium">
              Cities
            </Link>
            <Link href="/shop" className="text-slate-600 hover:text-jade-600 transition-colors text-sm font-medium">
              Mahj Gear
            </Link>
            <Link href="/add-your-group" className="text-slate-600 hover:text-jade-600 transition-colors text-sm font-medium">
              For Organizers
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-jade-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-jade-100 rounded-full flex items-center justify-center border border-jade-200">
                    <User className="w-4 h-4 text-jade-700" />
                  </div>
                  <span className="hidden lg:inline">{userProfile?.displayName || "Account"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-ivory-50 rounded-lg shadow-lg border border-ivory-300 py-2 z-50">
                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-jade-50"
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </Link>
                    {isOrganizer && (
                      <Link
                        href="/organizer"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-jade-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Organizer Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-jade-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-2 border-ivory-300" />
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-mahj-red-600 hover:bg-mahj-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-jade-600 transition-colors">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-jade-600 to-jade-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-jade-700 hover:to-jade-800 transition-all shadow-sm"
                >
                  Start Free Trial
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-ivory-300 py-4 space-y-3">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-700 hover:bg-jade-50 rounded-lg font-medium"
            >
              Find Games
            </Link>
            <Link
              href="/cities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-700 hover:bg-jade-50 rounded-lg font-medium"
            >
              Cities
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-700 hover:bg-jade-50 rounded-lg font-medium"
            >
              Mahj Gear
            </Link>
            <Link
              href="/add-your-group"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-slate-700 hover:bg-jade-50 rounded-lg font-medium"
            >
              For Organizers
            </Link>
            <hr className="border-ivory-300" />
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-slate-700 hover:bg-jade-50 rounded-lg font-medium"
                >
                  Account Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-mahj-red-600 hover:bg-mahj-red-50 rounded-lg font-medium w-full text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2 px-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-slate-700 border border-ivory-300 rounded-lg font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 bg-gradient-to-r from-jade-600 to-jade-700 text-white rounded-lg font-semibold"
                >
                  Start Free Trial
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

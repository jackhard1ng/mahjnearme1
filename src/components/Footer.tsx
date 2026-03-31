import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      {/* Decorative top border - pink to blue */}
      <div className="h-1 bg-gradient-to-r from-hotpink-500 via-hotpink-400 to-skyblue-400" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-0.5 mb-4">
              {"MahjNearMe".split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-flex items-center justify-center h-7 rounded-[4px] text-[13px] font-extrabold leading-none shadow-sm"
                  style={{
                    fontFamily: "var(--font-heading), 'Fredoka', sans-serif",
                    color: "#3E8B3E",
                    background: "linear-gradient(to bottom, #FFFFF0, #F0EFE0)",
                    borderBottom: "2px solid #87CEEB",
                    padding: char.toLowerCase() === "m" || char.toLowerCase() === "n" ? "0 4px" : "0 2.5px",
                    minWidth: char.toLowerCase() === "i" || char.toLowerCase() === "j" ? "12px" : undefined,
                    textAlign: "center" as const,
                  }}
                >
                  {char}
                </span>
              ))}
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              Find mahjong games anywhere you go. The only directory of pickup games, open play, and events across the US.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Find Games
                </Link>
              </li>
              <li>
                <Link href="/cities" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Browse
                </Link>
              </li>
              <li>
                <Link href="/giveaways" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Giveaways
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Destination Events
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Mahj Gear
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/add-your-group" className="text-sm text-slate-400 hover:text-skyblue-400 transition-colors">
                  List Your Group
                </Link>
              </li>
              <li>
                <Link href="/claim-listing" className="text-sm text-slate-400 hover:text-skyblue-400 transition-colors">
                  For Organizers
                </Link>
              </li>
              <li>
                <Link href="/instructors" className="text-sm text-slate-400 hover:text-skyblue-400 transition-colors">
                  Find Instructors
                </Link>
              </li>
              <li>
                <a href="https://instagram.com/mahjnearme" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-skyblue-400 transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-400 hover:text-hotpink-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} MahjNearMe. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com/mahjnearme" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-hotpink-400 transition-colors" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

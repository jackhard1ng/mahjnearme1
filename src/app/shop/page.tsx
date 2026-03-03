import { mockProducts } from "@/lib/mock-data";
import { ExternalLink, ShoppingBag, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mahj Gear — Mahjong Sets, Cards & Accessories",
  description: "Shop curated mahjong sets, NMJL cards, accessories, and gifts. Everything you need for game night, hand-picked by MahjNearMe.",
};

export default function ShopPage() {
  const featured = mockProducts.filter((p) => p.featured);
  const categories = [...new Set(mockProducts.map((p) => p.category))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
          Mahj Gear & Essentials
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Everything you need for game night — from beginner sets to premium accessories. Hand-picked by the MahjNearMe team.
        </p>
      </div>

      {/* Featured Products */}
      <h2 className="font-semibold text-xl text-charcoal mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-hotpink-500" /> Featured Picks
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {featured.map((product) => (
          <div key={product.id} className="mahj-tile overflow-hidden group">
            <div className="aspect-square bg-skyblue-100 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-slate-300" />
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-hotpink-500 uppercase tracking-wider mb-1">{product.category}</p>
              <h3 className="font-semibold text-charcoal mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-charcoal">{product.price}</span>
                <a
                  href={product.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  Shop <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All Products */}
      <h2 className="font-semibold text-xl text-charcoal mb-4">All Products</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all flex gap-4">
            <div className="w-20 h-20 bg-skyblue-100 rounded-lg flex items-center justify-center shrink-0">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-hotpink-500 uppercase tracking-wider">{product.category}</p>
              <h3 className="font-semibold text-charcoal text-sm mb-1">{product.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-charcoal">{product.price}</span>
                <a
                  href={product.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-hotpink-500 hover:text-hotpink-600 font-semibold inline-flex items-center gap-1"
                >
                  Shop Now <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Affiliate Disclaimer */}
      <div className="bg-skyblue-50 rounded-xl p-6 text-center text-sm text-slate-500">
        <p>
          MahjNearMe is a participant in affiliate programs. When you purchase through our links, we may earn a small commission at no extra cost to you.
          This helps support the site and keep it running!
        </p>
      </div>
    </div>
  );
}

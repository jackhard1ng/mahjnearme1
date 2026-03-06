"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { MONTHLY_PRICE } from "@/lib/constants";

type PromptType = "listing" | "forum" | "giveaway" | "general";

const MESSAGES: Record<PromptType, { title: string; subtitle: string }> = {
  listing: {
    title: "Traveling? Upgrade to see games in every city.",
    subtitle: "Paid members get full access to all 70+ metro areas.",
  },
  forum: {
    title: "Join the conversation. Upgrade to participate.",
    subtitle: "Post, reply, and connect with players in every metro.",
  },
  giveaway: {
    title: "Paid members are automatically entered every month.",
    subtitle: "One lucky member wins a premium mahjong set every month. That's worth more than 5 years of membership.",
  },
  general: {
    title: "Unlock full access to MahjNearMe.",
    subtitle: "See all listings, post in forums, and enter monthly giveaways.",
  },
};

// Session-level dedup: only one prompt per session
let promptShownThisSession = false;

export function useUpgradePrompt() {
  const [visible, setVisible] = useState(false);
  const [promptType, setPromptType] = useState<PromptType>("general");

  function showPrompt(type: PromptType) {
    if (promptShownThisSession) return;
    promptShownThisSession = true;
    setPromptType(type);
    setVisible(true);
  }

  function hidePrompt() {
    setVisible(false);
  }

  return { visible, promptType, showPrompt, hidePrompt };
}

export default function UpgradePrompt({
  type,
  visible,
  onClose,
}: {
  type: PromptType;
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;

  const msg = MESSAGES[type];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-full bg-hotpink-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-hotpink-500" />
        </div>
        <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-2">
          {msg.title}
        </h3>
        <p className="text-sm text-slate-500 mb-6">{msg.subtitle}</p>
        <Link
          href="/pricing"
          className="inline-block w-full bg-hotpink-500 text-white py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
          onClick={onClose}
        >
          View Plans
        </Link>
        <p className="text-xs text-slate-400 mt-3">
          Starting at {formatCurrency(MONTHLY_PRICE)}/month with a 14-day free trial
        </p>
      </div>
    </div>
  );
}

/**
 * Inline upgrade banner for use within page content (e.g., blurred listing cards).
 */
export function UpgradeInlineBanner({ type = "listing" }: { type?: PromptType }) {
  const msg = MESSAGES[type];
  return (
    <div className="bg-gradient-to-r from-hotpink-50 to-skyblue-50 border border-hotpink-200 rounded-xl p-6 text-center">
      <Lock className="w-6 h-6 text-hotpink-400 mx-auto mb-2" />
      <p className="font-semibold text-charcoal text-sm mb-1">{msg.title}</p>
      <p className="text-xs text-slate-500 mb-4">{msg.subtitle}</p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
      >
        Upgrade Now
      </Link>
    </div>
  );
}

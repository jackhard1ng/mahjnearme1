"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";
import {
  Copy,
  Check,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Link as LinkIcon,
} from "lucide-react";

interface ReferralData {
  referralCode: string | null;
  referralLink: string | null;
  activeReferralsCount: number;
  monthlyEarnings: number;
  pendingEarnings: number;
  lifetimeEarnings: number;
  payouts: { id: string; amount: number; period: string; paidAt: string | null; status: string; createdAt: string }[];
  referralList: { signupDate: string; status: string; plan: string; isVested: boolean }[];
}

export default function ReferralDashboard() {
  const { user, isContributor } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/referrals?contributorId=${user.uid}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    // Poll every 30 seconds for near-real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!isContributor || loading) return null;
  if (!data || !data.referralCode) return null;

  function copyToClipboard(text: string, type: "code" | "link") {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-hotpink-500" />
        Referral Program
      </h3>

      {/* Referral Code */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-hotpink-50 border border-hotpink-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Referral Code</p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl text-hotpink-600 flex-1">
              {data.referralCode}
            </span>
            <button
              onClick={() => copyToClipboard(data.referralCode!, "code")}
              className="p-2 text-hotpink-500 hover:bg-hotpink-100 rounded-lg transition-colors"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-skyblue-600 truncate flex-1">
              {data.referralLink}
            </span>
            <button
              onClick={() => copyToClipboard(data.referralLink!, "link")}
              className="p-2 text-skyblue-500 hover:bg-skyblue-100 rounded-lg transition-colors shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-charcoal">{data.activeReferralsCount}</p>
          <p className="text-xs text-slate-500">Active Referrals</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-hotpink-600">{formatCurrency(data.monthlyEarnings)}</p>
          <p className="text-xs text-slate-500">This Month</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(data.pendingEarnings)}</p>
          <p className="text-xs text-slate-500">Pending (60-day hold)</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-charcoal">{formatCurrency(data.lifetimeEarnings)}</p>
          <p className="text-xs text-slate-500">Lifetime Earnings</p>
        </div>
      </div>

      {/* Referred Subscribers */}
      {data.referralList.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Referred Subscribers
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.referralList.map((ref, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-slate-600">
                  {new Date(ref.signupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs capitalize text-slate-500">{ref.plan}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    ref.status === "active"
                      ? ref.isVested
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {ref.status === "active" ? (ref.isVested ? "Vested" : "Pending") : ref.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout History */}
      {data.payouts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Payout History
          </p>
          <div className="space-y-1.5">
            {data.payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-slate-600">{payout.period}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-charcoal">{formatCurrency(payout.amount)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    payout.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4">
        New subscribers using your code get 15% off. You earn {formatCurrency(1.50)}/month per monthly referral and {formatCurrency(8.00)}/year per annual referral.
        Commissions vest after 60 days. Payouts are processed on the 1st of each month.
      </p>
    </div>
  );
}

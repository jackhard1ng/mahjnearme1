import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/subscribers — Protected
 */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const stripe = getStripe();
    const db = getAdminDb();

    const subscribers: {
      name: string;
      email: string;
      plan: string;
      price: number;
      status: string;
      subscribedDate: string;
      homeCity: string;
    }[] = [];

    let monthlyRevenue = 0;
    let annualRevenue = 0;
    let monthlyCount = 0;
    let annualCount = 0;

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: { status: "active"; limit: number; starting_after?: string; expand: string[] } = {
        status: "active",
        limit: 100,
        expand: ["data.items", "data.customer"],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const subscriptions = await stripe.subscriptions.list(params);

      for (const sub of subscriptions.data) {
        const interval = sub.items.data[0]?.price?.recurring?.interval;
        const amount = (sub.items.data[0]?.price?.unit_amount || 0) / 100;
        const isAnnual = interval === "year";
        const customer = sub.customer as { email?: string; name?: string } | string;
        const email = typeof customer === "object" ? customer.email || "" : "";
        const name = typeof customer === "object" ? customer.name || "" : "";

        if (isAnnual) {
          annualCount++;
          annualRevenue += amount;
        } else {
          monthlyCount++;
          monthlyRevenue += amount;
        }

        // Try to get home city and display name from Firestore
        let homeCity = "";
        let firestoreName = "";
        const customerId = typeof customer === "object" ? (customer as { id?: string }).id : customer;
        if (customerId) {
          const usersSnap = await db.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!usersSnap.empty) {
            const userData = usersSnap.docs[0].data();
            homeCity = userData.homeCity || "";
            firestoreName = userData.displayName || "";
          }
        }

        subscribers.push({
          name: name || firestoreName || email?.split("@")[0] || "Unknown",
          email,
          plan: isAnnual ? "annual" : "monthly",
          price: amount,
          status: sub.status,
          subscribedDate: new Date(sub.start_date * 1000).toISOString(),
          homeCity,
        });
      }

      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    // MRR = monthly revenue + (annual revenue / 12)
    const mrr = monthlyRevenue + (annualRevenue / 12);

    return NextResponse.json({
      subscribers: subscribers.sort((a, b) => new Date(b.subscribedDate).getTime() - new Date(a.subscribedDate).getTime()),
      metrics: {
        total: subscribers.length,
        monthlyCount,
        annualCount,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        monthlyRevenue,
        annualRevenue,
      },
    });
  } catch (err) {
    console.error("[Subscribers API] Error:", err);
    return NextResponse.json({ subscribers: [], metrics: null }, { status: 500 });
  }
}

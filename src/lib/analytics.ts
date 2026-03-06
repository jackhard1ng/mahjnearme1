import { isFirebaseConfigured, getFirebaseDb } from "@/lib/firebase";
import { doc, setDoc, getDoc, increment, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

/**
 * Simple analytics tracker using Firestore.
 * Stores daily page view counts in analytics/pageviews/{date} documents.
 */

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0]; // "2026-03-04"
}

export async function trackPageView(path: string) {
  if (!isFirebaseConfigured) return;
  try {
    const db = getFirebaseDb();
    const dateKey = getTodayKey();
    const docRef = doc(db, "analytics", "pageviews", "daily", dateKey);

    await setDoc(
      docRef,
      {
        date: dateKey,
        totalViews: increment(1),
        [`pages.${path.replace(/\//g, "_") || "home"}`]: increment(1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Silently fail. Analytics should never break the app.
  }
}

export interface DailyStats {
  date: string;
  totalViews: number;
  pages: Record<string, number>;
}

export async function getAnalytics(days: number = 30): Promise<{
  totalViews: number;
  todayViews: number;
  dailyStats: DailyStats[];
  topPages: { path: string; views: number }[];
}> {
  if (!isFirebaseConfigured) {
    return { totalViews: 0, todayViews: 0, dailyStats: [], topPages: [] };
  }

  try {
    const db = getFirebaseDb();
    const dailyRef = collection(db, "analytics", "pageviews", "daily");
    const q = query(dailyRef, orderBy("date", "desc"), limit(days));
    const snapshot = await getDocs(q);

    const dailyStats: DailyStats[] = [];
    let totalViews = 0;
    let todayViews = 0;
    const pageTotals: Record<string, number> = {};
    const todayKey = getTodayKey();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const views = data.totalViews || 0;
      totalViews += views;

      if (data.date === todayKey) {
        todayViews = views;
      }

      // Collect page-level stats
      const pages: Record<string, number> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith("pages.")) {
          const pagePath = key.replace("pages.", "").replace(/_/g, "/") || "/";
          pages[pagePath] = value as number;
          pageTotals[pagePath] = (pageTotals[pagePath] || 0) + (value as number);
        }
      });

      dailyStats.push({ date: data.date, totalViews: views, pages });
    });

    const topPages = Object.entries(pageTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, views]) => ({ path: path || "/", views }));

    return { totalViews, todayViews, dailyStats, topPages };
  } catch {
    return { totalViews: 0, todayViews: 0, dailyStats: [], topPages: [] };
  }
}

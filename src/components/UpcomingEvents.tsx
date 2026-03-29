"use client";

import { useMemo } from "react";
import Link from "next/link";
import { mockGames } from "@/lib/mock-data";
import { isEventExpired, slugify, formatTime } from "@/lib/utils";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";

export default function UpcomingEvents() {
  const events = useMemo(() => {
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return mockGames
      .filter((g) => {
        if (g.status !== "active" || isEventExpired(g)) return false;
        if (g.isRecurring || !g.eventDate) return false;
        const eventDate = new Date(g.eventDate + "T00:00:00");
        return eventDate >= now && eventDate <= thirtyDaysOut;
      })
      .sort((a, b) => {
        const dateA = new Date(a.eventDate! + "T00:00:00");
        const dateB = new Date(b.eventDate! + "T00:00:00");
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 6);
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="py-10 sm:py-12 section-pink">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg text-charcoal flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-hotpink-500" />
            Upcoming Events
          </h2>
          <Link href="/search" className="text-sm font-medium text-hotpink-500 hover:text-hotpink-600 flex items-center gap-1">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map((g) => {
            const eventDate = new Date(g.eventDate! + "T00:00:00");
            const monthShort = eventDate.toLocaleDateString("en-US", { month: "short" });
            const day = eventDate.getDate();
            const dayOfWeek = eventDate.toLocaleDateString("en-US", { weekday: "short" });

            return (
              <Link
                key={g.id}
                href={`/games/${slugify(g.city + "-" + g.state)}/${slugify(g.name)}`}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-hotpink-300 hover:shadow-sm transition-all group flex gap-4"
              >
                {/* Date block */}
                <div className="shrink-0 w-14 text-center">
                  <div className="bg-hotpink-500 text-white text-[10px] font-bold uppercase rounded-t-lg py-0.5">
                    {monthShort}
                  </div>
                  <div className="border border-t-0 border-slate-200 rounded-b-lg py-1">
                    <p className="text-xl font-bold text-charcoal leading-none">{day}</p>
                    <p className="text-[10px] text-slate-400">{dayOfWeek}</p>
                  </div>
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-charcoal group-hover:text-hotpink-500 transition-colors line-clamp-2 mb-1">
                    {g.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{g.city}, {g.state}</span>
                  </div>
                  {g.eventStartTime && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTime(g.eventStartTime)}
                      {g.eventEndTime && ` – ${formatTime(g.eventEndTime)}`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

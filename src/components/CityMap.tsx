"use client";

import dynamic from "next/dynamic";
import { Game } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-skyblue-100 rounded-xl border-2 border-softpink-300 h-[300px] flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading map...</p>
    </div>
  ),
});

interface CityMapProps {
  games: Game[];
}

export default function CityMap({ games }: CityMapProps) {
  const { hasAccess } = useAuth();

  return (
    <div className="h-[350px] mb-8">
      <LeafletMap games={games} hasAccess={hasAccess} previewCount={2} />
    </div>
  );
}

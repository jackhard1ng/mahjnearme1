"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Heart } from "lucide-react";

interface ContributorInfo {
  name: string;
  photoURL: string | null;
}

export default function CityContributor({ cityName }: { cityName: string }) {
  const [contributor, setContributor] = useState<ContributorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributor() {
      try {
        const res = await fetch(
          `/api/contributor-apply?city=${encodeURIComponent(cityName)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.contributor) {
            setContributor(data.contributor);
          }
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchContributor();
  }, [cityName]);

  if (loading) return null;

  if (contributor) {
    return (
      <div className="flex items-center gap-3 mb-6 bg-skyblue-50 border border-skyblue-200 rounded-lg px-4 py-3">
        {contributor.photoURL ? (
          <img
            src={contributor.photoURL}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-skyblue-200 flex items-center justify-center">
            <Shield className="w-4 h-4 text-skyblue-600" />
          </div>
        )}
        <p className="text-sm text-skyblue-700">
          Listings verified by{" "}
          <span className="font-semibold">{contributor.name}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-6">
      <Heart className="w-4 h-4 text-slate-400" />
      <p className="text-sm text-slate-500">
        Want to help keep {cityName} current?{" "}
        <Link
          href="/contribute"
          className="text-hotpink-500 font-medium hover:text-hotpink-600"
        >
          Learn more.
        </Link>
      </p>
    </div>
  );
}

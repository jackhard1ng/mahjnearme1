"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, MapPin, Check } from "lucide-react";
import { US_STATES } from "@/lib/constants";
import { getStateName } from "@/lib/utils";

export default function NotificationPreferences() {
  const { userProfile, updateUserProfile } = useAuth();
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!userProfile) return null;

  const notifs = userProfile.emailNotifications || { newEventsInArea: false, weeklyDigest: false };
  const notifyStates = userProfile.notifyStates || [];
  const eitherEnabled = notifs.newEventsInArea || notifs.weeklyDigest;

  async function toggleNotification(key: "newEventsInArea" | "weeklyDigest") {
    const updated = { ...notifs, [key]: !notifs[key] };
    await updateUserProfile({ emailNotifications: updated });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleState(abbr: string) {
    const updated = notifyStates.includes(abbr)
      ? notifyStates.filter((s: string) => s !== abbr)
      : [...notifyStates, abbr];
    await updateUserProfile({ notifyStates: updated });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-hotpink-500" />
        Email Notifications
        {saved && (
          <span className="text-xs text-green-500 font-medium flex items-center gap-1 ml-auto">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </h3>

      <div className="space-y-4">
        {/* New events toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-slate-700">New events in my area</p>
            <p className="text-xs text-slate-400">Get notified when new games, tournaments, or events are added in your selected states</p>
          </div>
          <button
            onClick={() => toggleNotification("newEventsInArea")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
              notifs.newEventsInArea ? "bg-hotpink-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifs.newEventsInArea ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Weekly digest toggle */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Weekly digest</p>
            <p className="text-xs text-slate-400">A weekly summary of new listings and upcoming events in your selected states</p>
          </div>
          <button
            onClick={() => toggleNotification("weeklyDigest")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
              notifs.weeklyDigest ? "bg-hotpink-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifs.weeklyDigest ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* State selector - shown when either toggle is on */}
        {eitherEnabled && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-hotpink-500" />
              <p className="text-xs font-medium text-slate-600">
                {notifyStates.length === 0
                  ? "Select which states you want notifications for"
                  : `Watching ${notifyStates.length} state${notifyStates.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Selected states */}
            {notifyStates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {notifyStates.map((abbr: string) => (
                  <button
                    key={abbr}
                    onClick={() => toggleState(abbr)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-hotpink-100 text-hotpink-600 border border-hotpink-200 hover:bg-hotpink-200 transition-colors"
                  >
                    {getStateName(abbr) || abbr}
                    <span className="text-hotpink-400">&times;</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowStatePicker(!showStatePicker)}
              className="text-xs text-hotpink-500 font-medium hover:underline"
            >
              {showStatePicker ? "Done" : "+ Add states"}
            </button>

            {showStatePicker && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
                {Object.entries(US_STATES).sort((a, b) => (a[1] as string).localeCompare(b[1] as string)).map(([abbr, name]) => (
                  <button
                    key={abbr}
                    onClick={() => toggleState(abbr)}
                    className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${
                      notifyStates.includes(abbr)
                        ? "bg-hotpink-100 text-hotpink-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {notifyStates.includes(abbr) ? "✓ " : ""}{name as string}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

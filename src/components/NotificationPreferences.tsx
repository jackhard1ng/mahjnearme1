"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationPreferences() {
  const { userProfile, updateUserProfile } = useAuth();
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !userProfile) return null;

  const notifs = userProfile.emailNotifications || {};
  const newEventsOn = notifs.newEventsInArea === true;
  const digestOn = notifs.weeklyDigest === true;
  const notifyStates: string[] = userProfile.notifyStates || [];
  const eitherEnabled = newEventsOn || digestOn;

  const US_STATES: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
    IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
    ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
    MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  };

  async function toggleNotif(key: string) {
    const updated = { ...notifs, [key]: !(notifs as Record<string, boolean>)[key] };
    await updateUserProfile({ emailNotifications: updated } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleState(abbr: string) {
    const updated = notifyStates.includes(abbr)
      ? notifyStates.filter((s) => s !== abbr)
      : [...notifyStates, abbr];
    await updateUserProfile({ notifyStates: updated });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-semibold text-lg text-charcoal mb-4">
        Email Notifications
        {saved && <span className="text-xs text-green-500 ml-2">Saved</span>}
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-slate-700">New events in my area</p>
            <p className="text-xs text-slate-400">Get notified when new listings are added in your selected states</p>
          </div>
          <button
            onClick={() => toggleNotif("newEventsInArea")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${newEventsOn ? "bg-hotpink-500" : "bg-slate-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newEventsOn ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Weekly digest</p>
            <p className="text-xs text-slate-400">A weekly summary of new listings in your selected states</p>
          </div>
          <button
            onClick={() => toggleNotif("weeklyDigest")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${digestOn ? "bg-hotpink-500" : "bg-slate-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${digestOn ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {eitherEnabled && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-600 mb-2">
              {notifyStates.length === 0
                ? "Select which states you want notifications for"
                : `Watching ${notifyStates.length} state${notifyStates.length !== 1 ? "s" : ""}`}
            </p>

            {notifyStates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {notifyStates.map((abbr) => (
                  <button
                    key={abbr}
                    onClick={() => toggleState(abbr)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-hotpink-100 text-hotpink-600 border border-hotpink-200 hover:bg-hotpink-200"
                  >
                    {US_STATES[abbr] || abbr} &times;
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
                {Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1])).map(([abbr, name]) => (
                  <button
                    key={abbr}
                    onClick={() => toggleState(abbr)}
                    className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${
                      notifyStates.includes(abbr)
                        ? "bg-hotpink-100 text-hotpink-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {notifyStates.includes(abbr) ? "✓ " : ""}{name}
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

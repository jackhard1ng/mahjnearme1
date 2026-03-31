"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ExternalLink, X } from "lucide-react";

function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || "";
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|MessengerForiOS|musical\.ly/i.test(ua);
}

function openInExternalBrowser() {
  const url = window.location.href;
  if (/android/i.test(navigator.userAgent)) {
    window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
  } else {
    // iOS: open in Safari via a special URL scheme
    window.open(url, "_blank");
  }
}

export default function InAppBrowserWarning() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setShow(isInAppBrowser());
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-400 text-charcoal px-4 py-3 shadow-lg">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium flex-1">
          Google sign-in doesn&apos;t work inside Messenger or Instagram. Please open this page in Safari or Chrome.
        </p>
        <button
          onClick={openInExternalBrowser}
          className="inline-flex items-center gap-1.5 bg-charcoal text-white px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 hover:bg-black transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Browser
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-charcoal/60 hover:text-charcoal shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

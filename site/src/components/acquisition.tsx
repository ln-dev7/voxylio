"use client";

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

/**
 * Vercel Web Analytics + first-touch acquisition capture.
 *
 * On the FIRST visit that carries a utm_* / ?ref= parameter (or an
 * external referrer), a long-lived cookie remembers where the visitor
 * came from; /api/checkout copies it into the Polar checkout metadata,
 * so every paying customer is tagged with the channel that brought
 * them. First-touch on purpose: the launch post deserves the credit,
 * not the last Google search for "voxylio".
 */
export function AcquisitionTracking() {
  useEffect(() => {
    try {
      if (document.cookie.includes("vx-utm=")) return;
      const p = new URLSearchParams(window.location.search);
      const referrer = (() => {
        try {
          const h = document.referrer ? new URL(document.referrer).hostname : "";
          return h && h !== window.location.hostname ? h : "";
        } catch {
          return "";
        }
      })();
      const data: Record<string, string> = {
        source: p.get("utm_source") || p.get("ref") || "",
        medium: p.get("utm_medium") || "",
        campaign: p.get("utm_campaign") || "",
        referrer,
        landing: window.location.pathname,
      };
      // Direct visit with no referrer: nothing worth stamping.
      if (!data.source && !data.referrer) return;
      document.cookie =
        "vx-utm=" +
        encodeURIComponent(JSON.stringify(data)) +
        "; path=/; max-age=15552000; SameSite=Lax";
    } catch {
      /* cookie/URL oddities: analytics must never break the page */
    }
  }, []);
  return <Analytics />;
}

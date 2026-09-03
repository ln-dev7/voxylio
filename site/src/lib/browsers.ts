import {
  CHROME_STORE_URL,
  EDGE_STORE_URL,
  FIREFOX_STORE_URL,
} from "./constants";

/**
 * One entry per browser, in display order — Chrome first (the primary
 * CTA everywhere). An empty url means "store review still pending": the
 * install section renders a "coming soon" pill and the hero dropdown a
 * disabled row; fill the constant in constants.ts and every surface
 * turns it into a live link, nothing else to change.
 */
export type Browser = {
  key: string;
  name: string;
  logo: string;
  url: string;
};

// Widened type (not `as const`): with every current url a non-empty
// literal, the narrowed union made the "coming soon" branch `never` and
// broke the type check — the branch must stay compilable for the next
// parked browser.
export const BROWSERS: readonly Browser[] = [
  {
    key: "chrome",
    name: "Chrome",
    logo: "/logos/chrome.svg",
    url: CHROME_STORE_URL,
  },
  { key: "edge", name: "Edge", logo: "/logos/edge.svg", url: EDGE_STORE_URL },
  {
    key: "firefox",
    name: "Firefox",
    logo: "/logos/firefox.svg",
    url: FIREFOX_STORE_URL,
  },
  // Safari is parked (App Store submission on hold — owner decision,
  // 2026-09-03): re-add the entry here when a listing goes live.
];

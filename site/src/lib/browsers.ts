import {
  CHROME_STORE_URL,
  EDGE_STORE_URL,
  FIREFOX_STORE_URL,
  SAFARI_STORE_URL,
} from "./constants";

/**
 * One entry per browser, in display order — Chrome first (the primary
 * CTA everywhere). An empty url means "store review still pending": the
 * install section renders a "coming soon" pill and the hero dropdown a
 * disabled row; fill the constant in constants.ts and every surface
 * turns it into a live link, nothing else to change.
 */
export const BROWSERS = [
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
  {
    key: "safari",
    name: "Safari",
    logo: "/logos/safari.svg",
    url: SAFARI_STORE_URL,
  },
] as const;

export type Browser = (typeof BROWSERS)[number];

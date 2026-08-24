// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build:chrome).
(() => {
  // src/background.js
  var memCache = /* @__PURE__ */ new Map();
  async function translateFallback(text, source, target) {
    const key = source + "->" + target + "::" + text;
    if (memCache.has(key)) return memCache.get(key);
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + encodeURIComponent(source || "auto") + "&tl=" + encodeURIComponent(target) + "&dt=t&q=" + encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const out = (data && data[0] ? data[0] : []).map((seg) => seg && seg[0] || "").join("");
    if (!out) throw new Error("empty translation");
    if (memCache.size > 5e3) memCache.clear();
    memCache.set(key, out);
    return out;
  }
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "translate") {
      translateFallback(msg.text, msg.source || "auto", msg.target || "fr").then((t) => sendResponse({ ok: true, text: t })).catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
  });
})();

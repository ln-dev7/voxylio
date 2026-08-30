// Submit every sitemap URL to IndexNow (Bing, Naver, Seznam, Yandex
// share the endpoint). Run AFTER a deploy that changes pages:
//
//   node site/scripts/indexnow.mjs
//
// Google ignores IndexNow — this is for the other engines. The key file
// lives at /public/<key>.txt so the endpoint can verify ownership.

const HOST = "voxylio.lndev.me";
const KEY = "6c7e2bf8f5e8c7ebbee1148d06fb24e1";

const res = await fetch(`https://${HOST}/sitemap.xml`);
if (!res.ok) {
  console.error(`sitemap fetch failed: ${res.status}`);
  process.exit(1);
}
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) {
  console.error("no <loc> entries found in sitemap");
  process.exit(1);
}

const submit = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
});
// 200 = submitted, 202 = accepted (key not yet verified) — both fine.
console.log(`submitted ${urls.length} urls → HTTP ${submit.status}`);

// Cloudflare Pages Function: GET /api/stars -> { "stars": 123 }
// The site's visitors never call GitHub themselves: this asks GitHub at most about once an hour (Cloudflare's cache)
// and the landing page reads the number from here.
const REPO = "lukasvecerka23/blueprint-deck-kit";

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/stars", context.request.url).toString());
  const cached = await cache.match(key);
  if (cached) return cached;

  let stars = null;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { "User-Agent": "blueprint-deck-site", Accept: "application/vnd.github+json" },
    });
    if (r.ok) stars = (await r.json()).stargazers_count ?? null;
  } catch { /* GitHub unreachable: no count */ }

  const res = new Response(JSON.stringify({ stars }), {
    headers: {
      "content-type": "application/json",
      // an hour in Cloudflare's cache and in the browser; a failed lookup is retried after 5 minutes
      "cache-control": `public, max-age=${stars === null ? 300 : 3600}`,
    },
  });
  context.waitUntil(cache.put(key, res.clone()));
  return res;
}

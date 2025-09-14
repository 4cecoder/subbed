import { NextResponse } from "next/server";
import { listSubscriptions } from "../../../lib/db";
import { readSettings } from "../../../lib/settings";

// Aggregated feed endpoint
// Query params:
// - page: 1-based page number
// - per_page: items per page (default from settings)
// - per_channel: maximum items to fetch per subscription (default from settings)
// - q: optional search query to filter titles/descriptions
// - type: all|short|video

const DEFAULT_PER_PAGE = 20;
const DEFAULT_PER_CHANNEL = 10;
const MAX_PER_CHANNEL = 50;

function isValidNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

// helper to detect shorts (simple copy of the heuristic used in rss route)
async function createShortDetector() {
  const cache = new Map<string, boolean>();
  const headers = { "User-Agent": "subbed-app (+https://example)" };

  async function checkIsShort(videoId: string | undefined, link: string | undefined, hay: string) {
    const key = videoId || link || hay;
    if (cache.has(key)) return cache.get(key) as boolean;

    const basic = Boolean((link || "").includes("/shorts/") || /#shorts\b/i.test(hay) || /\bshorts\b/i.test(hay));
    if (basic) {
      cache.set(key, true);
      return true;
    }

    if (!videoId) {
      cache.set(key, false);
      return false;
    }

    // try shorts URL first
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 5000);
      try {
        const r = await fetch(`https://www.youtube.com/shorts/${videoId}`, { headers, signal: ctrl.signal });
        if (r && r.ok) {
          if (r.url && r.url.includes("/shorts/")) {
            clearTimeout(to);
            cache.set(key, true);
            return true;
          }
          const text = await r.text();
          if (/<link[^>]*rel=["']canonical["'][^>]*href=["'][^"']*\/shorts\//i.test(text) || /property=["']og:url["'][^>]*content=["'][^"']*\/shorts\//i.test(text) || /"isShorts":\s*true/i.test(text) || /"url":"https:\/\/www\.youtube\.com\/shorts\//i.test(text)) {
            clearTimeout(to);
            cache.set(key, true);
            return true;
          }
          const mLenShort = text.match(/"lengthSeconds"\s*:\s*"?(\d+)"?/i);
          if (mLenShort) {
            const secs = Number(mLenShort[1]);
            if (!isNaN(secs) && secs <= 60) {
              clearTimeout(to);
              cache.set(key, true);
              return true;
            }
          }
        }
      } finally {
        clearTimeout(to);
      }
    } catch {
      // ignore
    }

    // fallback to watch page
    try {
      const ctrl2 = new AbortController();
      const to2 = setTimeout(() => ctrl2.abort(), 5000);
      try {
        const r2 = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers, signal: ctrl2.signal });
        if (r2 && r2.ok) {
          const body = await r2.text();
          if (/<link[^>]*rel=["']canonical["'][^>]*href=["'][^"']*\/shorts\//i.test(body) || /property=["']og:url["'][^>]*content=["'][^"']*\/shorts\//i.test(body) || /"isShorts":\s*true/i.test(body) || /"url":"https:\/\/www\.youtube\.com\/shorts\//i.test(body)) {
            clearTimeout(to2);
            cache.set(key, true);
            return true;
          }
          const mLen = body.match(/"lengthSeconds"\s*:\s*"?(\d+)"?/i);
          if (mLen) {
            const secs = Number(mLen[1]);
            if (!isNaN(secs) && secs <= 60) {
              clearTimeout(to2);
              cache.set(key, true);
              return true;
            }
          }
        }
      } finally {
        clearTimeout(to2);
      }
    } catch {
      // ignore
    }

    cache.set(key, false);
    return false;
  }

  return checkIsShort;
}

export async function GET(req: Request) {
  try {
    const settings = await readSettings();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, isValidNumber(searchParams.get("page"), 1));
    const per_page = Math.max(1, isValidNumber(searchParams.get("per_page"), settings?.per_page || DEFAULT_PER_PAGE));
    const per_channel = Math.min(MAX_PER_CHANNEL, Math.max(1, isValidNumber(searchParams.get("per_channel"), settings?.per_channel || DEFAULT_PER_CHANNEL)));
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const type = (searchParams.get("type") || settings?.defaultFeedType || "all").toLowerCase();
    const concurrency = Math.max(1, isValidNumber(settings?.concurrency || 6, 6));

    const subs = await listSubscriptions();
    // fetch per-channel feeds but limit concurrency
    let items: unknown[] = [];

    const chunks: string[][] = [];
    for (let i = 0; i < subs.length; i += concurrency) {
      chunks.push(subs.slice(i, i + concurrency).map((s: { id: string }) => s.id));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (channelId) => {
          try {
            const url = new URL(`/api/rss`, req.url);
            url.searchParams.set("id", channelId);
            url.searchParams.set("limit", String(per_channel));
            if (q) url.searchParams.set("q", q);
            if (type) url.searchParams.set("type", type);

            const r = await fetch(url.toString(), { headers: { "User-Agent": "subbed-app (+https://example)" } });
            if (!r.ok) return;
            const j = await r.json();
            const channelTitle = j.channelTitle || subs.find((s: { id: string; title?: string }) => s.id === channelId)?.title || null;
            const from = (j.items || []).map((it: unknown) => ({ ...it, channelId, channelTitle }));
            items.push(...from);
          } catch (e) {
            // ignore per-channel errors
          }
        })
      );
    }

    // apply fallback type filter in case per-channel endpoints didn't fully respect 'type'
    if (type === "short") {
      items = items.filter((it) => !!it.isShort);
    } else if (type === "video") {
      items = items.filter((it) => !it.isShort);
    }

    // if no items found for requested type, try a secondary detection pass (fetch without type and classify)
    if ((type === "short" || type === "video") && items.length === 0 && subs.length > 0) {
      const checkIsShort = await createShortDetector();
      // re-fetch per-channel feeds without type
      items = [];
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (channelId) => {
            try {
              const url = new URL(`/api/rss`, req.url);
              url.searchParams.set("id", channelId);
              url.searchParams.set("limit", String(per_channel));
              if (q) url.searchParams.set("q", q);

              const r = await fetch(url.toString(), { headers: { "User-Agent": "subbed-app (+https://example)" } });
              if (!r.ok) return;
              const j = await r.json();
              const channelTitle = j.channelTitle || subs.find((s: { id: string; title?: string }) => s.id === channelId)?.title || null;
              const from = (j.items || []).map((it: unknown) => ({ ...it, channelId, channelTitle }));
              items.push(...from);
            } catch (e) {
              // ignore
            }
          })
        );
      }

      // classify items (limit detection work)
      const classified: unknown[] = [];
      // limit the number of checks to avoid too many network calls
      const maxChecks = Math.max(50, per_page * 3);
      let checks = 0;
      for (const it of items) {
        if (checks >= maxChecks) break;
        const hay = `${it.title || ""} ${it.description || ""}`;
        const isShort = it.isShort ?? (await checkIsShort(it.id, it.link, hay));
        checks++;
        if (type === "short" && isShort) classified.push({ ...it, isShort: true });
        if (type === "video" && !isShort) classified.push({ ...it, isShort: false });
      }
      items = classified;
    }

    // sort globally by published date
    items.sort((a, b) => {
      const ta = new Date(a.published).getTime() || 0;
      const tb = new Date(b.published).getTime() || 0;
      if ((settings?.sortOrder || "newest") === "oldest") return ta - tb;
      return tb - ta;
    });

    const total = items.length;
    const start = (page - 1) * per_page;
    const pageItems = items.slice(start, start + per_page);

    return NextResponse.json({ page, per_page, total, items: pageItems });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

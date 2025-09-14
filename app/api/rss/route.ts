import { NextResponse } from 'next/server';
import { readSettings } from '../../../lib/settings';

export const runtime = 'nodejs';
export const preferredRegion = 'iad1';
export const revalidate = 300;

const isChannelId = (s: string) => /^UC[A-Za-z0-9_-]{22}$/.test(s);

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  attempts = 3,
  backoffMs = 400
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) return res;
      await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
    }
  }
  if (lastErr) throw lastErr;
  return fetch(url, options);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let id = (searchParams.get('id') || searchParams.get('channel') || '').trim();

  const settings = await readSettings();
  const defaultLimit = settings?.per_channel || 10;
  const limit = Math.max(
    1,
    Math.min(50, Number(searchParams.get('limit') || String(defaultLimit)))
  );
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const type = (searchParams.get('type') || settings?.defaultFeedType || 'all').toLowerCase();

  if (!id) {
    return NextResponse.json({ error: 'missing id' }, { status: 400 });
  }

  if (!isChannelId(id)) {
    const m = id.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
    if (m) {
      id = m[1];
    } else {
      // Build absolute URL for various input forms
      let asUrl = id;
      if (!asUrl.startsWith('http')) {
        if (
          asUrl.startsWith('@') ||
          asUrl.startsWith('user/') ||
          asUrl.startsWith('c/') ||
          /^[A-Za-z0-9_-]+$/.test(asUrl)
        ) {
          asUrl = `https://www.youtube.com/${asUrl}`;
        } else {
          asUrl = `https://${asUrl}`;
        }
      }

      // try oEmbed to find author_url
      try {
        const r = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(asUrl)}&format=json`,
          { headers: { 'User-Agent': 'subbed-app' } }
        );
        if (r.ok) {
          const j = await r.json();
          const authorUrl = j.author_url;
          const mm = authorUrl && authorUrl.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
          if (mm) id = mm[1];
        }
      } catch {
        // ignore
      }

      // if still unresolved, try resolving from a video link (watch?v= or youtu.be)
      if (!isChannelId(id)) {
        const videoMatch =
          asUrl.match(/[?&]v=([A-Za-z0-9_-]{11})/) || asUrl.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        const videoId = videoMatch ? videoMatch[1] : null;
        if (videoId) {
          try {
            const r2 = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
              headers: { 'User-Agent': 'subbed-app (+https://example)' },
            });
            if (r2.ok) {
              const txt = await r2.text();
              // look for common channel id patterns
              let m1 = txt.match(/"channelId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
              if (m1) id = m1[1];
              else {
                m1 = txt.match(/"browseId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
                if (m1) id = m1[1];
              }
              if (!isChannelId(id)) {
                const can = txt.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
                if (can) {
                  const href = can[1];
                  const mm2 = href.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
                  if (mm2) id = mm2[1];
                }
              }
            }
          } catch {
            // ignore
          }
        }
      }

      // final attempt: fetch the provided URL and try to extract channel info
      if (!isChannelId(id)) {
        try {
          const pageTxt = await fetch(asUrl, {
            headers: { 'User-Agent': 'subbed-app (+https://example)' },
          });
          if (pageTxt.ok) {
            const txt = await pageTxt.text();
            const can = txt.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
            if (can) {
              const href = can[1];
              const mm2 = href.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
              if (mm2) id = mm2[1];
            }
            if (!isChannelId(id)) {
              let m1 = txt.match(/"channelId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
              if (m1) id = m1[1];
              else {
                m1 = txt.match(/"browseId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
                if (m1) id = m1[1];
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (!isChannelId(id)) {
    return NextResponse.json({ error: 'invalid or unresolved channel id' }, { status: 400 });
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
  try {
    const r = await fetchWithRetry(
      feedUrl,
      {
        headers: {
          'User-Agent': 'subbed-app (+https://subbed.app)',
          Accept: 'application/atom+xml, application/xml;q=0.9, */*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        // Hint Next.js to cache this external request for 5 minutes
        next: { revalidate: 300 },
      },
      3,
      500
    );
    if (!r.ok) {
      return NextResponse.json(
        { error: 'failed to fetch feed', status: r.status },
        { status: 502, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' } }
      );
    }

    const xml = await r.text();

    const channelTitleMatch = xml.match(/<title>([^<]+)<\/title>/i);
    const channelTitle = channelTitleMatch ? channelTitleMatch[1] : null;

    const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)).map(m => m[1]);

    // per-request cache to avoid repeated network checks
    const shortCache = new Map<string, boolean>();

    async function checkIsShort(
      videoId: string | undefined,
      link: string | undefined,
      hay: string
    ) {
      const key = videoId || link || hay;
      if (shortCache.has(key)) return shortCache.get(key);

      // basic heuristic
      const basic = Boolean(
        (link || '').includes('/shorts/') || /#shorts\b/i.test(hay) || /\bshorts\b/i.test(hay)
      );
      if (basic) {
        shortCache.set(key, true);
        return true;
      }

      if (!videoId) {
        shortCache.set(key, false);
        return false;
      }

      const headers = { 'User-Agent': 'subbed-app (+https://example)' };

      // try the shorts URL first (fast check)
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 5000);
        try {
          const r = await fetchWithRetry(
            `https://www.youtube.com/shorts/${videoId}`,
            {
              headers,
              signal: ctrl.signal,
            },
            2,
            300
          );
          if (r && r.ok) {
            if (r.url && r.url.includes('/shorts/')) {
              clearTimeout(to);
              shortCache.set(key, true);
              return true;
            }
            const text = await r.text();
            if (
              /<link[^>]*rel=["']canonical["'][^>]*href=["'][^"']*\/shorts\//i.test(text) ||
              /property=["']og:url["'][^>]*content=["'][^"']*\/shorts\//i.test(text) ||
              /"isShorts":\s*true/i.test(text) ||
              /"url":"https:\/\/www\.youtube\.com\/shorts\//i.test(text)
            ) {
              clearTimeout(to);
              shortCache.set(key, true);
              return true;
            }
            // try to detect duration from embedded JSON (lengthSeconds)
            const mLenShort = text.match(/"lengthSeconds"\s*:\s*"?(\d+)"?/i);
            if (mLenShort) {
              const secs = Number(mLenShort[1]);
              if (!isNaN(secs) && secs <= 60) {
                clearTimeout(to);
                shortCache.set(key, true);
                return true;
              }
            }
          }
        } finally {
          clearTimeout(to);
        }
      } catch {
        // ignore fetch errors
      }

      // fallback: fetch the watch page and inspect for canonical /shorts/ or markers
      try {
        const ctrl2 = new AbortController();
        const to2 = setTimeout(() => ctrl2.abort(), 5000);
        try {
          const r2 = await fetchWithRetry(
            `https://www.youtube.com/watch?v=${videoId}`,
            {
              headers,
              signal: ctrl2.signal,
            },
            2,
            300
          );
          if (r2 && r2.ok) {
            const body = await r2.text();
            if (
              /<link[^>]*rel=["']canonical["'][^>]*href=["'][^"']*\/shorts\//i.test(body) ||
              /property=["']og:url["'][^>]*content=["'][^"']*\/shorts\//i.test(body) ||
              /"isShorts":\s*true/i.test(body) ||
              /"url":"https:\/\/www\.youtube\.com\/shorts\//i.test(body)
            ) {
              shortCache.set(key, true);
              return true;
            }
            // look for lengthSeconds in the watch page JSON
            const mLen = body.match(/"lengthSeconds"\s*:\s*"?(\d+)"?/i);
            if (mLen) {
              const secs = Number(mLen[1]);
              if (!isNaN(secs) && secs <= 60) {
                shortCache.set(key, true);
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

      shortCache.set(key, false);
      return false;
    }

    const items = [];
    for (const entry of entries) {
      const title = (entry.match(/<title>(.*?)<\/title>/i) || [null, ''])[1];
      const link = (entry.match(/<link[^>]*href=["']([^"']+)["']?/i) || [null, ''])[1];
      const published = (entry.match(/<published>(.*?)<\/published>/i) || [null, ''])[1];
      const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/i) || [null, ''])[1];
      const thumbnail = (entry.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) || [
        null,
        '',
      ])[1];
      const description =
        (entry.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/i) || [
          null,
          '',
        ])[1] || '';
      const hay = `${title || ''} ${description || ''}`;

      if (q) {
        if (!hay.toLowerCase().includes(q)) continue;
      }

      const initialIsShort = Boolean(
        (link || '').includes('/shorts/') || /#shorts\b/i.test(hay) || /\bshorts\b/i.test(hay)
      );

      if (type === 'all') {
        items.push({
          id: videoId || title,
          title,
          link,
          published,
          thumbnail,
          description,
          isShort: initialIsShort,
        });
      } else if (type === 'short') {
        if (initialIsShort) {
          items.push({
            id: videoId || title,
            title,
            link,
            published,
            thumbnail,
            description,
            isShort: true,
          });
        } else {
          const detected = await checkIsShort(videoId, link, hay);
          if (detected)
            items.push({
              id: videoId || title,
              title,
              link,
              published,
              thumbnail,
              description,
              isShort: true,
            });
        }
      } else if (type === 'video') {
        if (!initialIsShort) {
          const detected = await checkIsShort(videoId, link, hay);
          if (!detected)
            items.push({
              id: videoId || title,
              title,
              link,
              published,
              thumbnail,
              description,
              isShort: false,
            });
        }
      }

      if (items.length >= limit) break;
    }

    return NextResponse.json({ channelId: id, channelTitle, items });
  } catch (err) {
    return NextResponse.json(
      { error: 'error fetching/parsing feed', detail: String(err) },
      { status: 500 }
    );
  }
}

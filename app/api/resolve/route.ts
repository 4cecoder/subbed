import { NextResponse } from "next/server";

const isChannelId = (s: string) => /^UC[A-Za-z0-9_-]{22}$/.test(s);

async function fetchTextWithTimeout(url: string, timeout = 6000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "subbed-app (+https://example)" }, signal: ctrl.signal });
    if (r.ok) return await r.text();
  } catch (e) {
    // ignore
  } finally {
    clearTimeout(to);
  }
  return null;
}

function extractChannelIdFromHtml(txt: string | null) {
  if (!txt) return null;

  // canonical link to channel
  let m = txt.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (m) {
    const href = m[1];
    const mm = href.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
    if (mm) return mm[1];
  }

  // direct channel link anywhere
  m = txt.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
  if (m) return m[1];

  // JSON patterns commonly present in YouTube pages
  m = txt.match(/"channelId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
  if (m) return m[1];

  m = txt.match(/"browseId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
  if (m) return m[1];

  m = txt.match(/"ownerChannelId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
  if (m) return m[1];

  m = txt.match(/"externalChannelId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
  if (m) return m[1];

  // meta tag itemprop (sometimes present)
  m = txt.match(/<meta[^>]*itemprop=["']channelId["'][^>]*content=["'](UC[A-Za-z0-9_-]{22})["'][^>]*>/i);
  if (m) return m[1];

  return null;
}

async function resolveAuthorUrlToChannel(authorUrl: string) {
  try {
    if (!authorUrl.startsWith("http")) {
      authorUrl = "https://www.youtube.com" + (authorUrl.startsWith("/") ? authorUrl : "/" + authorUrl);
    }
    const txt = await fetchTextWithTimeout(authorUrl, 6000);
    return extractChannelIdFromHtml(txt);
  } catch (e) {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url") || searchParams.get("q") || "";
  if (!raw) {
    return NextResponse.json({ error: "missing url parameter" }, { status: 400 });
  }

  const input = raw.trim();

  if (isChannelId(input)) {
    return NextResponse.json({ channelId: input, title: null });
  }

  let asUrl = input;
  if (!asUrl.startsWith("http")) {
    if (
      asUrl.startsWith("@") ||
      asUrl.startsWith("user/") ||
      asUrl.startsWith("c/") ||
      /^[A-Za-z0-9_-]+$/.test(asUrl)
    ) {
      asUrl = `https://www.youtube.com/${asUrl}`;
    } else {
      asUrl = `https://${asUrl}`;
    }
  }

  // try to detect a video id (watch?v= or youtu.be/)
  const videoMatch = asUrl.match(/[?&]v=([A-Za-z0-9_-]{11})/) || asUrl.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  const videoId = videoMatch ? videoMatch[1] : null;

  // Try oEmbed first (fast and lightweight)
  try {
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(asUrl)}&format=json`;
    const r = await fetch(oembed, { headers: { "User-Agent": "subbed-app (+https://example)" } });
    if (r.ok) {
      const j = await r.json();
      const authorUrl = j.author_url;
      const title = j.title || j.author_name || null;
      if (typeof authorUrl === "string") {
        const m = authorUrl.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
        if (m) {
          return NextResponse.json({ channelId: m[1], title });
        }
        // try resolving the author's page to a channel id
        try {
          const resolved = await resolveAuthorUrlToChannel(authorUrl);
          if (resolved) return NextResponse.json({ channelId: resolved, title });
        } catch (e) {
          // ignore and continue
        }
      }
    }
  } catch (err) {
    // ignore and try HTML/further fallbacks
  }

  // If we have a video id, try the watch page for channel info
  if (videoId) {
    try {
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const txt = await fetchTextWithTimeout(watchUrl, 6000);
      const id = extractChannelIdFromHtml(txt);
      if (id) {
        const t =
          txt?.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
          txt?.match(/<title>([^<]+)<\/title>/i)?.[1] ||
          null;
        return NextResponse.json({ channelId: id, title: t });
      }
    } catch (e) {
      // ignore
    }
  }

  // Final fallback: fetch the provided URL and search for channel id
  try {
    const r2 = await fetch(asUrl, { headers: { "User-Agent": "subbed-app (+https://example)" } });
    if (r2.ok) {
      const txt = await r2.text();

      const m = txt.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      if (m) {
        const href = m[1];
        const mm = href.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
        if (mm) {
          const t =
            txt.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
            txt.match(/<title>([^<]+)<\/title>/i)?.[1] ||
            null;
          return NextResponse.json({ channelId: mm[1], title: t });
        }
      }

      const browse = txt.match(/"browseId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
      if (browse) {
        const t =
          txt.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
          txt.match(/<title>([^<]+)<\/title>/i)?.[1] ||
          null;
        return NextResponse.json({ channelId: browse[1], title: t });
      }

      const other = extractChannelIdFromHtml(txt);
      if (other) {
        const t =
          txt.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
          txt.match(/<title>([^<]+)<\/title>/i)?.[1] ||
          null;
        return NextResponse.json({ channelId: other, title: t });
      }
    }
  } catch (err) {
    // ignore
  }

  return NextResponse.json({ error: "could not resolve channel id" }, { status: 404 });
}

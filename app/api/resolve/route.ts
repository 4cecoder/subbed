import { NextResponse } from 'next/server';

const isChannelId = (s: string) => /^UC[A-Za-z0-9_-]{22}$/.test(s);

async function fetchTextWithTimeout(url: string, timeout = 6000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'subbed-app (+https://example)' },
      signal: ctrl.signal,
    });
    if (r.ok) return await r.text();
  } catch {
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
  m = txt.match(
    /<meta[^>]*itemprop=["']channelId["'][^>]*content=["'](UC[A-Za-z0-9_-]{22})["'][^>]*>/i
  );
  if (m) return m[1];

  return null;
}

async function resolveAuthorUrlToChannel(authorUrl: string) {
  try {
    if (!authorUrl.startsWith('http')) {
      authorUrl =
        'https://www.youtube.com' + (authorUrl.startsWith('/') ? authorUrl : '/' + authorUrl);
    }
    const txt = await fetchTextWithTimeout(authorUrl, 6000);
    return extractChannelIdFromHtml(txt);
  } catch {
    return null;
  }
}

async function getChannelNameFromChannelId(channelId: string) {
  try {
    const channelUrl = `https://www.youtube.com/channel/${channelId}`;
    const txt = await fetchTextWithTimeout(channelUrl, 6000);
    if (!txt) return null;

    // Try various methods to extract channel name
    let channelName = null;

    // Method 1: og:title meta tag (most reliable)
    let m = txt.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (m) channelName = m[1];

    // Method 2: title tag
    if (!channelName) {
      m = txt.match(/<title>([^<]+?)\s*-\s*YouTube<\/title>/i);
      if (m) channelName = m[1];
    }

    // Method 3: JSON data in the page
    if (!channelName) {
      m = txt.match(/"title"\s*:\s*"([^"]+)"/);
      if (m) channelName = m[1];
    }

    // Method 4: More specific JSON patterns
    if (!channelName) {
      m = txt.match(/"channelMetadataRenderer"\s*:\s*{[^}]*"title"\s*:\s*"([^"]+)"/);
      if (m) channelName = m[1];
    }

    return channelName ? channelName.trim() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('url') || searchParams.get('q') || '';
  if (!raw) {
    return NextResponse.json({ error: 'missing url parameter' }, { status: 400 });
  }

  const input = raw.trim();

  if (isChannelId(input)) {
    return NextResponse.json({ channelId: input, title: null });
  }

  let asUrl = input;
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

  // try to detect a video id (watch?v= or youtu.be/)
  const videoMatch =
    asUrl.match(/[?&]v=([A-Za-z0-9_-]{11})/) || asUrl.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  const videoId = videoMatch ? videoMatch[1] : null;

  // Try oEmbed first (fast and lightweight)
  try {
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(asUrl)}&format=json`;
    const r = await fetch(oembed, { headers: { 'User-Agent': 'subbed-app (+https://example)' } });
    if (r.ok) {
      const j = await r.json();
      const authorUrl = j.author_url;
      if (typeof authorUrl === 'string') {
        const m = authorUrl.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
        if (m) {
          const channelName = await getChannelNameFromChannelId(m[1]);
          return NextResponse.json({
            channelId: m[1],
            title: channelName || j.author_name || null,
          });
        }
        // try resolving the author's page to a channel id
        try {
          const resolved = await resolveAuthorUrlToChannel(authorUrl);
          if (resolved) {
            const channelName = await getChannelNameFromChannelId(resolved);
            return NextResponse.json({
              channelId: resolved,
              title: channelName || j.author_name || null,
            });
          }
        } catch {
          // ignore and continue
        }
      }
    }
  } catch {
    // ignore and try HTML/further fallbacks
  }

  // If we have a video id, try the watch page for channel info
  if (videoId) {
    try {
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const txt = await fetchTextWithTimeout(watchUrl, 6000);
      const id = extractChannelIdFromHtml(txt);
      if (id) {
        const channelName = await getChannelNameFromChannelId(id);
        return NextResponse.json({ channelId: id, title: channelName });
      }
    } catch {
      // ignore
    }
  }

  // Final fallback: fetch the provided URL and search for channel id
  try {
    const r2 = await fetch(asUrl, { headers: { 'User-Agent': 'subbed-app (+https://example)' } });
    if (r2.ok) {
      const txt = await r2.text();

      const m = txt.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      if (m) {
        const href = m[1];
        const mm = href.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
        if (mm) {
          const channelName = await getChannelNameFromChannelId(mm[1]);
          return NextResponse.json({ channelId: mm[1], title: channelName });
        }
      }

      const browse = txt.match(/"browseId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/);
      if (browse) {
        const channelName = await getChannelNameFromChannelId(browse[1]);
        return NextResponse.json({ channelId: browse[1], title: channelName });
      }

      const other = extractChannelIdFromHtml(txt);
      if (other) {
        const channelName = await getChannelNameFromChannelId(other);
        return NextResponse.json({ channelId: other, title: channelName });
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ error: 'could not resolve channel id' }, { status: 404 });
}

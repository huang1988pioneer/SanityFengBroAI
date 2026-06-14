import type { Handlers } from "$fresh/server.ts";

type TubeChannelInput = {
  alias?: string;
  sourceUrl?: string;
  url?: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146 Safari/537.36";

const DEFAULT_CHANNELS = [
  "https://www.youtube.com/@SJdiao/videos",
  "https://www.youtube.com/@henren778/videos",
  "https://www.youtube.com/@libertas1984/videos",
  "https://www.youtube.com/@sunlao/videos",
  "https://www.youtube.com/@SunChannelHK/videos",
  "https://www.youtube.com/@jilixiaoshimei/videos",
  "https://www.youtube.com/@jiangtaigong/videos",
].map((sourceUrl) => ({ alias: "", sourceUrl }));

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function pick(text: string, pattern: RegExp) {
  return decodeHtml(pattern.exec(text)?.[1] || "");
}

function normalizeSource(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("@")) return `https://www.youtube.com/${encodeURI(trimmed)}/videos`;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (!/youtube\.com$/i.test(url.hostname) && !/\.youtube\.com$/i.test(url.hostname)) return "";
      return url.toString().replace(/\/$/, "").replace(/\/videos$/i, "/videos");
    } catch {
      return "";
    }
  }
  return `https://www.youtube.com/@${encodeURIComponent(trimmed)}/videos`;
}

function fallbackTitle(sourceUrl: string) {
  try {
    const path = decodeURIComponent(new URL(sourceUrl).pathname);
    return path.replace(/^\/@?/, "").replace(/\/videos\/?$/i, "") || sourceUrl;
  } catch {
    return sourceUrl;
  }
}

function normalizeChannels(inputs: unknown[]) {
  const seen = new Set<string>();
  const channels: Array<{ alias: string; sourceUrl: string }> = [];
  for (const input of inputs) {
    const item = typeof input === "string" ? { sourceUrl: input } : input as TubeChannelInput;
    const sourceUrl = normalizeSource(String(item?.sourceUrl || item?.url || ""));
    if (!sourceUrl || seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);
    channels.push({ alias: String(item?.alias || "").trim(), sourceUrl });
  }
  return channels.length ? channels : DEFAULT_CHANNELS;
}

async function fetchText(url: string, accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8") {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
  return await response.text();
}

async function resolveChannel(sourceUrl: string) {
  const channelUrl = sourceUrl.replace(/\/videos\/?$/i, "").replace(/\/$/, "");
  const html = await fetchText(channelUrl);
  const channelId =
    pick(html, /"channelId"\s*:\s*"([^"]+)"/) ||
    pick(html, /"externalId"\s*:\s*"([^"]+)"/) ||
    pick(html, /youtube\.com\/channel\/(UC[\w-]+)/);
  if (!channelId) throw new Error("找不到 YouTube channel id");
  const title =
    pick(html, /<meta property="og:title" content="([^"]+)"/) ||
    pick(html, /<title>(.*?)<\/title>/) ||
    fallbackTitle(sourceUrl);
  return { channelId, title: title.replace(/ - YouTube$/i, "") };
}

function parseFeed(xml: string) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const entry = match[1];
    const videoId = pick(entry, /<yt:videoId>(.*?)<\/yt:videoId>/);
    return {
      videoId,
      title: pick(entry, /<title>(.*?)<\/title>/),
      url: pick(entry, /<link[^>]+href="([^"]+)"/) || `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: pick(entry, /<published>(.*?)<\/published>/),
      updatedAt: pick(entry, /<updated>(.*?)<\/updated>/),
      thumbnail: pick(entry, /<media:thumbnail[^>]+url="([^"]+)"/) || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ""),
    };
  });
}

async function fetchChannel(channel: { alias: string; sourceUrl: string }) {
  const resolved = await resolveChannel(channel.sourceUrl);
  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(resolved.channelId)}`,
    "application/xml,text/xml,*/*",
  );
  return {
    sourceUrl: channel.sourceUrl,
    channelId: resolved.channelId,
    title: channel.alias || resolved.title,
    videos: parseFeed(xml).slice(0, 10),
  };
}

function latestTime(channel: { videos: Array<{ publishedAt: string; updatedAt: string }> }) {
  return Math.max(0, ...channel.videos.map((video) => new Date(video.publishedAt || video.updatedAt).getTime() || 0));
}

async function build(channelsInput: unknown[]) {
  const uniqueChannels = normalizeChannels(channelsInput);
  const settled = await Promise.allSettled(uniqueChannels.map(fetchChannel));
  const channels = settled.map((item, index) => {
    if (item.status === "fulfilled") return item.value;
    const channel = uniqueChannels[index];
    return {
      sourceUrl: channel.sourceUrl,
      channelId: "",
      title: channel.alias || fallbackTitle(channel.sourceUrl),
      videos: [],
      error: item.reason instanceof Error ? item.reason.message : "讀取失敗",
    };
  }).sort((left, right) => latestTime(right) - latestTime(left));

  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const recentVideos = channels.flatMap((channel) =>
    channel.videos
      .filter((video) => {
        const time = new Date(video.publishedAt || video.updatedAt).getTime();
        return Number.isFinite(time) && now - time <= threeDays;
      })
      .map((video) => ({ ...video, channelTitle: channel.title, channelId: channel.channelId }))
  ).sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());

  return {
    fetchedAt: new Date().toISOString(),
    sourceCount: uniqueChannels.length,
    defaultSourceCount: DEFAULT_CHANNELS.length,
    channels,
    recentVideos,
  };
}

export const handler: Handlers = {
  async GET() {
    return json(await build(DEFAULT_CHANNELS));
  },
  async POST(request) {
    try {
      const body = await request.json().catch(() => ({}));
      const inputs = Array.isArray(body.channels) ? body.channels : Array.isArray(body.sources) ? body.sources : DEFAULT_CHANNELS;
      return json(await build(inputs));
    } catch {
      return json(await build(DEFAULT_CHANNELS));
    }
  },
};

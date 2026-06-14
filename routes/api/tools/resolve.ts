import type { Handlers } from "$fresh/server.ts";

type PricePoint = {
  date: string;
  price: number | null;
  currency?: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146 Safari/537.36";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function productCode(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname.includes("momoshop.com.tw")) {
    return parsed.searchParams.get("i_code") || parsed.pathname.split("/").filter(Boolean).at(-1) || "product";
  }
  return parsed.pathname.split("/").filter(Boolean).at(-1) || "product";
}

function storeLabel(url: string) {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("pchome.com.tw")) return "PChome";
  if (host.includes("momoshop.com.tw")) return "momo";
  return host;
}

function pickPrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const price = Math.round(value);
    return price > 0 ? price : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    const price = Math.round(parsed);
    return Number.isFinite(parsed) && price > 0 ? price : null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["Price", "price", "salePrice", "originPrice", "P", "M"]) {
      const nested = pickPrice(record[key]);
      if (nested != null) return nested;
    }
  }
  return null;
}

function extractHtmlMeta(html: string, url: string) {
  const title =
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] ||
    html.match(/<meta\s+name="twitter:title"\s+content="([^"]+)"/i)?.[1] ||
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ||
    `${storeLabel(url)} 商品 ${productCode(url)}`;
  const price =
    pickPrice(html.match(/<meta\s+property="product:price:amount"\s+content="([^"]+)"/i)?.[1]) ??
    pickPrice(html.match(/"price"\s*:\s*"?(\\?\d[\d,]*)"?/i)?.[1]) ??
    pickPrice(html.match(/"salePrice"\s*:\s*"?(\\?\d[\d,]*)"?/i)?.[1]);
  return {
    title: normalizeSpace(title.replace(/<[^>]+>/g, "")),
    price,
  };
}

async function fetchPchomeMeta(url: string) {
  const code = productCode(url);
  const fields = "Id,Name,Nick,Price,Url";
  const endpoints = [
    `https://ecapi-cdn.pchome.com.tw/ecshop/prodapi/v2/prod/button&id=${encodeURIComponent(code)}&fields=${fields}`,
    `https://ecapi.pchome.com.tw/ecshop/prodapi/v2/prod/button&id=${encodeURIComponent(code)}&fields=${fields}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/json,text/plain,*/*",
          Referer: "https://24h.pchome.com.tw/",
          "User-Agent": USER_AGENT,
        },
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const record = Array.isArray(payload)
        ? payload[0]
        : payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)[code] || Object.values(payload as Record<string, unknown>)[0]
        : null;
      if (!record || typeof record !== "object") continue;
      const item = record as Record<string, unknown>;
      return {
        title: normalizeSpace(String(item.Name || item.Nick || `PChome 商品 ${code}`)),
        price: pickPrice(item.Price),
      };
    } catch {
      // Try the next endpoint.
    }
  }
  return null;
}

async function fetchSourceMeta(url: string) {
  if (new URL(url).hostname.toLowerCase().includes("pchome.com.tw")) {
    const pchome = await fetchPchomeMeta(url);
    if (pchome) return pchome;
  }

  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`商品頁讀取失敗 HTTP ${response.status}`);
  return extractHtmlMeta(await response.text(), url);
}

function todayPoint(price: number | null): PricePoint[] {
  return [{
    date: new Date().toISOString().slice(0, 10),
    price,
    currency: "TWD",
  }];
}

export const handler: Handlers = {
  async GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const url = searchParams.get("url")?.trim();
      if (!url) return json({ error: "缺少 url 參數" }, 400);

      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) return json({ error: "只支援 http/https 商品網址" }, 400);

      const meta = await fetchSourceMeta(parsed.toString());
      return json({
        url: parsed.toString(),
        title: meta.title,
        source: storeLabel(parsed.toString()),
        currency: "TWD",
        currentPrice: meta.price,
        history: todayPoint(meta.price),
        resolvedAt: new Date().toISOString(),
        notice: meta.price == null ? "即時讀取商品資訊成功，但來源頁未公開可解析價格。" : "",
      });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "價格資料讀取失敗" }, 500);
    }
  },
};

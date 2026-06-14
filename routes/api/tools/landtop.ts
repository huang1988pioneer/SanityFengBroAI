import type { Handlers } from "$fresh/server.ts";

type CompareProduct = {
  id: string;
  brand: string;
  name: string;
  suggestedPrice?: number | null;
  landtopPrice?: number | null;
  landtopPriceLabel?: string | null;
  sourceUrl?: string | null;
  jyesPrice?: number | null;
  jyesPriceLabel?: string | null;
  jyesUrl?: string | null;
  bestPrice?: number | null;
  bestSourceLabel?: string | null;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146 Safari/537.36";
const JYES_READER_URL = "https://r.jina.ai/http://https://www.jyes.com.tw/product.php";
const LANDTOP_SOURCES = [
  { brand: "samsung", url: "https://www.landtop.com.tw/brands?brand=samsung" },
  { brand: "apple", url: "https://www.landtop.com.tw/brands?brand=apple" },
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value: string) {
  return normalizeSpace(decodeHtml(value.replace(/<[^>]+>/g, " ")));
}

function parsePrice(value = "") {
  const raw = value.replace(/[^\d]/g, "");
  return raw ? Number(raw) : null;
}

function createId(brand: string, name: string) {
  return `${brand}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function normalizeQuery(value: string) {
  return normalizeSpace(value.replace(/\b(\d{3,4})G\b/gi, "$1GB").replace(/\//g, " "))
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function matchesQuery(product: CompareProduct, query: string) {
  const tokens = normalizeQuery(query);
  if (!tokens.length) return true;
  const haystack = normalizeQuery(`${product.brand} ${product.name}`).join(" ");
  return tokens.every((token) => haystack.includes(token));
}

function isProductTitle(name: string, brand: string) {
  if (!name || name.length > 140) return false;
  return brand === "samsung" ? /^Samsung\s+/i.test(name) : /^(iPhone|iPad|AirPods|Apple Watch|Apple\s+)/i.test(name);
}

async function fetchText(url: string, referer: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,text/plain,*/*",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      Referer: referer,
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
  return await response.text();
}

function parseLandtopProducts(html: string, brand: string) {
  const products = new Map<string, CompareProduct>();
  const cardPattern =
    /<a[^>]+href="(\/products\/[^"]+)"[\s\S]{0,1800}?(?:<h3[^>]*>|<div class="product-name[^"]*">|<img[^>]+alt=")([\s\S]*?)(?:<\/h3>|<\/div>|")/gi;
  let match: RegExpExecArray | null;

  while ((match = cardPattern.exec(html)) !== null) {
    const sourceUrl = new URL(match[1], "https://www.landtop.com.tw").toString();
    const name = stripTags(match[2]);
    if (!isProductTitle(name, brand)) continue;
    const chunk = html.slice(match.index, match.index + 2600);
    const suggestedPrice = parsePrice(chunk.match(/建議售價[\s\S]{0,140}?(\$?\s*[\d,]+)/i)?.[1]);
    const landtopPrice = parsePrice(chunk.match(/(?:地標價|最低價|破盤價)[\s\S]{0,140}?(\$?\s*[\d,]+)/i)?.[1]);
    products.set(createId(brand, name), {
      id: createId(brand, name),
      brand,
      name,
      suggestedPrice,
      landtopPrice,
      landtopPriceLabel: landtopPrice == null ? "門市破盤價" : `NT$ ${landtopPrice.toLocaleString("zh-TW")}`,
      sourceUrl,
    });
  }
  return Array.from(products.values());
}

function parseJyesProducts(markdown: string) {
  const products = new Map<string, CompareProduct>();
  const rowPattern = /^([^\t\n]+?)(?:\n[^\t\n]+)*\n?\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t[^\t\n]+$/gm;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(markdown)) !== null) {
    const rawName = normalizeSpace(match[1]);
    const name = rawName
      .replace(/^三星/, "Samsung")
      .replace(/^蘋果/, "Apple")
      .replace(/\b(\d{3,4})G\b/gi, "$1GB")
      .replace(/[()]/g, " ")
      .replace(/\//g, " ");
    const brand = /iphone|apple/i.test(name) ? "apple" : /samsung/i.test(name) ? "samsung" : "";
    if (!brand) continue;
    const jyesPrice = parsePrice(match[4]);
    const id = `jyes-${createId(brand, name)}`;
    products.set(id, {
      id,
      brand,
      name,
      suggestedPrice: parsePrice(match[2]),
      jyesPrice,
      jyesPriceLabel: jyesPrice == null ? "門市詢價" : `NT$ ${jyesPrice.toLocaleString("zh-TW")}`,
      jyesUrl: "https://www.jyes.com.tw/product.php",
    });
  }
  return Array.from(products.values());
}

function normalizeName(value: string) {
  return normalizeSpace(value.replace(/[()]/g, " ").replace(/\b(\d{3,4})G\b/gi, "$1GB").replace(/\//g, " "))
    .toLowerCase();
}

function mergeProducts(landtop: CompareProduct[], jyes: CompareProduct[]) {
  const jyesByName = new Map(jyes.map((product) => [normalizeName(product.name), product]));
  const merged = landtop.map((product) => {
    const jyesMatch = jyesByName.get(normalizeName(product.name));
    const landtopPrice = typeof product.landtopPrice === "number" ? product.landtopPrice : null;
    const jyesPrice = typeof jyesMatch?.jyesPrice === "number" ? jyesMatch.jyesPrice : null;
    const bestPrice = [landtopPrice, jyesPrice].filter((value): value is number => typeof value === "number").sort((a, b) => a - b)[0] ?? null;
    return {
      ...product,
      jyesPrice,
      jyesPriceLabel: jyesMatch?.jyesPriceLabel || "門市詢價",
      jyesUrl: jyesMatch?.jyesUrl || null,
      bestPrice,
      bestSourceLabel: bestPrice == null ? null : bestPrice === landtopPrice ? "地標網通" : "傑昇通信",
    };
  });

  const known = new Set(merged.map((product) => normalizeName(product.name)));
  return [
    ...merged,
    ...jyes.filter((product) => !known.has(normalizeName(product.name))).map((product) => ({
      ...product,
      landtopPrice: null,
      landtopPriceLabel: "地標未列",
      sourceUrl: product.jyesUrl,
      bestPrice: product.jyesPrice ?? null,
      bestSourceLabel: product.jyesPrice ? "傑昇通信" : null,
    })),
  ];
}

export const handler: Handlers = {
  async GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get("query") || "";
      const warnings: string[] = [];
      const landtopGroups = await Promise.allSettled(
        LANDTOP_SOURCES.map(async (source) => parseLandtopProducts(await fetchText(source.url, "https://www.landtop.com.tw/"), source.brand)),
      );
      const landtop = landtopGroups.flatMap((item, index) => {
        if (item.status === "fulfilled") return item.value;
        warnings.push(`${LANDTOP_SOURCES[index].brand} 地標網通讀取失敗：${item.reason instanceof Error ? item.reason.message : String(item.reason)}`);
        return [];
      });

      let jyes: CompareProduct[] = [];
      try {
        jyes = parseJyesProducts(await fetchText(JYES_READER_URL, "https://www.jyes.com.tw/"));
      } catch (error) {
        warnings.push(`傑昇通信讀取失敗：${error instanceof Error ? error.message : String(error)}`);
      }

      const products = mergeProducts(landtop, jyes)
        .filter((product) => matchesQuery(product, query))
        .sort((a, b) => (a.bestPrice ?? a.landtopPrice ?? a.suggestedPrice ?? Number.MAX_SAFE_INTEGER) -
          (b.bestPrice ?? b.landtopPrice ?? b.suggestedPrice ?? Number.MAX_SAFE_INTEGER));

      return json({
        source: "手機比價",
        sourceUrls: [...LANDTOP_SOURCES.map((source) => source.url), "https://www.jyes.com.tw/product.php"],
        query,
        total: products.length,
        fetchedAt: new Date().toISOString(),
        products,
        warnings,
        historyAvailable: false,
      });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "手機比價資料抓取失敗" }, 500);
    }
  },
};

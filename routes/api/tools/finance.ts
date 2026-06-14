import type { Handlers } from "$fresh/server.ts";

type FinanceInstrument = {
  id: string;
  name: string;
  symbol: string;
  sourceUrl: string;
  group: "tw" | "asia" | "korea" | "fx" | "commodities" | "rates" | "us" | "crypto" | "valuation";
  provider?: "cnbc" | "yahoo" | "multpl";
  alertThreshold?: number;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146 Safari/537.36";
const CNBC_ENDPOINT = "https://quote.cnbc.com/quote-html-webservice/quote.htm";
const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const SHILLER_PE_URL = "https://www.multpl.com/shiller-pe";
const SHILLER_PE_RECORD_HIGH = 44.19;
const SHILLER_PE_RECORD_DATE = "Dec 1999";

const INSTRUMENTS: FinanceInstrument[] = [
  { id: "taiex", name: "加權指數", symbol: "^TWII", sourceUrl: "https://tw.stock.yahoo.com/s/tse.php", group: "tw", provider: "yahoo", alertThreshold: 126820 },
  { id: "tsmc", name: "台積電", symbol: "2330.TW", sourceUrl: "https://tw.stock.yahoo.com/quote/2330.TW", group: "tw", provider: "yahoo", alertThreshold: 3333 },
  { id: "nikkei-225", name: "Nikkei 225 Index", symbol: ".N225", sourceUrl: "https://www.cnbc.com/quotes/.N225", group: "asia", alertThreshold: 110000 },
  { id: "kospi", name: "KOSPI Index", symbol: ".KS11", sourceUrl: "https://www.cnbc.com/quotes/.KS11?qsearchterm=kospi", group: "asia", alertThreshold: 12682 },
  { id: "samsung-electronics", name: "三星電子", symbol: "005930.KS", sourceUrl: "https://finance.yahoo.com/quote/005930.KS", group: "korea", provider: "yahoo", alertThreshold: 1110000 },
  { id: "sk-hynix", name: "SK 海力士", symbol: "000660.KS", sourceUrl: "https://finance.yahoo.com/quote/000660.KS", group: "korea", provider: "yahoo", alertThreshold: 11110000 },
  { id: "usd-twd", name: "美元對台幣匯率", symbol: "USDTWD=X", sourceUrl: "https://finance.yahoo.com/quote/USDTWD=X", group: "fx", provider: "yahoo", alertThreshold: 37 },
  { id: "usd-jpy", name: "美元對日元匯率", symbol: "USDJPY=X", sourceUrl: "https://finance.yahoo.com/quote/USDJPY=X", group: "fx", provider: "yahoo", alertThreshold: 222 },
  { id: "brent", name: "ICE Brent Crude", symbol: "@LCO.1", sourceUrl: "https://www.cnbc.com/quotes/@LCO.1", group: "commodities", alertThreshold: 222 },
  { id: "gold", name: "Gold COMEX", symbol: "@GC.1", sourceUrl: "https://www.cnbc.com/quotes/@GC.1", group: "commodities", alertThreshold: 6666 },
  { id: "dow", name: "Dow Jones Industrial Average", symbol: ".DJI", sourceUrl: "https://www.cnbc.com/quotes/.DJI", group: "us", alertThreshold: 66666 },
  { id: "sp500", name: "S&P 500 Index", symbol: ".SPX", sourceUrl: "https://www.cnbc.com/quotes/.SPX", group: "us", alertThreshold: 11111 },
  { id: "nasdaq", name: "NASDAQ Composite", symbol: ".IXIC", sourceUrl: "https://www.cnbc.com/quotes/.IXIC", group: "us", alertThreshold: 33333 },
  { id: "vix", name: "CBOE Volatility Index", symbol: ".VIX", sourceUrl: "https://www.cnbc.com/quotes/.VIX", group: "us" },
  { id: "shiller-pe", name: "Shiller PE Ratio", symbol: "CAPE", sourceUrl: SHILLER_PE_URL, group: "valuation", provider: "multpl", alertThreshold: 45 },
  { id: "bitcoin", name: "Bitcoin/USD Coin Metrics", symbol: "BTC.CM=", sourceUrl: "https://www.cnbc.com/quotes/BTC.CM=", group: "crypto", alertThreshold: 111111 },
  { id: "ether", name: "Ether/USD Coin Metrics", symbol: "ETH.CM=", sourceUrl: "https://www.cnbc.com/quotes/ETH.CM=", group: "crypto", alertThreshold: 2222 },
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(record[key]);
    if (value != null) return value;
  }
  return null;
}

function pickText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asText(record[key]);
    if (value) return value;
  }
  return "";
}

function numberList(value: unknown) {
  return Array.isArray(value) ? value.map(asNumber).filter((item): item is number => item != null) : [];
}

function recordTag(price: number | null, high52: number | null, low52: number | null) {
  if (price != null && high52 != null && price >= high52) return "new-high";
  if (price != null && low52 != null && price <= low52) return "new-low";
  return null;
}

async function fetchYahoo(instrument: FinanceInstrument) {
  const params = new URLSearchParams({ range: "1y", interval: "1d", lang: "zh-TW", region: "TW" });
  const response = await fetch(`${YAHOO_CHART_ENDPOINT}/${encodeURIComponent(instrument.symbol)}?${params}`, {
    headers: { Accept: "application/json,text/plain,*/*", "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`Yahoo Finance ${response.status}`);
  const chart = (await response.json())?.chart?.result?.[0];
  if (!chart) throw new Error("No Yahoo Finance chart data");
  const meta = (chart.meta || {}) as Record<string, unknown>;
  const quote = (chart.indicators?.quote?.[0] || {}) as Record<string, unknown>;
  const closes = numberList(quote.close);
  const highs = numberList(quote.high);
  const lows = numberList(quote.low);
  const price = pickNumber(meta, ["regularMarketPrice"]) ?? closes.at(-1) ?? null;
  const previousClose = closes.length > 1 ? closes[closes.length - 2] : null;
  const change = price != null && previousClose != null ? price - previousClose : null;
  const marketTime = pickNumber(meta, ["regularMarketTime"]);
  return {
    ...instrument,
    displayName: pickText(meta, ["shortName", "longName"]) || instrument.name,
    price,
    change,
    changePercent: change != null && previousClose ? (change / previousClose) * 100 : null,
    currency: pickText(meta, ["currency"]) || "",
    high52: highs.length ? Math.max(...highs) : null,
    low52: lows.length ? Math.min(...lows) : null,
    lastUpdated: marketTime ? new Date(marketTime * 1000).toISOString() : "",
    recordTag: recordTag(price, highs.length ? Math.max(...highs) : null, lows.length ? Math.min(...lows) : null),
  };
}

async function fetchCnbc(instrument: FinanceInstrument) {
  const params = new URLSearchParams({ symbols: instrument.symbol, requestMethod: "quick", noform: "1", fund: "1", output: "json" });
  const response = await fetch(`${CNBC_ENDPOINT}?${params}`, {
    headers: { Accept: "application/json,text/plain,*/*", "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`CNBC ${response.status}`);
  const raw = (await response.json())?.QuickQuoteResult?.QuickQuote;
  const quote = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>;
  if (!quote || typeof quote !== "object") throw new Error("No CNBC quote data");
  const price = pickNumber(quote, ["last", "last_price", "Last", "price", "yrlast"]);
  const high52 = pickNumber(quote, ["high_52week", "high52", "yrhiprice", "year_high", "52week_high"]);
  const low52 = pickNumber(quote, ["low_52week", "low52", "yrloprice", "year_low", "52week_low"]);
  return {
    ...instrument,
    displayName: pickText(quote, ["name", "shortName", "symbolName"]) || instrument.name,
    price,
    change: pickNumber(quote, ["change", "net_change"]),
    changePercent: pickNumber(quote, ["change_pct", "change_percent", "pctchange"]),
    currency: pickText(quote, ["currencyCode", "currency"]) || "",
    high52,
    low52,
    lastUpdated: pickText(quote, ["last_time", "last_time_msec", "time"]) || "",
    recordTag: recordTag(price, high52, low52),
  };
}

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchShiller(instrument: FinanceInstrument) {
  const response = await fetch(instrument.sourceUrl, {
    headers: { Accept: "text/html,text/plain,*/*", "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`Multpl ${response.status}`);
  const text = plainText(await response.text());
  const price = asNumber(text.match(/Current\s+Shiller\s+PE\s+Ratio(?:\s+is)?\s*:?\s*([0-9]+(?:\.[0-9]+)?)/i)?.[1] ||
    text.match(/\bShiller\s+PE\s+Ratio\s+([0-9]+(?:\.[0-9]+)?)/i)?.[1]);
  if (price == null) throw new Error("No Shiller PE data");
  return {
    ...instrument,
    displayName: instrument.name,
    price,
    change: null,
    changePercent: null,
    currency: "",
    high52: SHILLER_PE_RECORD_HIGH,
    low52: null,
    lastUpdated: "",
    recordTag: price > SHILLER_PE_RECORD_HIGH ? "new-high" : null,
  };
}

function fetchInstrument(instrument: FinanceInstrument) {
  if (instrument.provider === "yahoo") return fetchYahoo(instrument);
  if (instrument.provider === "multpl") return fetchShiller(instrument);
  return fetchCnbc(instrument);
}

export const handler: Handlers = {
  async GET() {
    const settled = await Promise.allSettled(INSTRUMENTS.map(fetchInstrument));
    const quotes = settled.map((item, index) => {
      const instrument = INSTRUMENTS[index];
      const quote = item.status === "fulfilled"
        ? item.value
        : {
          ...instrument,
          displayName: instrument.name,
          price: null,
          change: null,
          changePercent: null,
          currency: "",
          high52: null,
          low52: null,
          lastUpdated: "",
          recordTag: null,
          error: item.reason instanceof Error ? item.reason.message : "Failed to load quote",
        };
      const isThresholdAlert = typeof quote.price === "number" && typeof quote.alertThreshold === "number" && quote.price > quote.alertThreshold;
      return {
        ...quote,
        isThresholdAlert,
        alertMessage: isThresholdAlert ? `${quote.name} 目前 ${quote.price}${quote.currency ? ` ${quote.currency}` : ""}，已突破 ${quote.alertThreshold}` : "",
      };
    });
    const shiller = quotes.find((quote) => quote.id === "shiller-pe");
    return json({
      fetchedAt: new Date().toISOString(),
      source: "CNBC / Yahoo Finance / Multpl",
      quotes,
      financeAlerts: quotes.filter((quote) => quote.isThresholdAlert).map((quote) => ({
        id: quote.id,
        message: quote.alertMessage,
        sourceUrl: quote.sourceUrl,
      })),
      shillerPe: {
        current: shiller?.price ?? null,
        recordHigh: SHILLER_PE_RECORD_HIGH,
        recordHighDate: SHILLER_PE_RECORD_DATE,
        isRecordHigh: shiller?.isThresholdAlert === true,
      },
    });
  },
};

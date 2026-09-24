/**
 * 值班台（首頁）與資料表倒數欄共用的純函式：哪個模組看哪個日期欄、剩幾天、算不算要處理。
 * 日期一律換成台北日曆日再相減，不用毫秒 ceil/floor，跨時區或半夜打開都不會差一天。
 */

export type AttentionRow = Record<string, unknown>;

/** overdue：已過；urgent：馬上要處理；soon：這個窗口內；calm：還遠；since：只算經過天數。 */
export type DueTone = "overdue" | "urgent" | "soon" | "calm" | "since";

export type DueRule = {
  field: string;
  /** 表格欄名，也是首頁訊號上的動詞 */
  column: string;
  verb: string;
  /** 過期時的說法：訂閱叫逾期、食品叫過期 */
  lapse: string;
  urgentDays: number;
  soonDays: number;
  /** 這筆資料根本不需要提醒（例如食品已經吃完、訂閱不續） */
  skip?: (row: AttentionRow) => boolean;
};

export const TIME_ZONE = "Asia/Taipei";

export const dueRules: Record<string, DueRule> = {
  subscription: {
    field: "nextdate",
    column: "扣款倒數",
    verb: "扣款",
    lapse: "逾期",
    urgentDays: 3,
    soonDays: 7,
  },
  food: {
    field: "todate",
    column: "到期倒數",
    verb: "到期",
    lapse: "過期",
    urgentDays: 7,
    soonDays: 30,
    skip: (row) => row.amount !== undefined && row.amount !== "" && Number(row.amount) <= 0,
  },
  trialpurchase: {
    field: "eventDate",
    column: "活動倒數",
    verb: "活動",
    lapse: "已過",
    urgentDays: 3,
    soonDays: 7,
    skip: (row) => row.trialStatus === "tried" && row.purchaseStatus === "purchased",
  },
  shoppinglist: {
    field: "plannedDate",
    column: "購買倒數",
    verb: "購買",
    lapse: "延後",
    urgentDays: 3,
    soonDays: 7,
  },
  quota: {
    field: "quotaExpiry",
    column: "額度倒數",
    verb: "額度到期",
    lapse: "已到期",
    urgentDays: 3,
    soonDays: 7,
  },
};

/** 例行事項沒有「到期」，只看距離上次做過了幾天。 */
export const sinceRules: Record<string, { field: string; column: string }> = {
  routine: { field: "lastdate1", column: "距上次" },
};

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 任何日期字串 → 台北日曆日 YYYY-MM-DD；純日期字串原樣保留，不經過時區換算。 */
export function taipeiDayKey(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : dayKeyFormat.format(value);
  }
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : dayKeyFormat.format(date);
}

function dayNumber(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** 目標日減今天（台北日曆日）；今天 = 0、明天 = 1、昨天 = -1。 */
export function daysUntil(value: unknown, now: Date = new Date()): number | null {
  const target = taipeiDayKey(value);
  const today = taipeiDayKey(now);
  if (!target || !today) return null;
  return dayNumber(target) - dayNumber(today);
}

export type DueStatus = {
  days: number;
  tone: DueTone;
  label: string;
  date: string;
};

export function countdownLabel(days: number, lapse = "逾期"): string {
  if (days < 0) return `${lapse} ${Math.abs(days)} 天`;
  if (days === 0) return "今天";
  if (days === 1) return "明天";
  return `剩 ${days} 天`;
}

export function dueStatus(moduleId: string, row: AttentionRow, now: Date = new Date()): DueStatus | null {
  const since = sinceRules[moduleId];
  if (since) {
    const days = daysUntil(row[since.field], now);
    if (days === null) return null;
    const elapsed = -days;
    return {
      days,
      tone: "since",
      label: elapsed <= 0 ? "今天" : `${elapsed} 天前`,
      date: taipeiDayKey(row[since.field]) ?? "",
    };
  }
  const rule = dueRules[moduleId];
  if (!rule) return null;
  const days = daysUntil(row[rule.field], now);
  if (days === null) return null;
  const tone: DueTone = days < 0
    ? "overdue"
    : days <= rule.urgentDays
    ? "urgent"
    : days <= rule.soonDays
    ? "soon"
    : "calm";
  return { days, tone, label: countdownLabel(days, rule.lapse), date: taipeiDayKey(row[rule.field]) ?? "" };
}

export function dueColumn(moduleId: string): string | null {
  return dueRules[moduleId]?.column ?? sinceRules[moduleId]?.column ?? null;
}

/** 有日期欄的模組依倒數排序（最急的在上）；沒日期的排最後，其餘維持原順序。 */
export function sortByDue<T extends AttentionRow>(moduleId: string, rows: T[], now: Date = new Date()): T[] {
  if (!dueRules[moduleId] && !sinceRules[moduleId]) return rows;
  // 例行的 days 是負數（上次在過去），升冪排序自然是越久沒做越上面。
  return rows
    .map((row, index) => ({ row, index, days: dueStatus(moduleId, row, now)?.days ?? null }))
    .sort((a, b) => {
      if (a.days === null && b.days === null) return a.index - b.index;
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days || a.index - b.index;
    })
    .map((entry) => entry.row);
}

export type AttentionItem = {
  moduleId: string;
  id: string;
  name: string;
  verb: string;
  days: number;
  tone: Exclude<DueTone, "calm" | "since">;
  label: string;
  date: string;
};

function rowName(row: AttentionRow): string {
  return String(row.name ?? row.title ?? "").trim() || "未命名";
}

/** 首頁「待處理訊號」：各模組落在提醒窗口內的資料，最急的在前。 */
export function collectAttention(
  rowsByModule: Record<string, AttentionRow[]>,
  now: Date = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const [moduleId, rows] of Object.entries(rowsByModule)) {
    const rule = dueRules[moduleId];
    if (!rule) continue;
    for (const row of rows) {
      if (rule.skip?.(row)) continue;
      const status = dueStatus(moduleId, row, now);
      if (!status || status.tone === "calm" || status.tone === "since") continue;
      items.push({
        moduleId,
        id: String(row.id ?? row._id ?? ""),
        name: rowName(row),
        verb: rule.verb,
        days: status.days,
        tone: status.tone,
        label: status.label,
        date: status.date,
      });
    }
  }
  return items.sort((a, b) => a.days - b.days || a.name.localeCompare(b.name, "zh-Hant"));
}

export function countTones(items: AttentionItem[]): Record<AttentionItem["tone"], number> {
  const counts = { overdue: 0, urgent: 0, soon: 0 };
  items.forEach((item) => counts[item.tone]++);
  return counts;
}

/** 金額依幣別分開加總；不同幣別不硬換匯，免得首頁出現一個看似精確其實是瞎猜的數字。 */
export function currencyTotals(
  rows: AttentionRow[],
  amountKey: string,
  currencyKey = "currency",
  fallbackCurrency = "TWD",
): Array<{ currency: string; total: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const amount = Number(row[amountKey] ?? 0);
    if (!Number.isFinite(amount) || amount === 0) continue;
    const currency = String(row[currencyKey] ?? "").trim().toUpperCase() || fallbackCurrency;
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }
  return [...totals.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => (a.currency === fallbackCurrency ? -1 : b.currency === fallbackCurrency ? 1 : a.currency.localeCompare(b.currency)));
}

export function formatCurrencyTotals(totals: Array<{ currency: string; total: number }>): string {
  if (totals.length === 0) return "0";
  return totals
    .map(({ currency, total }) => `${currency} ${total.toLocaleString("zh-TW", { maximumFractionDigits: 2 })}`)
    .join(" · ");
}

export type ModuleMetric = { label: string; value: string; tone?: "alert" | "warn" };

/** 資料表上方的兩格指標：每個模組看自己在意的數字，不再每頁都顯示「金額合計／續訂中」。 */
export function moduleMetrics(moduleId: string, rows: AttentionRow[], now: Date = new Date()): ModuleMetric[] {
  const countTone = (tone: DueTone | DueTone[]) => {
    const tones = Array.isArray(tone) ? tone : [tone];
    const rule = dueRules[moduleId];
    return rows.filter((row) => {
      if (rule?.skip?.(row)) return false;
      const status = dueStatus(moduleId, row, now);
      return status ? tones.includes(status.tone) : false;
    }).length;
  };
  const sum = (key: string) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  const withAlert = (label: string, count: number, tone: "alert" | "warn"): ModuleMetric => ({
    label,
    value: String(count),
    tone: count > 0 ? tone : undefined,
  });
  const distinct = (key: string) => new Set(rows.map((row) => String(row[key] ?? "").trim()).filter(Boolean)).size;

  switch (moduleId) {
    case "subscription":
      return [
        withAlert("7 天內扣款", countTone(["overdue", "urgent", "soon"]), "warn"),
        { label: "每期合計", value: formatCurrencyTotals(currencyTotals(rows, "price")) },
      ];
    case "food":
      return [
        withAlert("已過期", countTone("overdue"), "alert"),
        withAlert("30 天內到期", countTone(["urgent", "soon"]), "warn"),
      ];
    case "trialpurchase":
    case "shoppinglist":
    case "quota": {
      const soon = withAlert("7 天內", countTone(["overdue", "urgent", "soon"]), "warn");
      if (moduleId === "shoppinglist") {
        return [soon, { label: "預算合計", value: formatCurrencyTotals(currencyTotals(rows, "price")) }];
      }
      if (moduleId === "quota") {
        return [soon, { label: "AI 服務", value: String(rows.filter((row) => row.serviceType === "ai").length) }];
      }
      return [soon, { label: "已首購", value: String(rows.filter((row) => row.purchaseStatus === "purchased").length) }];
    }
    case "bank":
      return [
        { label: "餘額合計", value: `TWD ${sum("deposit").toLocaleString("zh-TW")}` },
        { label: "有活動連結", value: String(rows.filter((row) => String(row.activity ?? "").trim()).length) },
      ];
    case "routine": {
      const stale = rows.filter((row) => {
        const status = dueStatus("routine", row, now);
        return status ? -status.days >= 90 : false;
      }).length;
      return [
        withAlert("超過 90 天", stale, "warn"),
        { label: "有照片", value: String(rows.filter((row) => String(row.photo ?? "").trim()).length) },
      ];
    }
    case "reinstall":
      return [
        { label: "付費軟體", value: String(rows.filter((row) => row.softwareType === "paid").length) },
        { label: "訂閱制", value: String(rows.filter((row) => row.subscriptionSoftware === true).length) },
      ];
    case "common":
      return [
        { label: "網站格數", value: String(rows.reduce((total, row) => total + ["site01", "site02", "site03", "site04"].filter((key) => String(row[key] ?? "").trim()).length, 0)) },
        { label: "有備註", value: String(rows.filter((row) => ["note01", "note02", "note03", "note04"].some((key) => String(row[key] ?? "").trim())).length) },
      ];
    case "cloud":
      return [
        { label: "容量合計", value: sum("space").toLocaleString("zh-TW") },
        { label: "帳號數", value: String(distinct("account")) },
      ];
    case "experience":
    case "member":
      return [
        { label: "單位數", value: String(distinct("gov")) },
        { label: "有網站", value: String(rows.filter((row) => String(row.site ?? "").trim()).length) },
      ];
    default:
      return [
        { label: "帳號數", value: String(distinct("account")) },
        { label: "有網址", value: String(rows.filter((row) => String(row.site ?? row.url ?? "").trim()).length) },
      ];
  }
}

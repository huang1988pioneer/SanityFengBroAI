import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  collectAttention,
  countdownLabel,
  countTones,
  currencyTotals,
  daysUntil,
  dueStatus,
  formatCurrencyTotals,
  moduleMetrics,
  sortByDue,
  taipeiDayKey,
} from "./attention.ts";

// 2026-06-05 23:30 台北 = 2026-06-05T15:30Z
const now = new Date("2026-06-05T15:30:00Z");

Deno.test("taipeiDayKey keeps plain dates and converts instants to Taipei days", () => {
  assertEquals(taipeiDayKey("2026-06-07"), "2026-06-07");
  // 16:30Z 已經是台北隔天 00:30
  assertEquals(taipeiDayKey("2026-06-05T16:30:00Z"), "2026-06-06");
  assertEquals(taipeiDayKey(""), null);
  assertEquals(taipeiDayKey("not a date"), null);
});

Deno.test("daysUntil counts calendar days in Taipei, not elapsed hours", () => {
  assertEquals(daysUntil("2026-06-05", now), 0);
  assertEquals(daysUntil("2026-06-06", now), 1);
  assertEquals(daysUntil("2026-06-04", now), -1);
  assertEquals(daysUntil("2026-06-11T00:00:00.000+00:00", now), 6);
  assertEquals(daysUntil(undefined, now), null);
});

Deno.test("countdownLabel reads naturally", () => {
  assertEquals(countdownLabel(0), "今天");
  assertEquals(countdownLabel(1), "明天");
  assertEquals(countdownLabel(5), "剩 5 天");
  assertEquals(countdownLabel(-2, "過期"), "過期 2 天");
});

Deno.test("dueStatus uses per-module windows", () => {
  assertEquals(dueStatus("subscription", { nextdate: "2026-06-08" }, now)?.tone, "urgent");
  assertEquals(dueStatus("subscription", { nextdate: "2026-06-12" }, now)?.tone, "soon");
  assertEquals(dueStatus("subscription", { nextdate: "2026-06-30" }, now)?.tone, "calm");
  assertEquals(dueStatus("subscription", { nextdate: "2026-06-01" }, now)?.label, "逾期 4 天");
  // 食品的窗口比較寬：7 天內緊急、30 天內提醒
  assertEquals(dueStatus("food", { todate: "2026-06-11T00:00:00.000+00:00" }, now)?.tone, "urgent");
  assertEquals(dueStatus("food", { todate: "2026-07-01" }, now)?.tone, "soon");
  assertEquals(dueStatus("notes", { newDate: "2026-06-01" }, now), null);
  assertEquals(dueStatus("subscription", { nextdate: "" }, now), null);
});

Deno.test("dueStatus for routine counts days since last time", () => {
  const status = dueStatus("routine", { lastdate1: "2026-05-18T00:00:00.000+00:00" }, now);
  assertEquals(status?.tone, "since");
  assertEquals(status?.label, "18 天前");
});

Deno.test("sortByDue puts the most urgent first and blanks last", () => {
  const rows = [
    { id: "a", nextdate: "2026-07-04" },
    { id: "b", nextdate: "" },
    { id: "c", nextdate: "2026-06-01" },
    { id: "d", nextdate: "2026-06-07" },
  ];
  assertEquals(sortByDue("subscription", rows, now).map((row) => row.id), ["c", "d", "a", "b"]);
  // 例行：越久沒做越上面
  const routine = [
    { id: "x", lastdate1: "2026-06-01" },
    { id: "y", lastdate1: "2026-01-02" },
  ];
  assertEquals(sortByDue("routine", routine, now).map((row) => row.id), ["y", "x"]);
  // 沒有日期規則的模組原樣回傳
  assertEquals(sortByDue("notes", rows, now), rows);
});

Deno.test("collectAttention merges modules, skips calm and finished rows", () => {
  const items = collectAttention({
    subscription: [
      { id: "s1", name: "ChatGPT/PLUS", nextdate: "2026-06-07" },
      { id: "s2", name: "Google AI Pro", nextdate: "2026-08-08" },
    ],
    food: [
      { id: "f1", name: "購物金", amount: 1, todate: "2026-06-03T00:00:00.000+00:00" },
      { id: "f2", name: "吃完了", amount: 0, todate: "2026-06-03T00:00:00.000+00:00" },
    ],
    notes: [{ id: "n1", title: "不看日期" }],
  }, now);
  assertEquals(items.map((item) => item.id), ["f1", "s1"]);
  assertEquals(items[0].tone, "overdue");
  assertEquals(items[0].label, "過期 2 天");
  assertEquals(countTones(items), { overdue: 1, urgent: 1, soon: 0 });
});

Deno.test("currencyTotals never mixes currencies", () => {
  const totals = currencyTotals([
    { price: 690, currency: "TWD" },
    { price: 5, currency: "usd" },
    { price: 59, currency: "" },
    { price: 0, currency: "JPY" },
  ], "price");
  assertEquals(totals, [{ currency: "TWD", total: 749 }, { currency: "USD", total: 5 }]);
  assertEquals(formatCurrencyTotals(totals), "TWD 749 · USD 5");
  assertEquals(formatCurrencyTotals([]), "0");
});

Deno.test("moduleMetrics picks module-specific numbers", () => {
  const food = moduleMetrics("food", [
    { amount: 1, todate: "2026-06-01" },
    { amount: 2, todate: "2026-06-20" },
    { amount: 0, todate: "2026-06-01" },
  ], now);
  assertEquals(food, [
    { label: "已過期", value: "1", tone: "alert" },
    { label: "30 天內到期", value: "1", tone: "warn" },
  ]);
  const bank = moduleMetrics("bank", [{ deposit: 1000 }, { deposit: 500 }], now);
  assertEquals(bank[0], { label: "餘額合計", value: "TWD 1,500" });
});

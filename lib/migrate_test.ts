import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  castMigrateValue,
  chunkRows,
  mapHeader,
  parseCsv,
  planMigration,
} from "./migrate.ts";

Deno.test("parseCsv keeps quoted commas and newlines inside one cell", () => {
  const table = parseCsv('name,note\n"蝦皮VIP","台新銀行\n0731"\n');
  assertEquals(table, [["name", "note"], ["蝦皮VIP", "台新銀行\n0731"]]);
});

Deno.test("parseCsv unescapes doubled quotes and strips the BOM", () => {
  assertEquals(parseCsv('﻿name\n"say ""hi"""'), [["name"], ['say "hi"']]);
});

Deno.test("parseCsv drops fully blank lines and handles CRLF", () => {
  assertEquals(parseCsv("a,b\r\n1,2\r\n\r\n"), [["a", "b"], ["1", "2"]]);
});

Deno.test("mapHeader passes through a header the module already has", () => {
  assertEquals(mapHeader("bank", "deposit"), "deposit");
});

Deno.test("mapHeader drops Appwrite and Sanity system columns", () => {
  assertEquals(mapHeader("bank", "$id"), "");
  assertEquals(mapHeader("bank", "$createdAt"), "");
  assertEquals(mapHeader("bank", "_rev"), "");
});

Deno.test("mapHeader renames legacy headers onto the workbench fields", () => {
  assertEquals(mapHeader("bank", "balance"), "deposit");
  assertEquals(mapHeader("routine", "date1"), "lastdate1");
  assertEquals(mapHeader("routine", "site"), "link");
  assertEquals(mapHeader("notes", "date"), "newDate");
  assertEquals(mapHeader("food", "photourl"), "photo");
  assertEquals(mapHeader("videos", "watch"), "url");
});

Deno.test("mapHeader tolerates a different case in the export", () => {
  assertEquals(mapHeader("subscription", "NextDate"), "nextdate");
});

Deno.test("mapHeader returns empty for a header this module cannot store", () => {
  assertEquals(mapHeader("bank", "favourite_colour"), "");
  assertEquals(mapHeader("nope", "name"), "");
});

Deno.test("castMigrateValue coerces numbers, including thousands separators", () => {
  assertEquals(castMigrateValue("price", "690"), 690);
  assertEquals(castMigrateValue("deposit", "1,000"), 1000);
  assertEquals(castMigrateValue("amount", ""), 0);
  assertEquals(castMigrateValue("price", "n/a"), 0);
});

Deno.test("castMigrateValue reads the booleans an Appwrite export writes", () => {
  assertEquals(castMigrateValue("continue", "TRUE"), true);
  assertEquals(castMigrateValue("continue", "是"), true);
  assertEquals(castMigrateValue("continue", "false"), false);
  assertEquals(castMigrateValue("continue", ""), false);
});

Deno.test("castMigrateValue leaves text untouched, whitespace included", () => {
  assertEquals(castMigrateValue("note", " 兩行\n備註 "), " 兩行\n備註 ");
});

Deno.test("planMigration maps a real Appwrite bank export", () => {
  const csv = [
    "$id,name,deposit,site,address,withdrawals,transfer,activity,card,account",
    "abc123,兆豐銀行,1000,,,0,0,,,末五碼 52678",
    "def456,台新銀行,500,https://www.taishinbank.com.tw,,5,5,,Richart 1902,末五碼 57295",
  ].join("\n");
  const plan = planMigration(csv, "bank");

  assertEquals(plan.errors, []);
  assertEquals(plan.rows.length, 2);
  assertEquals(plan.rows[0], {
    name: "兆豐銀行",
    deposit: 1000,
    site: "",
    address: "",
    withdrawals: 0,
    transfer: 0,
    activity: "",
    card: "",
    account: "末五碼 52678",
  });
  assertEquals(plan.ignoredHeaders, []);
  assertEquals(plan.missingFields, []);
});

Deno.test("planMigration reports headers it had to throw away", () => {
  const plan = planMigration("name,price,mystery\nPlus,690,x", "subscription");
  assertEquals(plan.ignoredHeaders, ["mystery"]);
  assertEquals(plan.mappedHeaders, [
    { header: "name", field: "name" },
    { header: "price", field: "price" },
  ]);
  assertEquals(plan.rows, [{ name: "Plus", price: 690 }]);
});

Deno.test("planMigration lists fields the CSV never supplied", () => {
  const plan = planMigration("name\n鋒兄關於", "about");
  assertEquals(plan.missingFields, ["value"]);
});

Deno.test("planMigration skips a row that only carries data in ignored columns", () => {
  // parseCsv already drops all-blank lines; this covers the row that still
  // looks non-blank to the parser but has nothing left after the mapping.
  const plan = planMigration("name,price,mystery\nPlus,690,x\n,,leftover", "subscription");
  assertEquals(plan.rows, [{ name: "Plus", price: 690 }]);
  assertEquals(plan.skippedRows, 1);
});

Deno.test("planMigration refuses a CSV whose headers belong to another module", () => {
  const plan = planMigration("withdrawals_only\n1", "notes");
  assertEquals(plan.rows, []);
  assertEquals(plan.errors, ["表頭對不上任何「鋒兄筆記」欄位，請確認選對模組"]);
});

Deno.test("planMigration rejects an empty or header-only CSV", () => {
  assertEquals(planMigration("", "bank").errors, ["CSV 是空的"]);
  assertEquals(planMigration("name,deposit", "bank").errors, ["CSV 只有表頭，沒有資料列"]);
});

Deno.test("planMigration rejects an unknown module", () => {
  assertEquals(planMigration("name\nx", "nope").errors, ["未知的鋒兄模組：nope"]);
});

Deno.test("chunkRows splits into batches and keeps every row", () => {
  const rows = Array.from({ length: 5 }, (_, index) => ({ name: `r${index}` }));
  assertEquals(chunkRows(rows, 2).map((chunk) => chunk.length), [2, 2, 1]);
  assertEquals(chunkRows(rows, 2).flat().length, 5);
  assertEquals(chunkRows([], 2), []);
});

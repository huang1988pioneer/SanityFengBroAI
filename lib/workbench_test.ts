import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  applyDensity,
  applyPaper,
  applyTheme,
  emptyStateKind,
  hostLabel,
  paperBootScript,
  resolveGroupLeaf,
  type PaperTarget,
} from "./workbench.ts";

const manage = {
  id: "manage",
  children: [
    { key: "subscription" },
    { key: "food" },
    { key: "notes" },
  ],
};

Deno.test("resolveGroupLeaf returns last used leaf for group G", () => {
  const leaf = resolveGroupLeaf(manage, { manage: "notes" });
  assertEquals(leaf.key, "notes");
});

Deno.test("resolveGroupLeaf falls back to the group's first leaf", () => {
  const leaf = resolveGroupLeaf(manage, {});
  assertEquals(leaf.key, "subscription");
});

Deno.test("resolveGroupLeaf ignores a stale last-leaf key", () => {
  const leaf = resolveGroupLeaf(manage, { manage: "ghost" });
  assertEquals(leaf.key, "subscription");
});

Deno.test("hostLabel shows chatgpt.com not the full URL", () => {
  const label = hostLabel("https://www.chatgpt.com/x");
  assertEquals(label, "chatgpt.com");
  assertNotEquals(label, "https://www.chatgpt.com/x");
});

Deno.test("emptyStateKind is no-rows vs no-search-hits for the same module", () => {
  const moduleId = "subscription";
  const emptyList = emptyStateKind({ totalRows: 0, query: "" });
  const emptySearch = emptyStateKind({ totalRows: 12, query: "zzzz-not-there" });
  assertEquals(emptyList, "no-rows");
  assertEquals(emptySearch, "no-search-hits");
  assertNotEquals(emptyList, emptySearch);
  assertEquals(moduleId, "subscription");
});

Deno.test("applyPaper sets dark + compact on the document element datasets", () => {
  const el: PaperTarget = { dataset: {} };
  applyPaper(el, "dark", "compact");
  assertEquals(el.dataset.theme, "dark");
  assertEquals(el.dataset.density, "compact");
  applyTheme(el, "light");
  applyDensity(el, "comfortable");
  assertEquals(el.dataset.theme, "light");
  assertEquals(el.dataset.density, undefined);
});

Deno.test("paperBootScript is the FOUC boot shipped in the document head", () => {
  assertEquals(paperBootScript.includes("fengbro.theme"), true);
  assertEquals(paperBootScript.includes("fengbro.density"), true);
  assertEquals(paperBootScript.includes("document.documentElement.dataset.theme"), true);
});

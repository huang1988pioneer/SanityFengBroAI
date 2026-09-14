import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildTypeFilter,
  getTypeAliases,
  getWriteType,
  normalizeRow,
  normalizeRows,
  pickModuleFields,
  projectLegacyFields,
  validateModuleRow,
} from "./sanity_docs.ts";

const config = { projectId: "abc12345", dataset: "production" };

Deno.test("new documents use the Studio-registered fengbro type first", () => {
  assertEquals(getWriteType("subscription"), "fengbro_subscription");
  assertEquals(getTypeAliases("subscription"), ["fengbro_subscription", "subscription"]);
});

Deno.test("reads also cover the type names the live Studio already uses", () => {
  assertEquals(getTypeAliases("notes"), ["fengbro_notes", "article", "notes"]);
  assertEquals(getTypeAliases("videos"), ["fengbro_videos", "videos", "video"]);
  assertEquals(getTypeAliases("food"), ["fengbro_food", "food", "inventory"]);
  assertEquals(getWriteType("nope"), "");
});

Deno.test("new Appwrite management tables have stable Sanity write types", () => {
  assertEquals(getTypeAliases("trialpurchase"), ["fengbro_trialpurchase", "trialpurchase"]);
  assertEquals(getTypeAliases("reinstall"), ["fengbro_reinstall", "reinstall"]);
  assertEquals(getTypeAliases("quota"), ["fengbro_quota", "quota"]);
  assertEquals(getTypeAliases("shoppinglist"), ["fengbro_shoppinglist", "shoppinglist"]);
});

Deno.test("all standalone legacy Studio document types remain readable", () => {
  assertEquals(getTypeAliases("mail"), ["fengbro_mail", "mail"]);
  assertEquals(getTypeAliases("experience"), ["fengbro_experience", "experience"]);
  assertEquals(getTypeAliases("member"), ["fengbro_member", "member"]);
  assertEquals(getTypeAliases("cloud"), ["fengbro_cloud", "cloud"]);
  assertEquals(getTypeAliases("host"), ["fengbro_host", "host"]);
});

Deno.test("buildTypeFilter builds a GROQ or-chain", () => {
  assertEquals(buildTypeFilter(["a", "b"]), `_type == "a" || _type == "b"`);
});

Deno.test("legacy article, common and bank fields remain visible in the workbench", () => {
  assertEquals(projectLegacyFields("notes", { date: "2026-09-14" }).newDate, "2026-09-14");
  assertEquals(projectLegacyFields("common", { url: "https://example.com", note: "帳號" }).site01, "https://example.com");
  assertEquals(projectLegacyFields("bank", { balance: 500 }).deposit, 500);
});

Deno.test("the Studio routine and video field names project onto the workbench ones", () => {
  const routine = projectLegacyFields("routine", { title: "鋒兄理髮", date1: "2026-05-18", site: "https://example.com" });
  assertEquals(routine.name, "鋒兄理髮");
  assertEquals(routine.lastdate1, "2026-05-18");
  assertEquals(routine.link, "https://example.com");

  const video = projectLegacyFields("videos", { name: "鋒兄影片", watch: "https://youtu.be/abc", type: "MV" });
  assertEquals(video.title, "鋒兄影片");
  assertEquals(video.url, "https://youtu.be/abc");
  assertEquals(video.category, "MV");
});

Deno.test("projection never overwrites a field that already has a value", () => {
  assertEquals(projectLegacyFields("bank", { deposit: 10, balance: 500 }).deposit, 10);
});

Deno.test("write payloads discard unknown and system fields", () => {
  assertEquals(
    pickModuleFields("subscription", { name: "Plus", price: 690, _type: "evil", typo: "drop" }),
    { name: "Plus", price: 690 },
  );
});

Deno.test("quota migration and CRUD never write its Appwrite access token", () => {
  assertEquals(
    pickModuleFields("quota", { name: "Codex", quotaRemaining: 3, accessToken: "secret" }),
    { name: "Codex", quotaRemaining: 3 },
  );
});

Deno.test("required names are checked for creates and blank partial updates", () => {
  assertEquals(validateModuleRow("food", {}, { requireAll: true }), ["「名稱」不可空白"]);
  assertEquals(validateModuleRow("food", { amount: 3 }), []);
  assertEquals(validateModuleRow("food", { name: " " }), ["「名稱」不可空白"]);
});

Deno.test("normalizeRow exposes _id as id and keeps the system fields", () => {
  const row = normalizeRow({ _id: "doc-1", _type: "article", title: "標題" }, "notes", config);
  assertEquals(row.id, "doc-1");
  assertEquals(row._type, "article");
  assertEquals(row.title, "標題");
});

Deno.test("a Studio image field reaches the table as a url, not [object Object]", () => {
  const row = normalizeRow(
    {
      _id: "f1",
      _type: "food",
      name: "八寶粥",
      photo: { _type: "image", asset: { _ref: "image-1111111111111111111111111111111111111111-640x480-jpg" } },
    },
    "food",
    config,
  );
  assertEquals(
    row.photo,
    "https://cdn.sanity.io/images/abc12345/production/1111111111111111111111111111111111111111-640x480.jpg",
  );
});

Deno.test("flattening runs before projection, so an empty image falls back to photourl", () => {
  const row = normalizeRow(
    { _id: "f2", _type: "inventory", name: "牛奶花生", photourl: "https://example.com/a.jpg", image: null },
    "food",
    config,
  );
  assertEquals(row.photo, "https://example.com/a.jpg");
});

Deno.test("a Studio pdf file field becomes a downloadable url", () => {
  const row = normalizeRow(
    {
      _id: "d1",
      _type: "article",
      title: "使用手冊",
      pdf: { _type: "file", asset: { _ref: "file-9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c-pdf" } },
    },
    "documents",
    config,
  );
  assertEquals(row.url, "https://cdn.sanity.io/files/abc12345/production/9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c.pdf");
});

Deno.test("legacy note attachments remain visible and quota credentials are redacted", () => {
  const note = normalizeRow(
    {
      _id: "n1",
      _type: "article",
      title: "附件",
      pdf: { _type: "file", asset: { _ref: "file-9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c-pdf" } },
    },
    "notes",
    config,
  );
  assertEquals(note.pdf, "https://cdn.sanity.io/files/abc12345/production/9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c.pdf");

  const quota = normalizeRow(
    { _id: "q1", _type: "quota", name: "Codex", accessToken: "secret" },
    "quota",
    config,
  );
  assertEquals(quota.accessToken, undefined);
});

Deno.test("normalizeRows handles an empty result", () => {
  assertEquals(normalizeRows([], "notes", config), []);
});

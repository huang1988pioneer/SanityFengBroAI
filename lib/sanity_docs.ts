/**
 * Sanity 文件型別與工作台欄位的單一對照表。
 *
 * `fengbro_*` 是此專案提供給 Studio 的正式 schema 型別；後面的名稱只用來
 * 讀取既有的舊 Sanity / Appwrite 遷移資料。把正式型別放在第一位，避免新建
 * 文件落到 Studio 沒有註冊的舊型別。
 */
import { flattenSanityValue } from "./sanityValues.ts";

export const SANITY_MODULE_IDS = [
  "subscription",
  "trialpurchase",
  "reinstall",
  "quota",
  "food",
  "shoppinglist",
  "notes",
  "common",
  "mail",
  "experience",
  "member",
  "cloud",
  "host",
  "images",
  "videos",
  "music",
  "documents",
  "podcast",
  "bank",
  "routine",
  "tools",
  "about",
] as const;

export type SanityModuleId = typeof SANITY_MODULE_IDS[number];
export type SanityRow = Record<string, unknown>;

export const moduleTypeAliases: Record<SanityModuleId, readonly string[]> = {
  subscription: ["fengbro_subscription", "subscription"],
  // These four records live in Appwrite management tables in the reference
  // project.  Keep the original table names as read aliases so a CSV /
  // one-time document migration does not strand existing data.
  trialpurchase: ["fengbro_trialpurchase", "trialpurchase"],
  reinstall: ["fengbro_reinstall", "reinstall"],
  quota: ["fengbro_quota", "quota"],
  food: ["fengbro_food", "food", "inventory"],
  shoppinglist: ["fengbro_shoppinglist", "shoppinglist"],
  // Appwrite 的筆記 collection 叫 article；保留它讓舊資料能直接被讀取。
  notes: ["fengbro_notes", "article", "notes"],
  common: ["fengbro_common", "commonaccount", "common"],
  // 以下五種是既有 Sanity Studio（sanitygoldshoot0720）實際使用的型別。
  // 新文件統一寫進 fengbro_*，但讀取時不能把既有文件藏起來。
  mail: ["fengbro_mail", "mail"],
  experience: ["fengbro_experience", "experience"],
  member: ["fengbro_member", "member"],
  cloud: ["fengbro_cloud", "cloud"],
  host: ["fengbro_host", "host"],
  images: ["fengbro_images", "images"],
  videos: ["fengbro_videos", "videos", "video"],
  music: ["fengbro_music", "music"],
  documents: ["fengbro_documents", "documents"],
  podcast: ["fengbro_podcast", "podcast"],
  bank: ["fengbro_bank", "bank"],
  routine: ["fengbro_routine", "routine"],
  tools: ["fengbro_tools", "tools"],
  about: ["fengbro_about", "about"],
};

/** 僅允許工作台實際支援的欄位寫進文件，避免 CSV 拼錯欄名時產生孤兒欄位。 */
export const moduleFields: Record<SanityModuleId, readonly string[]> = {
  subscription: ["name", "site", "price", "nextdate", "note", "account", "currency", "continue"],
  trialpurchase: [
    "name",
    "eventDate",
    "firstPurchasePrice",
    "regularPrice",
    "account",
    "note",
    "trialStatus",
    "purchaseStatus",
  ],
  reinstall: [
    "name",
    "category",
    "system",
    "softwareType",
    "licenseType",
    "serial",
    "viewPassword",
    "subscriptionSoftware",
    "subscriptionPeriod",
    "subscriptionPrice",
    "subscriptionCurrency",
    "site",
    "note",
  ],
  // accessToken 是 Appwrite 額度自動同步用的憑證，不屬於 Fresh 工作台的
  // 資料 CRUD 範圍；刻意不列在白名單，避免 CSV 或表單意外把它寫進 Sanity。
  quota: [
    "name",
    "serviceType",
    "account",
    "quotaRemaining",
    "quotaPoints",
    "litmediaAccount",
    "pointsSyncedAt",
    "quotaRatio",
    "quotaExpiry",
    "usageSyncedAt",
    "ratio5h",
    "expiry5h",
    "ratioWeek",
    "expiryWeek",
    "ratioMonth",
    "expiryMonth",
    "resetCreditsBalance",
    "resetCreditsExpiry",
    "note",
  ],
  food: ["name", "amount", "todate", "photo", "price", "shop", "photohash"],
  shoppinglist: [
    "name",
    "plannedDate",
    "price",
    "currency",
    "quantity",
    "shop",
    "pickupMethod",
    "imageUrl",
    "account",
    "note",
  ],
  notes: [
    "title",
    "content",
    "category",
    "newDate",
    "url1",
    "url2",
    "url3",
    "file1",
    "file1name",
    "file1type",
    "file2",
    "file2name",
    "file2type",
    "file3",
    "file3name",
    "file3type",
    // 舊 Studio 的 article 直接使用 image / video / pdf 欄位；保留它們
    // 才能在編輯後仍看得到既有附件。
    "image",
    "video",
    "pdf",
  ],
  common: ["name", "site01", "note01", "site02", "note02", "site03", "note03", "site04", "note04"],
  mail: ["name", "host", "address", "account", "url"],
  experience: ["title", "year", "gov", "site"],
  member: ["name", "title", "relation", "gov", "site", "img"],
  cloud: ["name", "site", "account", "space"],
  host: ["name", "site", "account"],
  images: ["assetId", "filename", "mimeType", "size", "title", "url", "category", "date", "note"],
  videos: ["assetId", "filename", "mimeType", "size", "title", "url", "category", "date", "note"],
  music: ["assetId", "filename", "mimeType", "size", "title", "url", "category", "date", "note"],
  documents: ["assetId", "filename", "mimeType", "size", "title", "url", "category", "date", "note"],
  podcast: ["assetId", "filename", "mimeType", "size", "title", "url", "category", "date", "note"],
  bank: ["name", "deposit", "site", "address", "withdrawals", "transfer", "activity", "card", "account"],
  routine: ["name", "note", "lastdate1", "lastdate2", "lastdate3", "link", "photo"],
  tools: ["name", "kind", "url", "query", "note"],
  about: ["name", "value"],
};

const requiredFields: Partial<Record<SanityModuleId, readonly string[]>> = {
  subscription: ["name"],
  trialpurchase: ["name"],
  reinstall: ["name"],
  quota: ["name"],
  food: ["name"],
  shoppinglist: ["name"],
  notes: ["title"],
  common: ["name"],
  mail: ["name"],
  experience: ["title"],
  member: ["name"],
  cloud: ["name"],
  host: ["name"],
  bank: ["name"],
  routine: ["name"],
  about: ["name"],
};

const requiredLabels: Record<string, string> = {
  name: "名稱",
  title: "標題",
};

/** Never send automation credentials back to the browser in a list response. */
const sensitiveReadFields: Partial<Record<SanityModuleId, readonly string[]>> = {
  quota: ["accessToken"],
};

export function isModuleId(moduleId: string): moduleId is SanityModuleId {
  return (SANITY_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function getTypeAliases(moduleId: string): readonly string[] {
  return isModuleId(moduleId) ? moduleTypeAliases[moduleId] : [];
}

export function getWriteType(moduleId: string): string {
  return getTypeAliases(moduleId)[0] || "";
}

export function getModuleFields(moduleId: string): readonly string[] {
  return isModuleId(moduleId) ? moduleFields[moduleId] : [];
}

export function buildTypeFilter(types: readonly string[]): string {
  return types.map((type) => `_type == "${type}"`).join(" || ");
}

/** 從不可信任的 request/CSV payload 挑出可儲存的欄位。 */
export function pickModuleFields(moduleId: string, row: SanityRow): SanityRow {
  const fields = getModuleFields(moduleId);
  const cleaned: SanityRow = {};
  for (const field of fields) {
    if (Object.hasOwn(row, field)) cleaned[field] = row[field];
  }
  return cleaned;
}

function isBlank(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function copyFirstPresent(row: SanityRow, target: string, sources: readonly string[]) {
  if (!isBlank(row[target])) return;
  const source = sources.find((key) => !isBlank(row[key]));
  if (source) row[target] = row[source];
}

/**
 * 舊文件的欄名投影成目前工作台的欄名。
 *
 * 左邊是 Appwrite collection 或 `goldshoot0720/sanitygoldshoot0720` Studio 現場
 * 的欄名，右邊是工作台欄位。原始欄位會保留，更新時不會無故覆蓋或刪除歷史資料。
 */
export function projectLegacyFields(moduleId: string, row: SanityRow): SanityRow {
  switch (moduleId) {
    case "notes":
      copyFirstPresent(row, "title", ["name"]);
      copyFirstPresent(row, "newDate", ["date", "datetime"]);
      copyFirstPresent(row, "image", ["imgurl", "photourl"]);
      break;
    case "common":
      copyFirstPresent(row, "site01", ["url", "site", "host"]);
      copyFirstPresent(row, "note01", ["note", "address"]);
      break;
    case "bank":
      copyFirstPresent(row, "deposit", ["balance"]);
      copyFirstPresent(row, "name", ["bank"]);
      break;
    case "routine":
      copyFirstPresent(row, "name", ["title"]);
      copyFirstPresent(row, "note", ["description"]);
      copyFirstPresent(row, "lastdate1", ["date1"]);
      copyFirstPresent(row, "lastdate2", ["date2"]);
      copyFirstPresent(row, "lastdate3", ["date3"]);
      copyFirstPresent(row, "link", ["site"]);
      break;
    case "food":
      copyFirstPresent(row, "photo", ["photourl", "imgurl", "image"]);
      break;
    case "videos":
      copyFirstPresent(row, "title", ["name", "song"]);
      copyFirstPresent(row, "url", ["watch", "youtube", "site", "video"]);
      copyFirstPresent(row, "category", ["type", "season"]);
      copyFirstPresent(row, "date", ["datetime"]);
      break;
    case "images":
      copyFirstPresent(row, "title", ["name"]);
      copyFirstPresent(row, "url", ["imgurl", "photourl", "image"]);
      break;
    case "music":
      copyFirstPresent(row, "title", ["name", "song"]);
      copyFirstPresent(row, "note", ["lyrics"]);
      break;
    case "documents":
    case "podcast":
      copyFirstPresent(row, "title", ["name"]);
      copyFirstPresent(row, "url", ["file", "pdf", "site"]);
      break;
    case "about":
      copyFirstPresent(row, "name", ["title"]);
      copyFirstPresent(row, "value", ["content", "note"]);
      break;
  }
  return row;
}

export type SanityReadConfig = {
  projectId: string;
  dataset: string;
};

/**
 * 一筆 Sanity 文件 → 工作台列。
 *
 * 先把 image / file / Portable Text 這些物件欄位攤平成字串（否則表格會印出
 * `[object Object]`，連結也開不了），再做欄名投影 —— 順序不能反，Studio 的
 * `food.photo` 是 image 物件，攤平後才判斷得出它到底有沒有值。
 */
export function normalizeRow(row: SanityRow, moduleId: string, config: SanityReadConfig): SanityRow {
  const flat: SanityRow = { id: String(row._id ?? "") };
  const hiddenFields = isModuleId(moduleId)
    ? new Set(sensitiveReadFields[moduleId] || [])
    : new Set<string>();
  for (const [key, value] of Object.entries(row)) {
    if (hiddenFields.has(key)) continue;
    flat[key] = key.startsWith("_") ? value : flattenSanityValue(value, config);
  }
  return projectLegacyFields(moduleId, flat);
}

export function normalizeRows(
  rows: readonly SanityRow[],
  moduleId: string,
  config: SanityReadConfig,
): SanityRow[] {
  return (rows || []).map((row) => normalizeRow(row, moduleId, config));
}

/**
 * 新增時檢查必填欄；部分更新時只拒絕「明確把必填欄改成空白」的請求。
 */
export function validateModuleRow(
  moduleId: string,
  row: SanityRow,
  options: { requireAll?: boolean } = {},
): string[] {
  if (!isModuleId(moduleId)) return ["未知的鋒兄模組"];

  const errors: string[] = [];
  for (const field of requiredFields[moduleId] || []) {
    const hasValue = Object.hasOwn(row, field);
    if ((options.requireAll && !hasValue) || (hasValue && isBlank(row[field]))) {
      errors.push(`「${requiredLabels[field] || field}」不可空白`);
    }
  }
  return errors;
}

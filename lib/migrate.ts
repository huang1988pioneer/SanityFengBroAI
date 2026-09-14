/**
 * Appwrite CSV → Sanity 遷移的純函式。
 *
 * `SANITY_SETUP.md` 一直寫著「訪問 /migrate」，但那一頁從來沒被實作。這裡把
 * 遷移頁需要的判斷都留在可測試的純函式，island 只負責畫面與送出。
 *
 * 欄名對照的依據是 `goldshoot0720/fengbroaiappwrite` 各模組的 CSV 表頭
 * （BANK_CSV_HEADERS、RoutineManagement 的 CSV_HEADERS、NotesManagement 的
 * ZIP_CSV_HEADERS…）以及 `goldshoot0720/sanitygoldshoot0720` Studio 現場的
 * document 欄名；兩邊對不上的地方就靠 migrateHeaderAliases 補。
 */

export type MigrateRow = Record<string, string | number | boolean>;

/**
 * 各模組可寫入的欄位，照抄 Appwrite 端的 CSV 表頭順序。
 *
 * 伺服器端 `/api/sanity/[module]` 也有一份同樣的白名單，最終以它為準；這裡留
 * 一份是為了讓遷移頁能在送出前先把表頭對照與預覽畫出來。
 */
export const migrateModuleFields: Record<string, readonly string[]> = {
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
  // accessToken 是額度自動同步的 API 憑證，遷移工具刻意不接受它。
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

export function getMigrateFields(moduleId: string): readonly string[] {
  return migrateModuleFields[moduleId] || [];
}

export const migrateModuleLabels: Record<string, string> = {
  subscription: "鋒兄訂閱",
  trialpurchase: "鋒兄試用／首購",
  reinstall: "鋒兄重灌",
  quota: "鋒兄額度",
  food: "鋒兄食品",
  shoppinglist: "鋒兄購物清單",
  notes: "鋒兄筆記",
  common: "鋒兄常用",
  mail: "鋒兄郵件",
  experience: "鋒兄經歷",
  member: "鋒兄成員",
  cloud: "鋒兄雲端",
  host: "鋒兄主機",
  images: "鋒兄圖片",
  videos: "鋒兄影片",
  music: "鋒兄音樂",
  documents: "鋒兄文件",
  podcast: "鋒兄播客",
  bank: "鋒兄銀行",
  routine: "鋒兄例行",
  tools: "鋒兄工具",
  about: "鋒兄關於",
};

export const migrateModuleIds: readonly string[] = Object.keys(migrateModuleFields);

/** Appwrite 與 Sanity 各自的系統欄位：帶著只會變成孤兒欄位，一律丟掉。 */
export const systemColumns = new Set([
  "$id",
  "$createdAt",
  "$updatedAt",
  "$permissions",
  "$databaseId",
  "$collectionId",
  "$sequence",
  "id",
  "_id",
  "_type",
  "_rev",
  "_key",
  "_createdAt",
  "_updatedAt",
]);

/** 舊欄名 → 工作台欄名。左邊來自 Appwrite collection 或 Studio 的 document。 */
export const migrateHeaderAliases: Record<string, Record<string, string>> = {
  notes: {
    name: "title",
    note: "content",
    date: "newDate",
    datetime: "newDate",
    imgurl: "image",
    photourl: "image",
  },
  trialpurchase: {
    eventdate: "eventDate",
    event_date: "eventDate",
    firstpurchaseprice: "firstPurchasePrice",
    first_purchase_price: "firstPurchasePrice",
    regularprice: "regularPrice",
    regular_price: "regularPrice",
    trialstatus: "trialStatus",
    trial_status: "trialStatus",
    purchasestatus: "purchaseStatus",
    purchase_status: "purchaseStatus",
  },
  reinstall: {
    softwaretype: "softwareType",
    software_type: "softwareType",
    licensetype: "licenseType",
    license_type: "licenseType",
    viewpassword: "viewPassword",
    view_password: "viewPassword",
    subscriptionsoftware: "subscriptionSoftware",
    subscription_software: "subscriptionSoftware",
    subscriptionperiod: "subscriptionPeriod",
    subscription_period: "subscriptionPeriod",
    subscriptionprice: "subscriptionPrice",
    subscription_price: "subscriptionPrice",
    subscriptioncurrency: "subscriptionCurrency",
    subscription_currency: "subscriptionCurrency",
  },
  quota: {
    servicetype: "serviceType",
    service_type: "serviceType",
    quotaremaining: "quotaRemaining",
    quota_remaining: "quotaRemaining",
    quotapoints: "quotaPoints",
    quota_points: "quotaPoints",
    litmediaaccount: "litmediaAccount",
    litmedia_account: "litmediaAccount",
    pointssyncedat: "pointsSyncedAt",
    points_synced_at: "pointsSyncedAt",
    quotaratio: "quotaRatio",
    quota_ratio: "quotaRatio",
    quotaexpiry: "quotaExpiry",
    quota_expiry: "quotaExpiry",
    usagesyncedat: "usageSyncedAt",
    usage_synced_at: "usageSyncedAt",
    resetcreditsbalance: "resetCreditsBalance",
    reset_credits_balance: "resetCreditsBalance",
    resetcreditsexpiry: "resetCreditsExpiry",
    reset_credits_expiry: "resetCreditsExpiry",
  },
  food: { photourl: "photo", imgurl: "photo", expiry: "todate" },
  shoppinglist: {
    planneddate: "plannedDate",
    planned_date: "plannedDate",
    "預定購買日": "plannedDate",
    "購買日": "plannedDate",
    "預定日期": "plannedDate",
    "預定價格": "price",
    "價格": "price",
    "金額": "price",
    "幣別": "currency",
    "幣種": "currency",
    "貨幣": "currency",
    "預定數量": "quantity",
    "數量": "quantity",
    "預定商店": "shop",
    "商店": "shop",
    "店家": "shop",
    pickupmethod: "pickupMethod",
    pickup_method: "pickupMethod",
    "預定取貨方式": "pickupMethod",
    "取貨方式": "pickupMethod",
    imageurl: "imageUrl",
    image_url: "imageUrl",
    image: "imageUrl",
    "圖片": "imageUrl",
    "圖片網址": "imageUrl",
    "商品圖片": "imageUrl",
    "帳號": "account",
    "備註": "note",
  },
  routine: { title: "name", description: "note", date1: "lastdate1", date2: "lastdate2", date3: "lastdate3", site: "link" },
  bank: { balance: "deposit", bank: "name" },
  common: { url: "site01", site: "site01", host: "site01", note: "note01", address: "note01" },
  images: { name: "title", imgurl: "url", photourl: "url" },
  videos: { name: "title", song: "title", watch: "url", youtube: "url", type: "category", datetime: "date" },
  music: { name: "title", song: "title", lyrics: "note", language: "category" },
  documents: { name: "title", file: "url", cover: "url", filetype: "category", ref: "assetId" },
  podcast: { name: "title", file: "url", ref: "assetId" },
  about: { title: "name", content: "value", note: "value" },
};

const numberFields = new Set([
  "price",
  "amount",
  "deposit",
  "withdrawals",
  "transfer",
  "size",
  "year",
  "firstPurchasePrice",
  "regularPrice",
  "subscriptionPrice",
  "quotaRemaining",
  "quotaPoints",
  "quotaRatio",
  "ratio5h",
  "ratioWeek",
  "ratioMonth",
  "resetCreditsBalance",
  "quantity",
  "space",
]);
const booleanFields = new Set(["continue", "subscriptionSoftware"]);
const truthyValues = new Set(["true", "1", "yes", "y", "是", "續訂", "on"]);

/** RFC4180 風格的 CSV：支援引號內的逗號、換行與跳脫引號。 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  const source = text.replace(/^﻿/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

/** CSV 表頭 → 工作台欄位；認不得就回空字串，交給呼叫端當成忽略欄。 */
export function mapHeader(moduleId: string, header: string): string {
  const trimmed = header.replace(/^﻿/, "").trim();
  if (!trimmed || systemColumns.has(trimmed)) return "";

  const fields = getMigrateFields(moduleId);
  if (fields.includes(trimmed)) return trimmed;

  const alias = migrateHeaderAliases[moduleId]?.[trimmed];
  if (alias && fields.includes(alias)) return alias;

  // Appwrite 的欄名大小寫偶有出入（newdate / NewDate），比對時放寬。
  const lowered = trimmed.toLowerCase();
  const caseInsensitive = fields.find((field) => field.toLowerCase() === lowered);
  if (caseInsensitive) return caseInsensitive;

  const loweredAlias = migrateHeaderAliases[moduleId]?.[lowered];
  return loweredAlias && fields.includes(loweredAlias) ? loweredAlias : "";
}

/** 字串 → 欄位該有的型別。數字欄空白算 0，布林欄只認得出「是」的才是 true。 */
export function castMigrateValue(field: string, raw: string): string | number | boolean {
  const trimmed = (raw ?? "").trim();
  if (numberFields.has(field)) {
    const parsed = Number(trimmed.replace(/[,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (booleanFields.has(field)) return truthyValues.has(trimmed.toLowerCase());
  return raw ?? "";
}

export type MigratePlan = {
  moduleId: string;
  rows: MigrateRow[];
  /** 對得上的 CSV 表頭 → 工作台欄位。 */
  mappedHeaders: Array<{ header: string; field: string }>;
  /** 對不上、會被丟掉的 CSV 表頭（不含系統欄）。 */
  ignoredHeaders: string[];
  /** 工作台有、但這份 CSV 沒帶的欄位。 */
  missingFields: string[];
  /** 整列都是空白而被跳過的資料列數。 */
  skippedRows: number;
  errors: string[];
};

/**
 * 解析一份 CSV，產出可以直接 POST 給 `/api/sanity/{module}` 的列。
 * 只挑得出工作台認得的欄位；認不得的表頭會列在 ignoredHeaders 讓使用者看到。
 */
export function planMigration(text: string, moduleId: string): MigratePlan {
  const empty: MigratePlan = {
    moduleId,
    rows: [],
    mappedHeaders: [],
    ignoredHeaders: [],
    missingFields: [],
    skippedRows: 0,
    errors: [],
  };

  const fields = getMigrateFields(moduleId);
  if (fields.length === 0) return { ...empty, errors: [`未知的鋒兄模組：${moduleId}`] };

  const table = parseCsv(text || "");
  if (table.length === 0) return { ...empty, errors: ["CSV 是空的"] };
  if (table.length === 1) return { ...empty, errors: ["CSV 只有表頭，沒有資料列"] };

  const headers = table[0].map((header) => header.replace(/^﻿/, "").trim());
  const mappedHeaders: Array<{ header: string; field: string }> = [];
  const ignoredHeaders: string[] = [];
  const columnFields = headers.map((header) => {
    const field = mapHeader(moduleId, header);
    if (field) mappedHeaders.push({ header, field });
    else if (header && !systemColumns.has(header)) ignoredHeaders.push(header);
    return field;
  });

  if (mappedHeaders.length === 0) {
    return {
      ...empty,
      ignoredHeaders,
      errors: [`表頭對不上任何「${migrateModuleLabels[moduleId] || moduleId}」欄位，請確認選對模組`],
    };
  }

  const usedFields = new Set(mappedHeaders.map((item) => item.field));
  const rows: MigrateRow[] = [];
  let skippedRows = 0;

  for (let line = 1; line < table.length; line++) {
    const values = table[line];
    const row: MigrateRow = {};
    let hasValue = false;
    columnFields.forEach((field, index) => {
      if (!field) return;
      const raw = values[index] ?? "";
      if (raw.trim() !== "") hasValue = true;
      row[field] = castMigrateValue(field, raw);
    });
    if (!hasValue) {
      skippedRows++;
      continue;
    }
    rows.push(row);
  }

  return {
    moduleId,
    rows,
    mappedHeaders,
    ignoredHeaders,
    missingFields: fields.filter((field) => !usedFields.has(field)),
    skippedRows,
    errors: rows.length === 0 ? ["沒有可遷移的資料列"] : [],
  };
}

/** 一次送太多筆容易被 Sanity 擋下；切成小批才看得到進度也好重試。 */
export function chunkRows(rows: MigrateRow[], size = 50): MigrateRow[][] {
  if (size < 1) return rows.length > 0 ? [rows] : [];
  const chunks: MigrateRow[][] = [];
  for (let start = 0; start < rows.length; start += size) {
    chunks.push(rows.slice(start, start + size));
  }
  return chunks;
}

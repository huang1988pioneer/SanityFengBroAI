import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type FieldType = "text" | "number" | "date" | "datetime" | "url" | "boolean" | "textarea" | "password";

type Field = {
  key: string;
  label: string;
  type?: FieldType;
  wide?: boolean;
};

type Row = Record<string, string | number | boolean>;

type Module = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  fields: Field[];
  seed: Row[];
};

type SanitySettings = {
  projectId: string;
  dataset: string;
  token: string;
  apiVersion: string;
};

const todayStamp = () => new Date().toISOString().slice(0, 10).replaceAll("-", "");
const settingsKey = "fengbro.sanity.settings.v1";

const defaultSettings: SanitySettings = {
  projectId: "",
  dataset: "production",
  token: "",
  apiVersion: "v2025-02-19",
};

const commonMediaFields: Field[] = [
  { key: "title", label: "標題" },
  { key: "url", label: "連結", type: "url" },
  { key: "category", label: "分類" },
  { key: "date", label: "日期", type: "date" },
  { key: "note", label: "備註", type: "textarea", wide: true },
];

const modules: Module[] = [
  {
    id: "subscription",
    label: "鋒兄訂閱",
    shortLabel: "訂閱",
    icon: "calendar",
    description: "Sanity document type: fengbro_subscription。支援 Appwrite subscription CSV 欄位。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "site", label: "網站", type: "url" },
      { key: "price", label: "價格", type: "number" },
      { key: "nextdate", label: "下次日期", type: "date" },
      { key: "note", label: "備註", type: "textarea", wide: true },
      { key: "account", label: "帳號" },
      { key: "currency", label: "幣別" },
      { key: "continue", label: "續訂", type: "boolean" },
    ],
    seed: [
      { name: "小北百貨連續簽到", site: "", price: 0, nextdate: "2026-06-07", note: "~0607\n0988\n0908", account: "", currency: "TWD", continue: false },
      { name: "Proton Drive Plus 200 GB", site: "https://drive.proton.me", price: 5, nextdate: "2026-06-15", note: "", account: "huang1988pioneer", currency: "USD", continue: false },
      { name: "蝦皮VIP", site: "", price: 59, nextdate: "2026-06-30", note: "台新銀行\n0731\n0831", account: "abuhg17", currency: "TWD", continue: true },
      { name: "ChatGPT/PLUS", site: "https://chatgpt.com/#pricing", price: 690, nextdate: "2026-07-04", note: "outlook\n街口\n中信\nApple Pay", account: "gaokaolevel3iptopscorer", currency: "TWD", continue: true },
      { name: "Google AI Pro", site: "https://gemini.google.com/app", price: 0, nextdate: "2026-08-08", note: "5TB\n前4個月試用免費\n650元", account: "fengtuprinfo", currency: "TWD", continue: false },
      { name: "即享券", site: "", price: 0, nextdate: "2026-08-08", note: "CoCo都可/國泰優惠\n日安大麥2杯 ～08/31\n麥當勞/蝦皮 *3", account: "", currency: "TWD", continue: false },
    ],
  },
  {
    id: "food",
    label: "鋒兄食品（商品庫存）",
    shortLabel: "食品",
    icon: "box",
    description: "Sanity document type: fengbro_food。食品到期日、庫存、照片、價格與店家管理。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "amount", label: "庫存", type: "number" },
      { key: "todate", label: "到期日", type: "datetime" },
      { key: "photo", label: "照片", type: "url" },
      { key: "price", label: "價格", type: "number" },
      { key: "shop", label: "店家" },
      { key: "photohash", label: "照片雜湊" },
    ],
    seed: [
      { name: "小北百貨30元購物金", amount: 1, todate: "2026-06-11T00:00:00.000+00:00", photo: "", price: 0, shop: "", photohash: "" },
      { name: "【義美】煎餅 ~08/13 ~08/25", amount: 4, todate: "2026-08-04T00:00:00.000+00:00", photo: "", price: 0, shop: "", photohash: "" },
      { name: "【愛之味】牛奶花生", amount: 4, todate: "2027-03-04T00:00:00.000+00:00", photo: "https://www.agv.com.tw/wp-content/uploads/69691c7bdcc3ce6d5d8a1361f22d04ac.jpg", price: 0, shop: "", photohash: "" },
      { name: "【泰山】八寶粥", amount: 5, todate: "2027-04-14T00:00:00.000+00:00", photo: "https://shoplineimg.com/64587ad406d620007ce10917/6463162e0fa8d10001cc0eb5/800x.jpg?", price: 0, shop: "", photohash: "" },
      { name: "【台糖】豆豉紅燒鰻", amount: 3, todate: "2028-06-04T00:00:00.000+00:00", photo: "https://fs1.shop123.com.tw/400467/upload/product/4004673457pic_outside_441268438813.jpg", price: 0, shop: "", photohash: "" },
    ],
  },
  {
    id: "notes",
    label: "鋒兄筆記",
    shortLabel: "筆記",
    icon: "note",
    description: "Sanity document type: fengbro_notes。文章、筆記、連結與附件欄位。",
    fields: [
      { key: "title", label: "標題" },
      { key: "content", label: "內容", type: "textarea", wide: true },
      { key: "category", label: "分類" },
      { key: "newDate", label: "新增日期", type: "date" },
      { key: "url1", label: "連結 1", type: "url" },
      { key: "url2", label: "連結 2", type: "url" },
      { key: "url3", label: "連結 3", type: "url" },
      { key: "file1", label: "檔案 1", type: "url" },
      { key: "file1name", label: "檔名 1" },
      { key: "file1type", label: "檔案類型 1" },
    ],
    seed: [
      { title: "歷史價格紀錄", content: "KIOXIA 鎧俠 Exceria Plus G3 SSD M.2 2280 PCIe NVMe 1TB Gen4x4\n曾經來到2090元", category: "", newDate: "2026-06-04", url1: "https://24h.pchome.com.tw/prod/DRAHGT-A900GOJVX", url2: "", url3: "", file1: "", file1name: "", file1type: "" },
      { title: "米斗多", content: "紅豆 芋頭 巧克力\n1 1 1", category: "", newDate: "2026-06-01", url1: "", url2: "", url3: "", file1: "", file1name: "", file1type: "" },
      { title: "中原豆花", content: "玉玉子豆花 中北路二段457號\n熊豆花 大仁五街19號\n豆花王 實踐路35號", category: "", newDate: "2026-06-01", url1: "", url2: "", url3: "", file1: "", file1name: "", file1type: "" },
    ],
  },
  {
    id: "common",
    label: "鋒兄常用",
    shortLabel: "常用",
    icon: "key",
    description: "Sanity document type: fengbro_common。常用帳號與網站備註。",
    fields: [
      { key: "name", label: "帳號" },
      { key: "site01", label: "網站 01" },
      { key: "note01", label: "備註 01" },
      { key: "site02", label: "網站 02" },
      { key: "note02", label: "備註 02" },
      { key: "site03", label: "網站 03" },
      { key: "note03", label: "備註 03" },
      { key: "site04", label: "網站 04" },
      { key: "note04", label: "備註 04" },
    ],
    seed: [
      { name: "goldshoot0720@gmail.com", site01: "可灵AI", note01: "", site02: "即夢AI", note02: "", site03: "Appwrite", note03: "", site04: "Vercel", note04: "" },
      { name: "dailycash539get8000000@outlook.com", site01: "Appwrite", note01: "", site02: "Github", note02: "", site03: "Outlook", note03: "", site04: "Suno", note04: "" },
    ],
  },
  { id: "images", label: "鋒兄圖片", shortLabel: "圖片", icon: "image", description: "Sanity document type: fengbro_images。圖片素材、來源、分類與備註。", fields: commonMediaFields, seed: [{ title: "鋒兄 profile", url: "/fengbro-profile.png", category: "頭像", date: "2026-06-06", note: "可替換為 Sanity asset URL。" }] },
  { id: "videos", label: "鋒兄影片", shortLabel: "影片", icon: "video", description: "Sanity document type: fengbro_videos。影片連結、分類與備註。", fields: commonMediaFields, seed: [{ title: "鋒兄Tube 範例", url: "https://www.youtube.com/", category: "YouTube", date: "2026-06-06", note: "可記錄頻道或影片 URL。" }] },
  { id: "music", label: "鋒兄音樂", shortLabel: "音樂", icon: "music", description: "Sanity document type: fengbro_music。音樂、歌詞、音訊連結與分類。", fields: commonMediaFields, seed: [{ title: "鋒兄歌詞", url: "", category: "lyrics", date: "2026-06-06", note: "參考原專案 musics 資料夾。" }] },
  { id: "documents", label: "鋒兄文件", shortLabel: "文件", icon: "file", description: "Sanity document type: fengbro_documents。文件檔案、PDF、連結與備註。", fields: commonMediaFields, seed: [{ title: "使用手冊", url: "", category: "docs", date: "2026-06-06", note: "可匯入文件 CSV。" }] },
  { id: "podcast", label: "鋒兄播客", shortLabel: "播客", icon: "podcast", description: "Sanity document type: fengbro_podcast。播客節目、音訊來源與筆記。", fields: commonMediaFields, seed: [{ title: "鋒兄播客第 1 集", url: "", category: "podcast", date: "2026-06-06", note: "節目摘要。" }] },
  {
    id: "bank",
    label: "鋒兄銀行（電子票證）",
    shortLabel: "銀行",
    icon: "bank",
    description: "Sanity document type: fengbro_bank。銀行帳戶與電子票證資產。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "deposit", label: "餘額", type: "number" },
      { key: "site", label: "網站", type: "url" },
      { key: "address", label: "地址" },
      { key: "withdrawals", label: "提款次數", type: "number" },
      { key: "transfer", label: "轉帳次數", type: "number" },
      { key: "activity", label: "活動", type: "url" },
      { key: "card", label: "卡片" },
      { key: "account", label: "帳號" },
    ],
    seed: [
      { name: "兆豐銀行", deposit: 1000, site: "", address: "", withdrawals: 0, transfer: 0, activity: "", card: "", account: "末五碼 52678" },
      { name: "中華郵政", deposit: 1000, site: "", address: "", withdrawals: 0, transfer: 0, activity: "", card: "", account: "末五碼 45747" },
      { name: "台新銀行", deposit: 500, site: "https://www.taishinbank.com.tw", address: "", withdrawals: 5, transfer: 5, activity: "https://richart.tw/TSDIB_RichartWeb/ntd-saving-currency", card: "台新Richart VISA金融卡 1902", account: "末五碼 57295" },
      { name: "國泰世華", deposit: 500, site: "https://www.cathaybk.com.tw", address: "", withdrawals: 0, transfer: 0, activity: "", card: "國泰世華一卡通簽帳金融卡 1588", account: "末五碼 30607" },
      { name: "Supercard超級悠遊卡LOGO線條款", deposit: 242, site: "https://www.easycard.com.tw/museum?page=1&keywords=Supercard%E8%B6%85%E7%B4%9A%E6%82%A0%E9%81%8A%E5%8D%A1LOGO%E7%B7%9A%E6%A2%9D%E6%AC%BE", address: "", withdrawals: 0, transfer: 0, activity: "", card: "", account: "" },
    ],
  },
  {
    id: "routine",
    label: "鋒兄例行",
    shortLabel: "例行",
    icon: "repeat",
    description: "Sanity document type: fengbro_routine。例行事項、最近日期、連結與照片。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "note", label: "備註", type: "textarea", wide: true },
      { key: "lastdate1", label: "日期 1", type: "datetime" },
      { key: "lastdate2", label: "日期 2", type: "datetime" },
      { key: "lastdate3", label: "日期 3", type: "datetime" },
      { key: "link", label: "連結", type: "url" },
      { key: "photo", label: "照片", type: "url" },
    ],
    seed: [
      { name: "鋒兄理髮", note: "", lastdate1: "2026-05-18T00:00:00.000+00:00", lastdate2: "2026-02-04T00:00:00.000+00:00", lastdate3: "", link: "", photo: "" },
      { name: "鋒兄手機", note: "Samsung Galaxy A56 5G (12G/256G)", lastdate1: "2026-01-02T00:00:00.000+00:00", lastdate2: "", lastdate3: "", link: "", photo: "https://storage.googleapis.com/landtop_prod/productimage/3544/image/e63b19d17156868403c6645dc5572ca3.png" },
      { name: "鋒兄牙刷", note: "預定每90天更換\n刷樂濃密炭深潔牙刷", lastdate1: "2026-05-19T00:00:00.000+00:00", lastdate2: "", lastdate3: "", link: "", photo: "" },
    ],
  },
  {
    id: "tools",
    label: "鋒兄工具",
    shortLabel: "工具",
    icon: "tool",
    description: "Sanity document type: fengbro_tools。子項目：鋒兄比價、手機比價、鋒兄Tube、鋒兄金融。",
    fields: [
      { key: "name", label: "工具名稱" },
      { key: "kind", label: "子項目" },
      { key: "url", label: "連結", type: "url" },
      { key: "query", label: "預設查詢" },
      { key: "note", label: "備註", type: "textarea", wide: true },
    ],
    seed: [
      { name: "鋒兄比價", kind: "price-compare", url: "https://24h.pchome.com.tw/", query: "KIOXIA SSD", note: "商品歷史價格紀錄。" },
      { name: "手機比價", kind: "phone-compare", url: "https://www.landtop.com.tw/", query: "Samsung 26", note: "手機商品比價。" },
      { name: "鋒兄Tube", kind: "fengbro-tube", url: "https://www.youtube.com/", query: "henren778", note: "頻道更新整理。" },
      { name: "鋒兄金融", kind: "fengbro-finance", url: "https://finance.yahoo.com/", query: "TWII, USD/TWD, BTC", note: "金融指標與估值追蹤。" },
    ],
  },
  {
    id: "settings",
    label: "鋒兄設定",
    shortLabel: "設定",
    icon: "settings",
    description: "只保存 Sanity 連線設定到 localStorage；表格資料全部使用 Sanity。",
    fields: [
      { key: "projectId", label: "SANITY_PROJECT_ID" },
      { key: "dataset", label: "SANITY_DATASET" },
      { key: "token", label: "SANITY_API_TOKEN", type: "password", wide: true },
      { key: "apiVersion", label: "SANITY_API_VERSION" },
    ],
    seed: [],
  },
  { id: "about", label: "鋒兄關於", shortLabel: "關於", icon: "info", description: "Sanity document type: fengbro_about。專案資訊、版本與備註。", fields: [{ key: "name", label: "名稱" }, { key: "value", label: "內容", type: "textarea", wide: true }], seed: [{ name: "鋒兄 AI Fresh", value: "Deno Fresh 版本，使用 Sanity 保存表格資料，localStorage 僅保存 Sanity 設定。" }] },
];

const moduleById = Object.fromEntries(modules.map((module) => [module.id, module]));

function createEmptyRow(module: Module): Row {
  return Object.fromEntries(module.fields.map((field) => {
    if (field.type === "number") return [field.key, 0];
    if (field.type === "boolean") return [field.key, true];
    return [field.key, ""];
  }));
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
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

function castValue(value: string, field?: Field): string | number | boolean {
  const trimmed = value.trim();
  if (field?.type === "number") return Number(trimmed || 0);
  if (field?.type === "boolean") return ["true", "1", "yes", "y", "續訂", "是"].includes(trimmed.toLowerCase());
  return value;
}

function rowsFromCsv(text: string, module: Module): Row[] {
  const csvRows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (csvRows.length === 0) return [];
  const headers = csvRows[0].map((header) => header.trim());
  return csvRows.slice(1).map((values) => {
    const row: Row = createEmptyRow(module);
    headers.forEach((header, index) => {
      const field = module.fields.find((item) => item.key === header);
      row[header] = castValue(values[index] ?? "", field);
    });
    return row;
  });
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(module: Module, rows: Row[]) {
  const headers = module.fields.map((field) => field.key);
  return "\uFEFF" + [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ].join("\n");
}

function downloadCsv(module: Module, rows: Row[]) {
  const blob = new Blob([toCsv(module, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `sanity-${module.id}-${todayStamp()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getStoredSettings(): SanitySettings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") };
  } catch {
    return defaultSettings;
  }
}

function authHeaders(settings: SanitySettings) {
  return {
    "Content-Type": "application/json",
    "x-sanity-project-id": settings.projectId,
    "x-sanity-dataset": settings.dataset,
    "x-sanity-token": settings.token,
    "x-sanity-api-version": settings.apiVersion,
  };
}

function stripSystemFields(row: Row): Row {
  const clean: Row = {};
  Object.entries(row).forEach(([key, value]) => {
    if (!key.startsWith("_") && key !== "id") clean[key] = value;
  });
  return clean;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    calendar: "M7 2v3M17 2v3M3 9h18M5 5h14v16H5z",
    box: "M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10",
    note: "M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8",
    key: "M14 14a5 5 0 1 1 2-4l5-5 2 2-2 2 2 2-2 2-2-2-3 3z",
    image: "M4 5h16v14H4zM8 13l3-3 3 4 2-2 3 4M8 9h.01",
    video: "M4 6h12v12H4zM16 10l5-3v10l-5-3z",
    music: "M9 18V5l10-2v13M9 18a3 3 0 1 1-2-2.83M19 16a3 3 0 1 1-2-2.83",
    file: "M6 3h9l5 5v13H6zM14 3v6h6M9 14h8M9 18h6",
    podcast: "M12 3a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V8a5 5 0 0 1 5-5zM8 15l-1 6h10l-1-6",
    bank: "M3 9l9-6 9 6zM5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16",
    repeat: "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
    tool: "M14 7l3 3 5-5a6 6 0 0 1-8 8l-8 8-3-3 8-8a6 6 0 0 1 8-8z",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12H2M22 12h-2M12 4V2M12 22v-2M5 5l-1.5-1.5M20.5 20.5L19 19M19 5l1.5-1.5M3.5 20.5L5 19",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 10v7M12 7h.01",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] ?? paths.note} />
    </svg>
  );
}

export default function FengbroCrudApp() {
  const [rows, setRows] = useState<Row[]>([]);
  const [settings, setSettings] = useState<SanitySettings>(defaultSettings);
  const [activeId, setActiveId] = useState("subscription");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Row>(() => createEmptyRow(modules[0]));
  const [message, setMessage] = useState("請設定 Sanity 或使用環境變數");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const activeModule = moduleById[activeId];
  const isSettings = activeId === "settings";

  const loadRows = async (moduleId = activeId, nextSettings = settings) => {
    if (moduleId === "settings") return;
    setLoading(true);
    try {
      const response = await fetch(`/api/sanity/${moduleId}`, {
        headers: authHeaders(nextSettings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 讀取失敗");
      setRows(data.rows || []);
      const typeHint = data.type ? `（type: ${data.type}）` : "";
      setMessage(data.error || `已從 Sanity 載入 ${data.rows?.length ?? 0} 筆${typeHint}`);
    } catch (error) {
      setRows([]);
      setMessage(error instanceof Error ? error.message : "Sanity 讀取失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = getStoredSettings();
    setSettings(saved);
    void loadRows(activeId, saved);
  }, []);

  useEffect(() => {
    setEditingId(null);
    setDraft(createEmptyRow(activeModule));
    setQuery("");
    setSelectedIds(new Set());
    if (isSettings) {
      setRows([]);
      setMessage("localStorage 僅保存 Sanity 連線設定");
    } else {
      void loadRows(activeId);
    }
  }, [activeId]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [query, rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const money = rows.reduce((sum, row) => sum + Number(row.price ?? row.deposit ?? 0), 0);
    const boolCount = rows.filter((row) => row.continue === true).length;
    return { total, money, boolCount };
  }, [rows]);

  const updateDraft = (key: string, value: string | number | boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = async () => {
    const payload = stripSystemFields({ ...createEmptyRow(activeModule), ...draft });
    setLoading(true);
    try {
      const response = await fetch(`/api/sanity/${activeId}`, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders(settings),
        body: JSON.stringify(editingId ? { id: editingId, row: payload } : { row: payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 寫入失敗");
      const typeHint = data.type ? `（type: ${data.type}）` : "";
      setMessage(editingId ? `已更新 Sanity 文件${typeHint}` : `已新增 Sanity 文件${typeHint}`);
      setEditingId(null);
      setDraft(createEmptyRow(activeModule));
      await loadRows();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sanity 寫入失敗");
    } finally {
      setLoading(false);
    }
  };

  const editRow = (row: Row) => {
    setEditingId(String(row.id));
    setDraft({ ...createEmptyRow(activeModule), ...row });
    setMessage(`正在編輯：${row.name ?? row.title ?? row.id}`);
  };

  const deleteRow = async (row: Row) => {
    const name = String(row.name ?? row.title ?? row.id);
    if (!confirm(`刪除「${name}」？`)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/sanity/${activeId}`, {
        method: "DELETE",
        headers: authHeaders(settings),
        body: JSON.stringify({ id: row.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 刪除失敗");
      setMessage("已刪除 Sanity 文件");
      await loadRows();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sanity 刪除失敗");
    } finally {
      setLoading(false);
    }
  };

  const duplicateRow = async (row: Row) => {
    const copy = stripSystemFields(row);
    if (typeof copy["name"] === "string") copy["name"] = `${copy["name"]} (複製)`;
    if (typeof copy["title"] === "string") copy["title"] = `${copy["title"]} (複製)`;
    setDraft(copy);
    setEditingId(null);
    setMessage("已放入新增表單，確認後寫入 Sanity");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(String(r.id)));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredRows.forEach((r) => next.delete(String(r.id)));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredRows.forEach((r) => next.add(String(r.id)));
        return next;
      });
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.size === 0) { setMessage("請先勾選要刪除的資料"); return; }
    setDeleteConfirmText("");
    setDeleteAllModal(true);
  };

  const confirmDeleteSelected = async () => {
    const required = `Delete ${activeModule.shortLabel}`;
    if (deleteConfirmText.trim() !== required) {
      setMessage(`請輸入「${required}」才能刪除`);
      return;
    }
    setDeleteAllModal(false);
    setLoading(true);
    const ids = Array.from(selectedIds);
    let deleted = 0;
    for (const id of ids) {
      try {
        const response = await fetch(`/api/sanity/${activeId}`, {
          method: "DELETE",
          headers: authHeaders(settings),
          body: JSON.stringify({ id }),
        });
        if (response.ok) deleted++;
      } catch { /* skip */ }
      setMessage(`刪除中... ${deleted} / ${ids.length}`);
    }
    setSelectedIds(new Set());
    setMessage(`已刪除 ${deleted} / ${ids.length} 筆`);
    await loadRows();
    setLoading(false);
  };

  const importRows = async (imported: Row[], label: string) => {
    if (imported.length === 0) {
      setMessage("沒有可匯入的資料");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/sanity/${activeId}`, {
        method: "POST",
        headers: authHeaders(settings),
        body: JSON.stringify({ rows: imported.map(stripSystemFields) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 匯入失敗");
      const typeHint = data.type ? `（type: ${data.type}）` : "";
      setMessage(`${label}：已匯入 ${imported.length} 筆到 Sanity${typeHint}`);
      await loadRows();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sanity 匯入失敗");
    } finally {
      setLoading(false);
    }
  };

  const importFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importRows(rowsFromCsv(text, activeModule), "CSV");
    input.value = "";
  };

  const saveSettings = () => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    setMessage("已保存 Sanity 設定到 localStorage");
    void loadRows("subscription", settings);
  };

  const [diagResult, setDiagResult] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setDiagResult(null);
    try {
      const response = await fetch(`/api/sanity/subscription`, {
        method: "PATCH",
        headers: authHeaders(settings),
      });
      const data = await response.json();
      const lines: string[] = [];
      const info = data.info || {};
      lines.push(`狀態: ${data.ok ? "✅ 連線正常" : "❌ 連線失敗"}`);
      lines.push(`projectId: ${info.projectId}`);
      lines.push(`dataset: ${info.dataset}`);
      lines.push(`apiVersion: ${info.apiVersion}`);
      if (Array.isArray(info.typeAliases)) lines.push(`typeAliases: ${info.typeAliases.join(", ")}`);
      lines.push(`hasToken: ${info.hasToken ? "是" : "否"}`);
      lines.push(`tokenPrefix: ${info.tokenPrefix}`);
      if (info.readOk !== undefined) lines.push(`讀取測試: ${info.readOk ? "✅ 成功" : "❌ 失敗"}`);
      if (Array.isArray(info.readByType) && info.readByType.length > 0) {
        lines.push(`現有文件: ${info.readByType.map((item: { type: string; count: number }) => `${item.type}=${item.count}`).join(", ")}`);
      }
      if (info.writeOk !== undefined) lines.push(`寫入測試: ${info.writeOk ? "✅ 成功" : "❌ 失敗"}`);
      if (info.cleanupOk !== undefined) lines.push(`清理測試: ${info.cleanupOk ? "✅ 成功" : "❌ 失敗"}`);
      if (data.error || info.error) lines.push(`錯誤: ${data.error || info.error}`);
      setDiagResult(lines.join("\n"));
      setMessage(data.ok ? "Sanity 連線診斷通過" : `Sanity 診斷失敗：${data.error || info.error}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "診斷請求失敗";
      setDiagResult(`❌ 請求失敗：${msg}`);
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">鋒</div>
          <div>
            <h1>鋒兄 AI</h1>
            <p>Deno Fresh + Sanity</p>
          </div>
        </div>
        <nav class="nav-list" aria-label="主選單">
          {modules.map((module) => (
            <button
              type="button"
              class={module.id === activeId ? "nav-item active" : "nav-item"}
              onClick={() => setActiveId(module.id)}
            >
              <span class="nav-icon"><Icon name={module.icon} /></span>
              <span>{module.shortLabel}</span>
              <span class="nav-count">{module.id === activeId && !isSettings ? rows.length : ""}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <p class="crumb">工作台 / {activeModule.shortLabel}</p>
            <h2>{activeModule.label}</h2>
            <p>{activeModule.description}</p>
          </div>
          {!isSettings && (
            <div class="top-actions">
              <button type="button" class="ghost-button" onClick={() => void loadRows()}>重新載入</button>
              <button type="button" class="ghost-button" onClick={() => void importRows(activeModule.seed, "範例資料")}>匯入範例</button>
              <button type="button" class="ghost-button" onClick={() => downloadCsv(activeModule, rows)}>匯出 CSV</button>
              <button type="button" class="primary-button" onClick={() => fileRef.current?.click()}>匯入 CSV</button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" class="visually-hidden" onChange={importFile} />
            </div>
          )}
        </header>

        {isSettings ? (
          <section class="settings-panel">
            <div class="table-panel">
              <div class="panel-toolbar">
                <div>
                  <h3>Sanity 連線設定</h3>
                  <p>會保存在瀏覽器 localStorage。若留空，Fresh API 會使用伺服器環境變數。</p>
                </div>
              </div>
              <div class="form-grid settings-grid">
                <label class="field">
                  <span>SANITY_PROJECT_ID</span>
                  <input value={settings.projectId} onInput={(event) => setSettings({ ...settings, projectId: event.currentTarget.value })} />
                </label>
                <label class="field">
                  <span>SANITY_DATASET</span>
                  <input value={settings.dataset} onInput={(event) => setSettings({ ...settings, dataset: event.currentTarget.value })} />
                </label>
                <label class="field wide">
                  <span>SANITY_API_TOKEN</span>
                  <input type="password" value={settings.token} onInput={(event) => setSettings({ ...settings, token: event.currentTarget.value })} />
                </label>
                <label class="field">
                  <span>SANITY_API_VERSION</span>
                  <input value={settings.apiVersion} onInput={(event) => setSettings({ ...settings, apiVersion: event.currentTarget.value })} />
                </label>
              </div>
              <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem;">
                <button class="save-button settings-save" type="button" onClick={saveSettings}>保存設定</button>
                <button class="ghost-button" type="button" onClick={() => void testConnection()} disabled={loading}>🔍 測試 Sanity 連線</button>
              </div>
              {diagResult && (
                <pre style="margin-top:1rem;padding:1rem;background:var(--surface2,#1e1e2e);border-radius:0.5rem;font-size:0.78rem;line-height:1.7;white-space:pre-wrap;color:var(--text1,#cdd6f4);border:1px solid var(--border,#313244);">{diagResult}</pre>
              )}
            </div>
          </section>
        ) : (
          <>
            <section class="metric-row" aria-label="資料概況">
              <div class="metric"><span>Sanity 筆數</span><strong>{stats.total}</strong></div>
              <div class="metric"><span>金額合計</span><strong>{stats.money.toLocaleString("zh-TW")}</strong></div>
              <div class="metric"><span>續訂中</span><strong>{stats.boolCount}</strong></div>
              <div class="metric status"><span>狀態</span><strong>{loading ? "處理中..." : message}</strong></div>
            </section>

            <section class="content-grid">
              <div class="table-panel">
                <div class="panel-toolbar">
                  <div>
                    <h3>{activeModule.shortLabel}資料</h3>
                    <p>{filteredRows.length} / {rows.length} 筆{selectedIds.size > 0 && <span class="selected-badge">　已選 {selectedIds.size} 筆</span>}</p>
                  </div>
                  <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                    {selectedIds.size > 0 && (
                      <button type="button" class="danger-button" onClick={openDeleteSelected}>
                        🗑 刪除已選 ({selectedIds.size})
                      </button>
                    )}
                    <label class="search-box">
                      <span>搜尋</span>
                      <input value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="名稱、備註、帳號..." />
                    </label>
                  </div>
                </div>
                <div class="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th class="check-col">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAll}
                            title={allFilteredSelected ? "取消全選" : "全選"}
                          />
                        </th>
                        {activeModule.fields.slice(0, 6).map((field) => <th>{field.label}</th>)}
                        <th class="action-col">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => {
                        const rowId = String(row.id);
                        const isChecked = selectedIds.has(rowId);
                        return (
                          <tr class={isChecked ? "row-selected" : ""}>
                            <td class="check-col">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelect(rowId)}
                              />
                            </td>
                            {activeModule.fields.slice(0, 6).map((field) => (
                              <td>
                                {field.type === "url" && row[field.key]
                                  ? <a href={String(row[field.key])} target="_blank" rel="noreferrer">{String(row[field.key])}</a>
                                  : field.type === "boolean"
                                  ? <span class={row[field.key] ? "pill on" : "pill"}>{row[field.key] ? "是" : "否"}</span>
                                  : <span class={field.type === "textarea" ? "multiline" : ""}>{String(row[field.key] ?? "")}</span>}
                              </td>
                            ))}
                            <td class="row-actions">
                              <button type="button" title="編輯" onClick={() => editRow(row)}>編輯</button>
                              <button type="button" title="複製" onClick={() => void duplicateRow(row)}>複製</button>
                              <button type="button" title="刪除" class="danger" onClick={() => void deleteRow(row)}>刪除</button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRows.length === 0 && (
                        <tr>
                          <td colSpan={activeModule.fields.slice(0, 6).length + 2} class="empty-cell">沒有符合的 Sanity 資料</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <form class="editor-panel" onSubmit={(event) => { event.preventDefault(); void saveDraft(); }}>
                <div class="editor-head">
                  <div>
                    <h3>{editingId ? "編輯項目" : "新增項目"}</h3>
                    <p>{activeModule.label}</p>
                  </div>
                  {editingId && <button type="button" class="ghost-button compact" onClick={() => { setEditingId(null); setDraft(createEmptyRow(activeModule)); }}>取消</button>}
                </div>
                <div class="form-grid">
                  {activeModule.fields.map((field) => (
                    <label class={field.wide ? "field wide" : "field"}>
                      <span>{field.label}</span>
                      {field.type === "textarea"
                        ? <textarea value={String(draft[field.key] ?? "")} onInput={(event) => updateDraft(field.key, event.currentTarget.value)} />
                        : field.type === "boolean"
                        ? (
                          <select value={draft[field.key] ? "true" : "false"} onChange={(event) => updateDraft(field.key, event.currentTarget.value === "true")}>
                            <option value="true">是</option>
                            <option value="false">否</option>
                          </select>
                        )
                        : (
                          <input
                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
                            value={String(draft[field.key] ?? "")}
                            onInput={(event) => updateDraft(field.key, field.type === "number" ? Number(event.currentTarget.value || 0) : event.currentTarget.value)}
                          />
                        )}
                    </label>
                  ))}
                </div>
                <button class="save-button" type="submit" disabled={loading}>{editingId ? "儲存到 Sanity" : "建立 Sanity 文件"}</button>
              </form>
            </section>
          </>
        )}
      </main>

      {/* 刪除確認彈窗 */}
      {deleteAllModal && (
        <div class="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteAllModal(false); }}>
          <div class="modal-box">
            <h3 class="modal-title">⚠️ 確認批次刪除</h3>
            <p class="modal-desc">
              即將刪除 <strong>{selectedIds.size} 筆</strong>「{activeModule.label}」資料，此操作<strong>無法復原</strong>。
            </p>
            <p class="modal-hint">
              請輸入 <code>Delete {activeModule.shortLabel}</code> 確認刪除：
            </p>
            <input
              class="modal-input"
              type="text"
              placeholder={`Delete ${activeModule.shortLabel}`}
              value={deleteConfirmText}
              onInput={(e) => setDeleteConfirmText(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void confirmDeleteSelected(); }}
              autoFocus
            />
            <div class="modal-actions">
              <button type="button" class="ghost-button" onClick={() => setDeleteAllModal(false)}>取消</button>
              <button
                type="button"
                class="danger-button"
                disabled={deleteConfirmText.trim() !== `Delete ${activeModule.shortLabel}`}
                onClick={() => void confirmDeleteSelected()}
              >
                確認刪除 {selectedIds.size} 筆
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  applyDensity,
  applyTheme,
  DENSITY_STORAGE_KEY,
  emptyStateKind,
  hostLabel,
  resolveGroupLeaf,
  THEME_STORAGE_KEY,
} from "../lib/workbench.ts";

type FieldType = "text" | "number" | "date" | "datetime" | "time" | "url" | "boolean" | "textarea" | "password";

type FieldOption = {
  value: string;
  label: string;
};

type Field = {
  key: string;
  label: string;
  type?: FieldType;
  wide?: boolean;
  options?: readonly FieldOption[];
  defaultValue?: string | number | boolean;
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
const previewModuleIds = new Set(["images", "videos", "music", "documents", "podcast"]);
const imagePreviewModuleIds = new Set(["images", "food", "routine", "shoppinglist", "member"]);
const previewableModuleIds = new Set([...previewModuleIds, ...imagePreviewModuleIds]);
const previewFieldByModule: Record<string, string> = {
  food: "photo",
  routine: "photo",
  shoppinglist: "imageUrl",
  member: "img",
  images: "url",
  videos: "url",
  music: "url",
  documents: "url",
  podcast: "url",
};

const defaultSettings: SanitySettings = {
  projectId: "",
  dataset: "production",
  token: "",
  apiVersion: "v2025-02-19",
};

const commonMediaFields: Field[] = [
  { key: "assetId", label: "Sanity Asset ID" },
  { key: "filename", label: "檔名" },
  { key: "mimeType", label: "MIME 類型" },
  { key: "size", label: "大小 bytes", type: "number" },
  { key: "title", label: "標題" },
  { key: "url", label: "連結", type: "url" },
  { key: "category", label: "分類" },
  { key: "date", label: "日期", type: "date" },
  { key: "note", label: "備註", type: "textarea", wide: true },
];

const trialStatusOptions: FieldOption[] = [
  { value: "untried", label: "未試用" },
  { value: "trialing", label: "試用中" },
  { value: "tried", label: "已試用" },
  { value: "no_trial", label: "無試用" },
];

const purchaseStatusOptions: FieldOption[] = [
  { value: "not_purchased", label: "無首購" },
  { value: "purchasing", label: "首購中" },
  { value: "purchased", label: "已首購" },
  { value: "unavailable", label: "無提供首購" },
];

const currencyOptions: FieldOption[] = [
  { value: "TWD", label: "台幣 TWD" },
  { value: "USD", label: "美元 USD" },
  { value: "JPY", label: "日圓 JPY" },
  { value: "CNY", label: "人民幣 CNY" },
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
    id: "trialpurchase",
    label: "鋒兄試用／首購",
    shortLabel: "試用",
    icon: "badge",
    description: "對應 Appwrite trialpurchase：服務試用、首購價格與狀態追蹤。",
    fields: [
      { key: "name", label: "服務名稱" },
      { key: "eventDate", label: "活動日期", type: "datetime" },
      { key: "firstPurchasePrice", label: "首購價格", type: "number" },
      { key: "regularPrice", label: "原價", type: "number" },
      { key: "account", label: "帳號" },
      { key: "note", label: "備註", type: "textarea", wide: true },
      { key: "trialStatus", label: "試用狀態", options: trialStatusOptions, defaultValue: "untried" },
      { key: "purchaseStatus", label: "首購狀態", options: purchaseStatusOptions, defaultValue: "not_purchased" },
    ],
    seed: [{
      name: "範例服務",
      eventDate: "",
      firstPurchasePrice: 0,
      regularPrice: 0,
      account: "",
      note: "Appwrite trialpurchase 資料可用 CSV 遷移至此。",
      trialStatus: "untried",
      purchaseStatus: "not_purchased",
    }],
  },
  {
    id: "reinstall",
    label: "鋒兄重灌",
    shortLabel: "重灌",
    icon: "laptop",
    description: "對應 Appwrite reinstall：重灌清單、授權、訂閱軟體與安裝網址。",
    fields: [
      { key: "name", label: "軟體名稱" },
      { key: "category", label: "分類" },
      { key: "system", label: "系統", options: [{ value: "win", label: "Windows" }, { value: "mac", label: "Mac" }], defaultValue: "win" },
      { key: "softwareType", label: "軟體類型", options: [{ value: "trial", label: "試用軟體" }, { value: "free", label: "免費軟體" }, { value: "paid", label: "付費軟體" }], defaultValue: "free" },
      { key: "licenseType", label: "授權方式", options: [{ value: "none", label: "無序號" }, { value: "paid_serial", label: "付費序號" }], defaultValue: "none" },
      { key: "serial", label: "序號", type: "password", wide: true },
      { key: "viewPassword", label: "檢視密碼", type: "password" },
      { key: "subscriptionSoftware", label: "訂閱制軟體", type: "boolean", defaultValue: false },
      { key: "subscriptionPeriod", label: "訂閱週期" },
      { key: "subscriptionPrice", label: "訂閱價格", type: "number" },
      { key: "subscriptionCurrency", label: "訂閱幣別", options: currencyOptions, defaultValue: "TWD" },
      { key: "site", label: "軟體網站", type: "url" },
      { key: "note", label: "備註", type: "textarea", wide: true },
    ],
    seed: [{
      name: "範例工具",
      category: "系統",
      system: "win",
      softwareType: "free",
      licenseType: "none",
      serial: "",
      viewPassword: "",
      subscriptionSoftware: false,
      subscriptionPeriod: "",
      subscriptionPrice: 0,
      subscriptionCurrency: "TWD",
      site: "",
      note: "重灌後要安裝的工具。",
    }],
  },
  {
    id: "quota",
    label: "鋒兄額度",
    shortLabel: "額度",
    icon: "gauge",
    description: "對應 Appwrite quota：服務額度、AI 使用比例與到期時間。同步憑證不會回傳到瀏覽器。",
    fields: [
      { key: "name", label: "服務名稱" },
      { key: "serviceType", label: "服務類型", options: [{ value: "general", label: "一般" }, { value: "ai", label: "AI 服務" }], defaultValue: "general" },
      { key: "account", label: "帳號" },
      { key: "quotaRemaining", label: "剩餘額度", type: "number" },
      { key: "quotaPoints", label: "剩餘點數", type: "number" },
      { key: "litmediaAccount", label: "LitMedia 帳號" },
      { key: "pointsSyncedAt", label: "點數同步時間", type: "datetime" },
      { key: "quotaRatio", label: "額度剩餘比例", type: "number" },
      { key: "quotaExpiry", label: "額度到期", type: "datetime" },
      { key: "usageSyncedAt", label: "用量同步時間", type: "datetime" },
      { key: "ratio5h", label: "5 小時比例", type: "number" },
      { key: "expiry5h", label: "5 小時到期", type: "time" },
      { key: "ratioWeek", label: "一週比例", type: "number" },
      { key: "expiryWeek", label: "一週到期", type: "date" },
      { key: "ratioMonth", label: "一月比例", type: "number" },
      { key: "expiryMonth", label: "一月到期", type: "date" },
      { key: "resetCreditsBalance", label: "重置額度", type: "number" },
      { key: "resetCreditsExpiry", label: "重置額度到期" },
      { key: "note", label: "備註", type: "textarea", wide: true },
    ],
    seed: [{
      name: "範例 AI 服務",
      serviceType: "ai",
      account: "",
      quotaRemaining: 0,
      quotaPoints: 0,
      litmediaAccount: "",
      pointsSyncedAt: "",
      quotaRatio: 0,
      quotaExpiry: "",
      usageSyncedAt: "",
      ratio5h: 0,
      expiry5h: "",
      ratioWeek: 0,
      expiryWeek: "",
      ratioMonth: 0,
      expiryMonth: "",
      resetCreditsBalance: 0,
      resetCreditsExpiry: "",
      note: "額度資料可從 Appwrite quota CSV 匯入。",
    }],
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
    id: "shoppinglist",
    label: "鋒兄購物清單",
    shortLabel: "購物",
    icon: "cart",
    description: "對應 Appwrite shoppinglist：預定購買日、數量、店家、取貨方式與商品圖片。",
    fields: [
      { key: "name", label: "商品名稱" },
      { key: "plannedDate", label: "預定購買日", type: "datetime" },
      { key: "price", label: "預定價格", type: "number" },
      { key: "currency", label: "幣別", options: currencyOptions, defaultValue: "TWD" },
      { key: "quantity", label: "數量", type: "number", defaultValue: 1 },
      { key: "shop", label: "預定商店" },
      { key: "pickupMethod", label: "取貨方式", options: [
        { value: "門市購買", label: "門市購買" },
        { value: "超商取貨付款", label: "超商取貨付款" },
        { value: "蝦皮取貨付款", label: "蝦皮取貨付款" },
        { value: "宅配/郵寄", label: "宅配／郵寄" },
        { value: "超商取貨", label: "超商取貨" },
        { value: "蝦皮取貨", label: "蝦皮取貨" },
        { value: "門市取貨", label: "門市取貨" },
      ] },
      { key: "imageUrl", label: "商品圖片", type: "url", wide: true },
      { key: "account", label: "帳號" },
      { key: "note", label: "備註", type: "textarea", wide: true },
    ],
    seed: [{
      name: "範例商品",
      plannedDate: "",
      price: 0,
      currency: "TWD",
      quantity: 1,
      shop: "",
      pickupMethod: "",
      imageUrl: "",
      account: "",
      note: "Appwrite shoppinglist 資料可用 CSV 遷移至此。",
    }],
  },
  {
    id: "notes",
    label: "鋒兄筆記",
    shortLabel: "筆記",
    icon: "note",
    description: "口袋冊：店名、價格、短句。表格住 Sanity，這一頁不當知識庫。",
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
      { key: "file2", label: "檔案 2", type: "url" },
      { key: "file2name", label: "檔名 2" },
      { key: "file2type", label: "檔案類型 2" },
      { key: "file3", label: "檔案 3", type: "url" },
      { key: "file3name", label: "檔名 3" },
      { key: "file3type", label: "檔案類型 3" },
      { key: "image", label: "舊 Studio 圖片", type: "url" },
      { key: "video", label: "舊 Studio 影片", type: "url" },
      { key: "pdf", label: "舊 Studio PDF", type: "url" },
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
  {
    id: "mail",
    label: "鋒兄郵件",
    shortLabel: "郵件",
    icon: "mail",
    description: "相容 sanitygoldshoot0720 的 mail 文件：主機、地址、帳號與登入網址。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "host", label: "主機" },
      { key: "address", label: "地址" },
      { key: "account", label: "帳號" },
      { key: "url", label: "網址", type: "url" },
    ],
    seed: [{ name: "範例郵件", host: "", address: "", account: "", url: "" }],
  },
  {
    id: "experience",
    label: "鋒兄經歷",
    shortLabel: "經歷",
    icon: "briefcase",
    description: "相容 sanitygoldshoot0720 的 experience 文件：年份、單位與網站。",
    fields: [
      { key: "title", label: "標題" },
      { key: "year", label: "年份", type: "number" },
      { key: "gov", label: "單位" },
      { key: "site", label: "網站", type: "url" },
    ],
    seed: [{ title: "範例經歷", year: 2026, gov: "", site: "" }],
  },
  {
    id: "member",
    label: "鋒兄成員",
    shortLabel: "成員",
    icon: "users",
    description: "相容 sanitygoldshoot0720 的 member 文件：關係、單位、網站與頭像。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "title", label: "職稱" },
      { key: "relation", label: "關係" },
      { key: "gov", label: "單位" },
      { key: "site", label: "網站", type: "url" },
      { key: "img", label: "頭像", type: "url", wide: true },
    ],
    seed: [{ name: "範例成員", title: "", relation: "", gov: "", site: "", img: "" }],
  },
  {
    id: "cloud",
    label: "鋒兄雲端",
    shortLabel: "雲端",
    icon: "cloud",
    description: "相容 sanitygoldshoot0720 的 cloud 文件：雲端服務、帳號與容量。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "site", label: "網站", type: "url" },
      { key: "account", label: "帳號" },
      { key: "space", label: "容量", type: "number" },
    ],
    seed: [{ name: "範例雲端", site: "", account: "", space: "" }],
  },
  {
    id: "host",
    label: "鋒兄主機",
    shortLabel: "主機",
    icon: "server",
    description: "相容 sanitygoldshoot0720 的 host 文件：主機服務、網址與帳號。",
    fields: [
      { key: "name", label: "名稱" },
      { key: "site", label: "網站", type: "url" },
      { key: "account", label: "帳號" },
    ],
    seed: [{ name: "範例主機", site: "", account: "" }],
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
      { name: "鋒兄Tube", kind: "fengbro-tube", url: "https://www.youtube.com/", query: "jilixiaoshimei", note: "頻道更新整理。" },
      { name: "鋒兄金融", kind: "fengbro-finance", url: "https://finance.yahoo.com/", query: "TWII, USD/TWD, BTC", note: "金融指標與估值追蹤。" },
    ],
  },
  {
    id: "settings",
    label: "鋒兄設定",
    shortLabel: "設定",
    icon: "settings",
    description: "本機鑰匙櫃：專案號、冊頁、寫入令牌只掛在這台瀏覽器。表格仍住 Sanity。",
    fields: [
      { key: "projectId", label: "SANITY_PROJECT_ID" },
      { key: "dataset", label: "SANITY_DATASET" },
      { key: "token", label: "SANITY_API_TOKEN", type: "password", wide: true },
      { key: "apiVersion", label: "SANITY_API_VERSION" },
    ],
    seed: [],
  },
  {
    id: "about",
    label: "鋒兄關於",
    shortLabel: "關於",
    icon: "info",
    description: "工作台邊註與版本備忘。Sanity document type: fengbro_about；瀏覽器不保存表格。",
    fields: [
      { key: "name", label: "標題" },
      { key: "value", label: "內容", type: "textarea", wide: true },
    ],
    seed: [
      { name: "鋒兄 AI Fresh", value: "Deno Fresh 冊頁台。表格住在 Sanity，瀏覽器只保管連線鑰匙。" },
    ],
  },
];

const moduleById = Object.fromEntries(modules.map((module) => [module.id, module]));
const mediaUploadModules: Record<string, { accept: string; label: string }> = {
  food: { accept: "image/*", label: "上傳食品照片" },
  images: { accept: "image/*", label: "上傳圖片" },
  videos: { accept: "video/*", label: "上傳影片" },
  music: { accept: "audio/*", label: "上傳音樂" },
  documents: { accept: "*/*", label: "上傳文件" },
  podcast: { accept: "audio/*", label: "上傳播客" },
  routine: { accept: "image/*", label: "上傳例行照片" },
};

/** 表格欄位依型別上 class，讓寬度／對齊／換行規則寫在 CSS 而不是散在 JSX。 */
function columnClass(field: Field): string {
  if (field.type === "url") return "url-cell col-url";
  if (field.type === "date") return "col-date";
  if (field.type === "number") return "col-number";
  if (field.type === "boolean") return "col-boolean";
  if (field.type === "textarea") return "col-note";
  return "col-text";
}

function createEmptyRow(module: Module): Row {
  return Object.fromEntries(module.fields.map((field) => {
    if (field.defaultValue !== undefined) return [field.key, field.defaultValue];
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

  if (quoted) throw new Error("CSV 的引號沒有成對結束");
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

const csvFieldAliases: Record<string, Record<string, string>> = {
  notes: { date: "newDate" },
  common: { url: "site01", note: "note01" },
  bank: { balance: "deposit" },
  routine: { title: "name", description: "note" },
};

function resolveCsvField(header: string, module: Module): Field | undefined {
  const normalized = header.trim().toLowerCase();
  const alias = csvFieldAliases[module.id]?.[normalized] || normalized;
  return module.fields.find((field) => field.key.toLowerCase() === alias || field.label.toLowerCase() === normalized);
}

function castValue(value: string, field: Field | undefined, rowNumber: number): string | number | boolean {
  const trimmed = value.trim();
  if (field?.type === "number") {
    if (!trimmed) return 0;
    const numeric = Number(trimmed.replaceAll(",", ""));
    if (!Number.isFinite(numeric)) throw new Error(`CSV 第 ${rowNumber} 列「${field.label}」必須是數字`);
    return numeric;
  }
  if (field?.type === "boolean") {
    const normalized = trimmed.toLowerCase();
    if (["true", "1", "yes", "y", "續訂", "是"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "不續訂", "否"].includes(normalized)) return false;
    if (!normalized) return true;
    throw new Error(`CSV 第 ${rowNumber} 列「${field.label}」必須是 是/否 或 true/false`);
  }
  return value;
}

function rowsFromCsv(text: string, module: Module): Row[] {
  const csvRows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (csvRows.length === 0) return [];
  const fields = csvRows[0].map((header) => resolveCsvField(header, module));
  if (!fields.some(Boolean)) {
    throw new Error(`CSV 找不到「${module.shortLabel}」可辨識的欄名；請使用匯出檔或欄位鍵名。`);
  }
  const duplicates = fields.filter(Boolean).filter((field, index, values) =>
    values.findIndex((candidate) => candidate?.key === field?.key) !== index
  );
  if (duplicates.length > 0) {
    throw new Error(`CSV 欄名重複：${duplicates.map((field) => field?.label).join("、")}`);
  }
  return csvRows.slice(1).map((values, index) => {
    const row: Row = createEmptyRow(module);
    fields.forEach((field, column) => {
      if (!field) return;
      row[field.key] = castValue(values[column] ?? "", field, index + 2);
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

/** datetime-local 不接受 Z / +08:00；顯示時轉成本機可編輯的格式。 */
function toDateTimeLocalValue(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 16);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function getUrlExtension(url: string) {
  try {
    return new URL(url, globalThis.location?.origin || "http://localhost").pathname.split(".").pop()?.toLowerCase() || "";
  } catch {
    return url.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() || "";
  }
}

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const videoId = host === "youtu.be"
      ? parsed.pathname.split("/").filter(Boolean)[0]
      : host.endsWith("youtube.com")
      ? parsed.searchParams.get("v") || parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1]
      : "";
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
}

/** Only the media field for a module gets an inline preview; normal website links stay links. */
function isPreviewField(moduleId: string, fieldKey: string) {
  return previewFieldByModule[moduleId] === fieldKey;
}

function moduleMediaUrl(moduleId: string, row: Row) {
  const field = previewFieldByModule[moduleId];
  return field ? String(row[field] || "") : "";
}

function MediaPreview(
  { moduleId, url, compact = false, onExpand }:
    { moduleId: string; url: string; compact?: boolean; onExpand?: (url: string) => void },
) {
  const source = url.trim();
  if (!source || !previewableModuleIds.has(moduleId)) return null;

  const ext = getUrlExtension(source);
  const isAudio = ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext);
  const isVideo = ["mp4", "webm", "ogv", "mov", "m4v"].includes(ext);
  const isPdf = ext === "pdf";
  const youtubeEmbed = getYouTubeEmbedUrl(source);

  if (imagePreviewModuleIds.has(moduleId)) {
    return (
      <a class={compact ? "media-preview compact" : "media-preview"} href={source} target="_blank" rel="noreferrer">
        <img src={source} alt="" loading="lazy" />
      </a>
    );
  }

  if (moduleId === "videos") {
    if (youtubeEmbed) {
      return (
        <div class={compact ? "media-preview video compact" : "media-preview video"}>
          <iframe src={youtubeEmbed} title="影片預覽" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        </div>
      );
    }
    if (isVideo) {
      return <video class={compact ? "media-preview compact" : "media-preview"} src={source} controls preload="metadata" />;
    }
  }

  if (moduleId === "music" || moduleId === "podcast" || isAudio) {
    return <audio class={compact ? "media-audio compact" : "media-audio"} src={source} controls preload="metadata" />;
  }

  if (moduleId === "documents") {
    if (isPdf) {
      const previewClass = compact ? "media-preview document compact" : "media-preview document";
      if (compact && onExpand) {
        return (
          <button
            type="button"
            class={`${previewClass} preview-trigger`}
            onClick={() => onExpand(source)}
            aria-label="全寬展開文件預覽"
            title="點一下全寬展開"
          >
            <iframe src={source} title="文件預覽" loading="lazy" />
            <span class="preview-trigger-badge">點一下全寬展開</span>
          </button>
        );
      }
      return (
        <div class={previewClass}>
          <iframe src={source} title="文件預覽" loading="lazy" />
        </div>
      );
    }
    return (
      <a class="document-link" href={source} target="_blank" rel="noreferrer">
        開啟文件預覽
      </a>
    );
  }

  return (
    <a class="document-link" href={source} target="_blank" rel="noreferrer">
      開啟媒體
    </a>
  );
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
    badge: "M12 2l2.4 2.4 3.4-.4.8 3.3 2.9 1.8-1.8 2.9.4 3.4-3.3.8L12 22l-2.4-2.4-3.4.4-.8-3.3-2.9-1.8 1.8-2.9-.4-3.4 3.3-.8L12 2zM9 12l2 2 4-4",
    laptop: "M5 4h14v11H5zM2 18h20M9 21h6",
    gauge: "M4 15a8 8 0 1 1 16 0M12 12l4-4M12 12v.01M4 20h16",
    cart: "M3 4h2l2.2 10h10.6l2-7H7M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    mail: "M4 5h16v14H4zM4 7l8 6 8-6",
    briefcase: "M4 8h16v12H4zM8 8V5h8v3M4 13h16M10 13v2h4v-2",
    users: "M16 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 20v-2a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75",
    cloud: "M6 18a4 4 0 1 1 1.3-7.78A6 6 0 0 1 19 12a3 3 0 0 1-1 5.83V18z",
    server: "M4 4h16v6H4zM4 14h16v6H4zM7 7h.01M7 17h.01M11 7h6M11 17h6",
    phone: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
    play: "M8 5v14l11-7z",
    chart: "M4 19V5M4 19h16M8 16l3-5 4 3 5-8",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12H2M22 12h-2M12 4V2M12 22v-2M5 5l-1.5-1.5M20.5 20.5L19 19M19 5l1.5-1.5M3.5 20.5L5 19",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 10v7M12 7h.01",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    moon: "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    close: "M6 6l12 12M18 6L6 18",
    layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    hide: "M3 3l18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M6.1 6.1C4 7.6 2.5 9.6 2 12c0 0 4 7 10 7 1.8 0 3.4-.5 4.8-1.3M17.9 17.9C20 16.4 21.5 14.4 22 12c0 0-4-7-10-7-1.2 0-2.3.2-3.3.6",
    rows: "M4 6h16M4 10h16M4 14h16M4 18h16",
    spread: "M4 5h16v5H4zM4 14h16v5H4z",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] ?? paths.note} />
    </svg>
  );
}

const toolTabs = [
  { id: "price", label: "鋒兄比價", icon: "tool" },
  { id: "phone", label: "手機比價", icon: "phone" },
  { id: "tube", label: "鋒兄Tube", icon: "play" },
  { id: "finance", label: "鋒兄金融", icon: "chart" },
] as const;

type ToolTabId = typeof toolTabs[number]["id"];

type NavLeaf = {
  key: string;
  label: string;
  short: string;
  icon: string;
  moduleId: string;
  toolId?: ToolTabId;
};

type NavGroup = {
  id: string;
  label: string;
  short: string;
  icon: string;
  children: NavLeaf[];
};

function moduleLeaf(id: string): NavLeaf {
  const target = moduleById[id];
  return {
    key: id,
    label: target.shortLabel,
    short: target.shortLabel,
    icon: target.icon,
    moduleId: id,
  };
}

const navGroups: NavGroup[] = [
  {
    id: "manage",
    label: "鋒兄管理",
    short: "管理",
    icon: "box",
    children: [
      "subscription",
      "trialpurchase",
      "reinstall",
      "quota",
      "food",
      "shoppinglist",
      "notes",
      "common",
      "mail",
      "bank",
      "routine",
      "cloud",
      "host",
      "experience",
      "member",
    ].map(moduleLeaf),
  },
  {
    id: "media",
    label: "鋒兄影音",
    short: "影音",
    icon: "layers",
    children: ["images", "videos", "music", "documents", "podcast"].map(moduleLeaf),
  },
  {
    id: "tools",
    label: "鋒兄工具",
    short: "工具",
    icon: "tool",
    children: toolTabs.map((tab) => ({
      key: `tool:${tab.id}`,
      label: tab.label,
      short: tab.label.replace(/^鋒兄/, ""),
      icon: tab.icon,
      moduleId: "tools",
      toolId: tab.id,
    })),
  },
  {
    id: "system",
    label: "鋒兄設定",
    short: "設定",
    icon: "settings",
    children: ["settings", "about"].map(moduleLeaf),
  },
];

const navLeaves = navGroups.flatMap((group) => group.children);
const dockLeaves = ["subscription", "food", "notes", "tool:price"]
  .map((id) => navLeaves.find((leaf) => leaf.key === id))
  .filter(Boolean) as NavLeaf[];
const themeKey = THEME_STORAGE_KEY;
const densityKey = DENSITY_STORAGE_KEY;

type DensityMode = "comfortable" | "compact";
type DiagTone = "ok" | "bad" | "mute";
type DiagRow = { label: string; value: string; tone?: DiagTone };
type DiagReport = { ok: boolean; rows: DiagRow[] };

function isHung(value: string) {
  return value.trim().length > 0;
}

type PriceResult = {
  title: string;
  url: string;
  source: string;
  currency: string;
  currentPrice: number | null;
  resolvedAt: string;
  notice?: string;
  history: Array<{ date: string; price: number | null; currency?: string }>;
};

type MobileProduct = {
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

type MobileResult = {
  source: string;
  query: string;
  total: number;
  fetchedAt: string;
  products: MobileProduct[];
  warnings?: string[];
  sourceUrls?: string[];
};

type TubeVideo = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  updatedAt: string;
  thumbnail: string;
  channelTitle?: string;
};

type TubeChannel = {
  sourceUrl: string;
  channelId: string;
  title: string;
  videos: TubeVideo[];
  error?: string;
};

type TubeResult = {
  fetchedAt: string;
  sourceCount: number;
  defaultSourceCount: number;
  channels: TubeChannel[];
  recentVideos: TubeVideo[];
};

type FinanceQuote = {
  id: string;
  name: string;
  displayName: string;
  symbol: string;
  sourceUrl: string;
  group: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  error?: string;
  isThresholdAlert?: boolean;
};

type FinanceResult = {
  fetchedAt: string;
  source: string;
  quotes: FinanceQuote[];
  financeAlerts: Array<{ id: string; message: string; sourceUrl: string }>;
  shillerPe: {
    current: number | null;
    recordHigh: number;
    recordHighDate: string;
    isRecordHigh: boolean;
  };
};

const defaultPriceUrl = "https://24h.pchome.com.tw/prod/DRAHCO-A900J8363";
const quickPriceLinks = [
  { title: "PChome Crucial T500 SSD", url: "https://24h.pchome.com.tw/prod/DRAHCO-A900J8363" },
  { title: "PChome WD SSD", url: "https://24h.pchome.com.tw/prod/DYALS1-A900JUGXV" },
];

const defaultTubeChannels = [
  { alias: "吉利小妹", sourceUrl: "https://www.youtube.com/@jilixiaoshimei/videos" },
];
const tubeChannelsKey = "fengbro.tools.tube.channels";

function formatMoney(value: number | null | undefined, currency = "TWD") {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("zh-TW", {
    style: currency ? "currency" : "decimal",
    currency: currency || "TWD",
    maximumFractionDigits: currency === "TWD" ? 0 : 2,
  }).format(value);
}

function formatNumber(value: number | null | undefined, digits = 2) {
  return typeof value === "number" ? value.toLocaleString("zh-TW", { maximumFractionDigits: digits }) : "-";
}

function formatDateTime(value: string) {
  if (!value) return "-";
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? value : time.toLocaleString("zh-TW", { hour12: false });
}

function groupQuotes(quotes: FinanceQuote[]) {
  return quotes.reduce<Record<string, FinanceQuote[]>>((groups, quote) => {
    groups[quote.group] = [...(groups[quote.group] || []), quote];
    return groups;
  }, {});
}

function normalizeTubeSource(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("@")) return `https://www.youtube.com/${encodeURI(trimmed)}/videos`;
  if (!/^https?:\/\//i.test(trimmed)) return `https://www.youtube.com/@${encodeURIComponent(trimmed)}/videos`;
  return trimmed.replace(/\/$/, "").replace(/\/videos$/i, "/videos");
}

function normalizeTubeChannels(input: unknown) {
  const values = Array.isArray(input) ? input : defaultTubeChannels;
  const seen = new Set<string>();
  const channels: typeof defaultTubeChannels = [];
  for (const item of values) {
    if (!item || typeof item !== "object") continue;
    const record = item as { alias?: unknown; sourceUrl?: unknown };
    const sourceUrl = typeof record.sourceUrl === "string" ? normalizeTubeSource(record.sourceUrl) : "";
    if (!sourceUrl || seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);
    channels.push({
      alias: typeof record.alias === "string" ? record.alias.trim() : "",
      sourceUrl,
    });
  }
  return channels.length ? channels : defaultTubeChannels;
}

function getSavedTubeChannels() {
  if (typeof localStorage === "undefined") return defaultTubeChannels;
  try {
    return normalizeTubeChannels(JSON.parse(localStorage.getItem(tubeChannelsKey) || "[]"));
  } catch {
    return defaultTubeChannels;
  }
}

function ToolWorkbench({
  activeTool,
  setActiveTool,
}: {
  activeTool: ToolTabId;
  setActiveTool: (id: ToolTabId) => void;
}) {
  const [productUrl, setProductUrl] = useState(defaultPriceUrl);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("iPhone 17");
  const [mobileResult, setMobileResult] = useState<MobileResult | null>(null);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [tubeResult, setTubeResult] = useState<TubeResult | null>(null);
  const [tubeLoading, setTubeLoading] = useState(false);
  const [tubeError, setTubeError] = useState("");
  const [tubeLoadedOnce, setTubeLoadedOnce] = useState(false);
  const [tubeChannels, setTubeChannels] = useState(getSavedTubeChannels);
  const [tubeAlias, setTubeAlias] = useState("");
  const [tubeUrl, setTubeUrl] = useState("");
  const [financeResult, setFinanceResult] = useState<FinanceResult | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState("");
  const [financeLoadedOnce, setFinanceLoadedOnce] = useState(false);

  const priceSummary = useMemo(() => {
    const prices = (priceResult?.history || [])
      .map((item) => item.price)
      .filter((item): item is number => typeof item === "number");
    if (!prices.length) return null;
    return {
      current: priceResult?.currentPrice ?? prices.at(-1) ?? null,
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }, [priceResult]);

  const financeGroups = useMemo(() => groupQuotes(financeResult?.quotes || []), [financeResult]);
  const headlineQuotes = useMemo(() => {
    const ids = new Set(["taiex", "tsmc", "dow", "sp500", "nasdaq", "vix", "bitcoin", "usd-twd"]);
    return (financeResult?.quotes || []).filter((quote) => ids.has(quote.id));
  }, [financeResult]);

  const runPriceCompare = async () => {
    const nextUrl = productUrl.trim();
    if (!nextUrl) {
      setPriceError("請輸入商品網址");
      return;
    }
    setPriceLoading(true);
    setPriceError("");
    try {
      const response = await fetch(`/api/tools/resolve?url=${encodeURIComponent(nextUrl)}&t=${Date.now()}`);
      const result = await response.json() as PriceResult & { error?: string };
      if (!response.ok || result.error) throw new Error(result.error || "價格查詢失敗");
      setPriceResult(result);
    } catch (error) {
      setPriceError(error instanceof Error ? error.message : "價格查詢失敗");
    } finally {
      setPriceLoading(false);
    }
  };

  const loadMobile = async (query = phoneQuery) => {
    setMobileLoading(true);
    setMobileError("");
    try {
      const response = await fetch(`/api/tools/landtop?query=${encodeURIComponent(query)}&t=${Date.now()}`);
      const result = await response.json() as MobileResult & { error?: string };
      if (!response.ok || result.error) throw new Error(result.error || "手機比價資料讀取失敗");
      setMobileResult(result);
    } catch (error) {
      setMobileError(error instanceof Error ? error.message : "手機比價資料讀取失敗");
    } finally {
      setMobileLoading(false);
    }
  };

  const loadTube = async () => {
    setTubeLoadedOnce(true);
    setTubeLoading(true);
    setTubeError("");
    try {
      const response = await fetch("/api/tools/tube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: tubeChannels }),
      });
      const result = await response.json() as TubeResult & { error?: string };
      if (!response.ok || result.error) throw new Error(result.error || "Tube 資料讀取失敗");
      setTubeResult(result);
    } catch (error) {
      setTubeError(error instanceof Error ? error.message : "Tube 資料讀取失敗");
    } finally {
      setTubeLoading(false);
    }
  };

  const loadFinance = async () => {
    setFinanceLoadedOnce(true);
    setFinanceLoading(true);
    setFinanceError("");
    try {
      const response = await fetch(`/api/tools/finance?t=${Date.now()}`);
      const result = await response.json() as FinanceResult & { error?: string };
      if (!response.ok || result.error) throw new Error(result.error || "金融資料讀取失敗");
      setFinanceResult(result);
    } catch (error) {
      setFinanceError(error instanceof Error ? error.message : "金融資料讀取失敗");
    } finally {
      setFinanceLoading(false);
    }
  };

  useEffect(() => {
    void runPriceCompare();
  }, []);

  useEffect(() => {
    if (activeTool === "phone" && !mobileResult && !mobileLoading) void loadMobile();
    if (activeTool === "tube" && !tubeLoadedOnce && !tubeLoading) void loadTube();
    if (activeTool === "finance" && !financeLoadedOnce && !financeLoading) void loadFinance();
  }, [activeTool]);

  useEffect(() => {
    try {
      localStorage.setItem(tubeChannelsKey, JSON.stringify(tubeChannels));
    } catch {
      // Storage can be unavailable in private contexts; the live API still works.
    }
  }, [tubeChannels]);

  const addTubeChannel = () => {
    const sourceUrl = normalizeTubeSource(tubeUrl);
    if (!sourceUrl) {
      setTubeError("請輸入 YouTube @handle 或頻道網址");
      return;
    }
    setTubeChannels((items) => normalizeTubeChannels([...items.filter((item) => item.sourceUrl !== sourceUrl), { alias: tubeAlias.trim(), sourceUrl }]));
    setTubeAlias("");
    setTubeUrl("");
    setTubeResult(null);
    setTubeLoadedOnce(false);
  };

  return (
    <section class="tools-workbench">
      <div class="tool-tabs" role="tablist" aria-label="鋒兄工具">
        {toolTabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTool === tab.id}
            class={activeTool === tab.id ? "tool-tab active" : "tool-tab"}
            onClick={() => setActiveTool(tab.id)}
          >
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTool === "price" && (
        <div class="tool-stack accent-amber">
          <section class="tool-card">
            <div class="tool-head">
              <span class="tool-mark"><Icon name="tool" /></span>
              <div>
                <h3>鋒兄比價</h3>
                <p>即時讀取商品來源頁或商店 API，結果不寫死在前端。</p>
              </div>
            </div>
            <div class="price-query">
              <label>
                <span>商品網址</span>
                <input value={productUrl} onInput={(event) => setProductUrl(event.currentTarget.value)} />
              </label>
              <button type="button" onClick={() => void runPriceCompare()} disabled={priceLoading}>
                {priceLoading ? "查詢中..." : "查詢即時價格"}
              </button>
            </div>
            <div class="source-grid">
              <div><strong>即時來源</strong><span>PChome/momo/商品頁 metadata</span></div>
              <div><strong>更新時間</strong><span>{priceResult ? formatDateTime(priceResult.resolvedAt) : "尚未載入"}</span></div>
            </div>
          </section>

          <section class="tool-card">
            <div class="section-title">
              <h4>快速連結</h4>
              <span>{quickPriceLinks.length} 筆</span>
            </div>
            <div class="recent-links">
              {quickPriceLinks.map((link) => (
                <button type="button" onClick={() => setProductUrl(link.url)}>
                  <strong>{link.title}</strong>
                  <span>{link.url}</span>
                </button>
              ))}
            </div>
          </section>

          <section class="tool-card price-result">
            <div class="section-title">
              <h4>比價結果</h4>
              {priceResult?.url ? <a href={priceResult.url} target="_blank" rel="noreferrer">開啟商品</a> : null}
            </div>
            {priceError ? <p class="tool-error">{priceError}</p> : null}
            {!priceResult && priceLoading ? <p class="tool-status">正在讀取即時價格...</p> : null}
            {priceResult ? (
              <>
                <p class="tool-status">{priceResult.title}｜{priceResult.source}｜{formatDateTime(priceResult.resolvedAt)}</p>
                {priceResult.notice ? <p class="tool-warning">{priceResult.notice}</p> : null}
                <div class="result-summary">
                  <div><span>目前價格</span><strong>{formatMoney(priceSummary?.current ?? priceResult.currentPrice, priceResult.currency)}</strong></div>
                  <div><span>最高</span><strong>{formatMoney(priceSummary?.high, priceResult.currency)}</strong></div>
                  <div><span>最低</span><strong>{formatMoney(priceSummary?.low, priceResult.currency)}</strong></div>
                </div>
                <div class="mini-line" aria-label="價格歷史">
                  {(priceResult.history || []).map((item, index) => {
                    const prices = priceResult.history.map((entry) => entry.price).filter((entry): entry is number => typeof entry === "number");
                    const min = prices.length ? Math.min(...prices) : 0;
                    const max = prices.length ? Math.max(...prices) : 0;
                    const left = priceResult.history.length === 1 ? 50 : (index / (priceResult.history.length - 1)) * 100;
                    const top = max === min || item.price == null ? 50 : 80 - ((item.price - min) / (max - min)) * 54;
                    return <span style={{ left: `${left}%`, top: `${top}%` }} title={`${item.date} ${item.price ?? "-"}`} />;
                  })}
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}

      {activeTool === "phone" && (
        <div class="tool-stack accent-blue">
          <section class="tool-card">
            <div class="tool-head compact-head">
              <span class="tool-mark blue"><Icon name="phone" /></span>
              <div>
                <h3>手機比價</h3>
                <p>即時彙整地標網通與傑昇通信搜尋結果。</p>
              </div>
            </div>
            <div class="phone-search-grid">
              <div class="phone-search-card">
                <div class="card-row">
                  <strong>搜尋手機</strong>
                  <button type="button" onClick={() => void loadMobile()} disabled={mobileLoading}>
                    {mobileLoading ? "搜尋中..." : "搜尋"}
                  </button>
                </div>
                <div class="inline-form">
                  <input value={phoneQuery} onInput={(event) => setPhoneQuery(event.currentTarget.value)} />
                  <button type="button" onClick={() => void loadMobile("iPhone 17")}>iPhone 17</button>
                  <button type="button" class="soft" onClick={() => void loadMobile("Samsung")}>Samsung</button>
                </div>
              </div>
            </div>
          </section>

          <section class="tool-card phone-chart">
            <div class="section-title">
              <div>
                <small>LIVE PHONE COMPARE</small>
                <h4>即時手機比價</h4>
                <p>{mobileResult ? `${mobileResult.source}｜${formatDateTime(mobileResult.fetchedAt)}｜${mobileResult.total} 筆` : "尚未載入資料"}</p>
              </div>
              <Icon name="chart" />
            </div>
            {mobileError ? <p class="tool-error">{mobileError}</p> : null}
            {mobileResult?.warnings?.map((warning) => <p class="tool-warning">{warning}</p>)}
            {(mobileResult?.products || []).slice(0, 8).map((row) => (
              <div class="bar-row">
                <div><strong>{row.name}</strong><span>{row.brand}</span></div>
                <div class="bars">
                  <span class="base" style={{ width: `${Math.min(100, Math.round(((row.suggestedPrice || row.bestPrice || 1) / 50000) * 100))}%` }} />
                  <span class="current" style={{ width: `${Math.min(100, Math.round(((row.bestPrice || row.landtopPrice || row.jyesPrice || 1) / 50000) * 100))}%` }} />
                </div>
                <strong>{formatMoney(row.bestPrice ?? row.landtopPrice ?? row.jyesPrice, "TWD")}</strong>
              </div>
            ))}
          </section>

          <section class="tool-card product-grid">
            {(mobileResult?.products || []).slice(0, 12).map((row) => (
              <article>
                <small>{row.bestSourceLabel || row.brand}</small>
                <h4>{row.name}</h4>
                <div class="price-pills">
                  <span>建議 {formatMoney(row.suggestedPrice, "TWD")}</span>
                  <span>地標 {row.landtopPriceLabel || "-"}</span>
                  <span>傑昇 {row.jyesPriceLabel || "-"}</span>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}

      {activeTool === "tube" && (
        <div class="tool-stack accent-red">
          <section class="tool-card tube-hero">
            <div class="tool-head">
              <span class="tool-mark red"><Icon name="play" /></span>
              <div>
                <small>FENGBRO TUBE</small>
                <h3>鋒兄Tube</h3>
                <p>從 YouTube 頻道頁與 RSS feed 即時讀取更新。</p>
              </div>
            </div>
            <div class="tube-actions">
              <span>更新：{tubeResult ? formatDateTime(tubeResult.fetchedAt) : "尚未載入"}</span>
              <button type="button" onClick={() => void loadTube()} disabled={tubeLoading}>{tubeLoading ? "讀取中..." : "重新整理"}</button>
            </div>
          </section>

          <section class="tool-card">
            <div class="tube-manager">
              <input value={tubeAlias} onInput={(event) => setTubeAlias(event.currentTarget.value)} placeholder="頻道別名" />
              <input value={tubeUrl} onInput={(event) => setTubeUrl(event.currentTarget.value)} placeholder="@handle 或 YouTube 頻道網址" />
              <button type="button" onClick={addTubeChannel}>加入頻道</button>
              <button type="button" class="soft" onClick={() => {
                setTubeChannels(defaultTubeChannels);
                setTubeResult(null);
                setTubeLoadedOnce(false);
              }}>恢復預設</button>
            </div>
            {tubeError ? <p class="tool-error">{tubeError}</p> : null}
            <div class="tube-list">
              {tubeChannels.map((channel) => (
                <article>
                  <strong>{channel.alias || channel.sourceUrl}</strong>
                  <span>{channel.sourceUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTubeChannels((items) => normalizeTubeChannels(items.filter((item) => item.sourceUrl !== channel.sourceUrl)));
                      setTubeResult(null);
                      setTubeLoadedOnce(false);
                    }}
                  >
                    移除
                  </button>
                </article>
              ))}
            </div>
          </section>

          {tubeResult?.recentVideos?.length ? (
            <section class="tool-card tube-channel-section">
              <div class="section-title">
                <h4>三天內新片：{tubeResult.recentVideos.length} 部</h4>
                <span>{tubeResult.sourceCount} 個頻道</span>
              </div>
              <div class="tube-channel-grid">
                {tubeResult.recentVideos.slice(0, 12).map((video) => (
                  <a href={video.url} target="_blank" rel="noreferrer">
                    {video.thumbnail ? <img src={video.thumbnail} alt="" loading="lazy" /> : null}
                    <div>
                      <strong>{video.title}</strong>
                      <span>{video.channelTitle} / {formatDateTime(video.publishedAt)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {tubeResult?.channels?.map((channel) => (
            <section class="tool-card tube-channel-section">
              <div class="section-title">
                <div>
                  <h4>{channel.title}</h4>
                  <a href={channel.sourceUrl} target="_blank" rel="noreferrer">開啟頻道</a>
                </div>
                <span>{channel.error || `${channel.videos.length} 部影片`}</span>
              </div>
              <div class="tube-list">
                {channel.videos.slice(0, 6).map((video) => (
                  <article>
                    <strong>{video.title}</strong>
                    <span>{formatDateTime(video.publishedAt)}</span>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {activeTool === "finance" && (
        <div class="tool-stack accent-green">
          <section class="tool-card finance-hero">
            <div class="tool-head">
              <span class="tool-mark green"><Icon name="chart" /></span>
              <div>
                <small>GLOBAL MARKET</small>
                <h3>鋒兄金融</h3>
                <p>即時讀取 CNBC、Yahoo Finance、Multpl 行情。</p>
              </div>
            </div>
            <div class="finance-kpi">
              <span>資料源：{financeResult?.source || "尚未載入"}</span>
              <span>更新：{financeResult ? formatDateTime(financeResult.fetchedAt) : "-"}</span>
              <button type="button" onClick={() => void loadFinance()} disabled={financeLoading}>{financeLoading ? "更新中..." : "更新行情"}</button>
            </div>
          </section>

          {financeError ? <p class="tool-error">{financeError}</p> : null}
          {financeResult?.financeAlerts?.map((alert) => (
            <a class="tool-warning" href={alert.sourceUrl} target="_blank" rel="noreferrer">{alert.message}</a>
          ))}

          {headlineQuotes.length ? (
            <section class="tool-card finance-section">
              <div class="section-title">
                <h4>重點行情</h4>
                <span>{headlineQuotes.length} 筆</span>
              </div>
              <div class="finance-grid">
                {headlineQuotes.map((quote) => (
                  <a href={quote.sourceUrl} target="_blank" rel="noreferrer">
                    <div class="card-row">
                      <strong>{quote.name}</strong>
                      <span class={(quote.changePercent || 0) >= 0 ? "trend up" : "trend down"}>{quote.changePercent == null ? "-" : `${quote.changePercent.toFixed(2)}%`}</span>
                    </div>
                    <b>{formatNumber(quote.price, quote.group === "fx" ? 3 : 2)} {quote.currency}</b>
                    <div class="spark">
                      <span style={{ width: `${Math.min(92, Math.max(22, 58 + (quote.changePercent || 0) * 4))}%` }} />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {Object.entries(financeGroups).map(([group, quotes]) => (
            <section class="tool-card finance-section">
              <div class="section-title">
                <h4>{group.toUpperCase()}</h4>
                <span>{quotes.length} 筆</span>
              </div>
              <div class="finance-grid">
                {quotes.map((quote) => (
                  <a href={quote.sourceUrl} target="_blank" rel="noreferrer">
                    <div class="card-row">
                      <strong>{quote.name}</strong>
                      <span class={(quote.changePercent || 0) >= 0 ? "trend up" : "trend down"}>{quote.error || (quote.changePercent == null ? "-" : `${quote.changePercent.toFixed(2)}%`)}</span>
                    </div>
                    <b>{formatNumber(quote.price, group === "fx" ? 3 : 2)} {quote.currency}</b>
                    <div class="spark">
                      <span style={{ width: `${Math.min(92, Math.max(22, 58 + (quote.changePercent || 0) * 4))}%` }} />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function AboutDesk({
  rows,
  draft,
  editingId,
  loading,
  message,
  theme,
  moduleCount,
  onDraft,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  onReload,
  onSeed,
}: {
  rows: Row[];
  draft: Row;
  editingId: string | null;
  loading: boolean;
  message: string;
  theme: "light" | "dark";
  moduleCount: number;
  onDraft: (key: string, value: string | number | boolean) => void;
  onSave: () => void;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
  onCancel: () => void;
  onReload: () => void;
  onSeed: () => void;
}) {
  return (
    <section class="about-desk" aria-label="鋒兄誌">
      <article class="about-mast">
        <div class="about-mast-copy">
          <span class="about-seal" aria-hidden="true"><Icon name="info" /></span>
          <div>
            <p class="crumb">誌</p>
            <h3>鋒兄誌</h3>
            <p>這份工作台的邊註，不是行銷頁。表格住在 Sanity Content Lake；瀏覽器只保管連線鑰匙。</p>
          </div>
        </div>
        <ul class="about-facts">
          <li><b>骨架</b><strong>Deno Fresh</strong></li>
          <li><b>冊頁</b><strong>Sanity</strong></li>
          <li><b>光線</b><strong>{theme === "dark" ? "暗場" : "明場"}</strong></li>
          <li><b>葉片</b><strong>{moduleCount} 模組</strong></li>
        </ul>
      </article>

      <div class="about-split">
        <div class="about-ledger">
          <div class="about-ledger-head">
            <div>
              <p class="crumb">紙箋</p>
              <h4>邊註 {rows.length} 則</h4>
            </div>
            <button type="button" class="ghost-button compact" onClick={onReload} disabled={loading}>
              {loading ? "讀取中..." : "重新載入"}
            </button>
          </div>
          <p class="about-status">{loading ? "正在翻頁..." : message}</p>
          {rows.length === 0 ? (
            <div class="about-empty">
              <strong>還沒有邊註</strong>
              <span>右側紙墊可以寫第一則。這頁本來就該短，不必做成資料表。</span>
              <button type="button" class="ghost-button" onClick={onSeed} disabled={loading}>寫入範例邊註</button>
            </div>
          ) : (
            <div class="about-slips">
              {rows.map((row) => (
                <article class={String(row.id) === editingId ? "about-slip editing" : "about-slip"}>
                  <header>
                    <strong>{String(row.name || "未命名")}</strong>
                    <div class="about-slip-actions">
                      <button type="button" onClick={() => onEdit(row)}>改寫</button>
                      <button type="button" class="danger" onClick={() => onDelete(row)}>抽掉</button>
                    </div>
                  </header>
                  <p>{String(row.value ?? "")}</p>
                </article>
              ))}
            </div>
          )}
        </div>

        <form
          class="about-blotter"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div class="about-blotter-head">
            <div>
              <p class="crumb">{editingId ? "改寫中" : "新紙"}</p>
              <h4>{editingId ? "改一則邊註" : "寫一則邊註"}</h4>
            </div>
            {editingId ? (
              <button type="button" class="ghost-button compact" onClick={onCancel}>放下</button>
            ) : null}
          </div>
          <label class="field">
            <span>標題</span>
            <input
              value={String(draft.name ?? "")}
              onInput={(event) => onDraft("name", event.currentTarget.value)}
              placeholder="例如：資料落點"
            />
          </label>
          <label class="field wide">
            <span>內容</span>
            <textarea
              value={String(draft.value ?? "")}
              onInput={(event) => onDraft("value", event.currentTarget.value)}
              placeholder="短句即可。這不是文件庫。"
            />
          </label>
          <button class="save-button" type="submit" disabled={loading}>
            {editingId ? "覆寫到 Sanity" : "釘到 Sanity"}
          </button>
        </form>
      </div>
    </section>
  );
}

function formatBytes(value: string | number | boolean | undefined) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function mediaKind(moduleId: string) {
  if (moduleId === "images") return "frame";
  if (moduleId === "videos") return "reel";
  if (moduleId === "documents") return "folio";
  return "playbill";
}

function MediaWall({
  moduleId,
  shortLabel,
  rows,
  filteredRows,
  query,
  selectedIds,
  editingId,
  loading,
  message,
  onQuery,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  onDeleteSelected,
  onExpand,
  onSeed,
}: {
  moduleId: string;
  shortLabel: string;
  rows: Row[];
  filteredRows: Row[];
  query: string;
  selectedIds: Set<string>;
  editingId: string | null;
  loading: boolean;
  message: string;
  onQuery: (value: string) => void;
  onEdit: (row: Row) => void;
  onDuplicate: (row: Row) => void;
  onDelete: (row: Row) => void;
  onToggle: (id: string) => void;
  onDeleteSelected: () => void;
  onExpand?: (url: string) => void;
  onSeed: () => void;
}) {
  const kind = mediaKind(moduleId);
  const emptyKind = emptyStateKind({ totalRows: rows.length, query });
  const emptyTitle = moduleId === "images"
    ? "還沒有貼上圖頁"
    : moduleId === "videos"
    ? "卷軸是空的"
    : moduleId === "documents"
    ? "夾層裡沒有冊頁"
    : moduleId === "podcast"
    ? "還沒有節目"
    : "還沒有曲目";
  const emptyHint = "右側壓印可以把第一筆釘到 Sanity。空著的時候不必先攤資料表。";

  return (
    <div class={`atelier-wall kind-${kind}`}>
      <div class="panel-toolbar">
        <div>
          <h3>{shortLabel}牆</h3>
          <p>
            {filteredRows.length} / {rows.length} 件
            {selectedIds.size > 0 && <span class="selected-badge">　已選 {selectedIds.size} 筆</span>}
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          {selectedIds.size > 0 && (
            <button type="button" class="danger-button" onClick={onDeleteSelected}>
              抽掉已選 ({selectedIds.size})
            </button>
          )}
          <label class="search-box">
            <span>搜尋</span>
            <input value={query} onInput={(event) => onQuery(event.currentTarget.value)} placeholder="標題、分類、檔名..." />
          </label>
        </div>
      </div>
      <p class="atelier-status">{loading ? "正在翻頁..." : message}</p>
      {filteredRows.length === 0 && emptyKind === "no-rows" ? (
        <div class="ledger-blank empty-no-rows">
          <strong>{emptyTitle}</strong>
          <span>{emptyHint}</span>
          <button type="button" class="ghost-button" onClick={onSeed} disabled={loading}>寫入範例</button>
        </div>
      ) : filteredRows.length === 0 ? (
        <div class="ledger-blank empty-no-search-hits">
          <strong>這一牆被搜尋濾空了</strong>
          <span>換個詞，或清掉搜尋欄。</span>
        </div>
      ) : (
        <div class={`atelier-grid kind-${kind}`}>
          {filteredRows.map((row) => {
            const id = String(row.id);
            const title = String(row.title || row.filename || "未命名");
            const url = String(row.url || "");
            const checked = selectedIds.has(id);
            const editing = id === editingId;
            const meta = [
              String(row.category || "").trim(),
              row.date ? String(row.date) : "",
              formatBytes(row.size),
            ].filter(Boolean).join(" · ");
            return (
              <article key={id} class={`atelier-card${editing ? " editing" : ""}${checked ? " picked" : ""}`}>
                <div class="atelier-stage">
                  {url
                    ? (
                      <MediaPreview
                        moduleId={moduleId}
                        url={url}
                        compact
                        onExpand={moduleId === "documents" ? onExpand : undefined}
                      />
                    )
                    : <div class="atelier-missing">沒有連結</div>}
                </div>
                <header>
                  <label class="atelier-pick">
                    <input type="checkbox" checked={checked} onChange={() => onToggle(id)} />
                    <strong>{title}</strong>
                  </label>
                  {meta ? <span class="atelier-meta">{meta}</span> : null}
                </header>
                {row.note ? <p class="atelier-note">{String(row.note)}</p> : null}
                <div class="atelier-actions">
                  <button type="button" onClick={() => onEdit(row)}>改寫</button>
                  <button type="button" onClick={() => onDuplicate(row)}>再印一張</button>
                  <button type="button" class="danger" onClick={() => onDelete(row)}>抽掉</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function noteLinks(row: Row): string[] {
  // article in the legacy Studio can carry three regular files plus image,
  // video and PDF attachments.  The old list only surfaced file1, silently
  // hiding the rest of an otherwise successful migration.
  return [row.url1, row.url2, row.url3, row.file1, row.file2, row.file3, row.image, row.video, row.pdf]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((url, index, urls) => urls.indexOf(url) === index);
}

function NotesFolio({
  rows,
  filteredRows,
  query,
  selectedIds,
  editingId,
  loading,
  message,
  onQuery,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  onDeleteSelected,
  onSeed,
}: {
  rows: Row[];
  filteredRows: Row[];
  query: string;
  selectedIds: Set<string>;
  editingId: string | null;
  loading: boolean;
  message: string;
  onQuery: (value: string) => void;
  onEdit: (row: Row) => void;
  onDuplicate: (row: Row) => void;
  onDelete: (row: Row) => void;
  onToggle: (id: string) => void;
  onDeleteSelected: () => void;
  onSeed: () => void;
}) {
  return (
    <div class="folio-book">
      <div class="panel-toolbar">
        <div>
          <h3>口袋冊</h3>
          <p>
            {filteredRows.length} / {rows.length} 頁
            {selectedIds.size > 0 && <span class="selected-badge">　已選 {selectedIds.size} 頁</span>}
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          {selectedIds.size > 0 && (
            <button type="button" class="danger-button" onClick={onDeleteSelected}>
              撕掉已選 ({selectedIds.size})
            </button>
          )}
          <label class="search-box">
            <span>翻找</span>
            <input
              value={query}
              onInput={(event) => onQuery(event.currentTarget.value)}
              placeholder="標題、內文、店名..."
            />
          </label>
        </div>
      </div>
      <p class="folio-status">{loading ? "正在翻頁..." : message}</p>
      {filteredRows.length === 0 && emptyStateKind({ totalRows: rows.length, query }) === "no-rows" ? (
        <div class="ledger-blank empty-no-rows">
          <strong>冊子還是空白</strong>
          <span>右側寫第一頁。短句即可，不必先攤成資料表。</span>
          <button type="button" class="ghost-button" onClick={onSeed} disabled={loading}>寫入範例店名</button>
        </div>
      ) : filteredRows.length === 0 ? (
        <div class="ledger-blank empty-no-search-hits">
          <strong>這幾個字沒寫在任何一頁</strong>
          <span>換詞，或清掉翻找欄。</span>
        </div>
      ) : (
        <ol class="folio-leaves">
          {filteredRows.map((row, index) => {
            const id = String(row.id);
            const checked = selectedIds.has(id);
            const editing = id === editingId;
            const links = noteLinks(row);
            const date = String(row.newDate || "").slice(0, 10);
            const category = String(row.category || "").trim();
            return (
              <li key={id}>
                <article class={`folio-leaf${editing ? " editing" : ""}${checked ? " picked" : ""}`}>
                  <span class="folio-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <div class="folio-copy">
                    <header>
                      <label class="folio-pick">
                        <input type="checkbox" checked={checked} onChange={() => onToggle(id)} />
                        <h4>{String(row.title || "未命名")}</h4>
                      </label>
                      <div class="folio-stamps">
                        {date ? <time>{date}</time> : null}
                        {category ? <em>{category}</em> : null}
                      </div>
                    </header>
                    <p>{String(row.content || "（空白頁）")}</p>
                    {links.length > 0 ? (
                      <div class="folio-tickets">
                        {links.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" title={url}>
                            {hostLabel(url)}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div class="folio-actions">
                      <button type="button" onClick={() => onEdit(row)}>改寫</button>
                      <button type="button" onClick={() => onDuplicate(row)}>再抄一頁</button>
                      <button type="button" class="danger" onClick={() => onDelete(row)}>撕掉</button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function SettingsCabinet({
  settings,
  loading,
  message,
  theme,
  density,
  diag,
  showToken,
  onField,
  onSave,
  onTest,
  onClear,
  onTheme,
  onDensity,
  onToggleToken,
}: {
  settings: SanitySettings;
  loading: boolean;
  message: string;
  theme: "light" | "dark";
  density: DensityMode;
  diag: DiagReport | null;
  showToken: boolean;
  onField: (key: keyof SanitySettings, value: string) => void;
  onSave: () => void;
  onTest: () => void;
  onClear: () => void;
  onTheme: (next: "light" | "dark") => void;
  onDensity: (next: DensityMode) => void;
  onToggleToken: () => void;
}) {
  const hooks = [
    {
      id: "project",
      label: "專案號",
      hung: isHung(settings.projectId),
      value: isHung(settings.projectId) ? settings.projectId.trim() : "未掛",
    },
    {
      id: "dataset",
      label: "冊頁",
      hung: isHung(settings.dataset),
      value: isHung(settings.dataset) ? settings.dataset.trim() : "未掛",
    },
    {
      id: "token",
      label: "令牌",
      hung: isHung(settings.token),
      value: isHung(settings.token) ? "已掛在本機" : "改用伺服器",
    },
    {
      id: "version",
      label: "版本戳",
      hung: isHung(settings.apiVersion),
      value: isHung(settings.apiVersion) ? settings.apiVersion.trim() : "未掛",
    },
  ];

  return (
    <section class="keys-cabinet" aria-label="鑰匙櫃">
      <article class="keys-mast">
        <div class="keys-mast-copy">
          <span class="keys-seal" aria-hidden="true"><Icon name="key" /></span>
          <div>
            <p class="crumb">鑰匙</p>
            <h3>鑰匙櫃</h3>
            <p>四把鑰匙掛在這格櫃子。表格仍住 Sanity；空白欄位就沿用伺服器環境變數，不必把令牌寫進部署檔。</p>
          </div>
        </div>
        <ol class="keys-rail">
          {hooks.map((hook) => (
            <li key={hook.id} class={hook.hung ? "keys-fob hung" : "keys-fob"}>
              <b>{hook.label}</b>
              <strong>{hook.value}</strong>
              <em>{hook.hung ? "在櫃" : "空鉤"}</em>
            </li>
          ))}
        </ol>
      </article>

      <div class="keys-split">
        <form
          class="keys-drawer"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div class="keys-drawer-head">
            <div>
              <p class="crumb">掛鉤</p>
              <h4>本機四把鑰匙</h4>
            </div>
            <p class="keys-hint">只寫進 localStorage，不會上傳到 Sanity。</p>
          </div>
          <div class="keys-fields">
            <label class="field">
              <span>專案號 <i>project id</i></span>
              <input
                value={settings.projectId}
                autocomplete="off"
                spellcheck={false}
                placeholder="Sanity 專案短碼"
                onInput={(event) => onField("projectId", event.currentTarget.value)}
              />
            </label>
            <label class="field">
              <span>冊頁名 <i>dataset</i></span>
              <input
                value={settings.dataset}
                autocomplete="off"
                spellcheck={false}
                placeholder="production"
                onInput={(event) => onField("dataset", event.currentTarget.value)}
              />
            </label>
            <label class="field wide">
              <span>寫入令牌 <i>api token</i></span>
              <div class="keys-secret">
                <input
                  type={showToken ? "text" : "password"}
                  value={settings.token}
                  autocomplete="off"
                  spellcheck={false}
                  placeholder="留空則使用伺服器 token"
                  onInput={(event) => onField("token", event.currentTarget.value)}
                />
                <button
                  type="button"
                  class="ghost-button compact"
                  onClick={onToggleToken}
                  aria-pressed={showToken}
                  aria-label={showToken ? "遮住令牌" : "顯示令牌"}
                >
                  <Icon name={showToken ? "hide" : "eye"} />
                  {showToken ? "遮住" : "顯示"}
                </button>
              </div>
            </label>
            <label class="field">
              <span>版本戳 <i>api version</i></span>
              <input
                value={settings.apiVersion}
                autocomplete="off"
                spellcheck={false}
                placeholder="v2025-02-19"
                onInput={(event) => onField("apiVersion", event.currentTarget.value)}
              />
            </label>
          </div>
          <div class="keys-actions">
            <button class="save-button keys-save" type="submit" disabled={loading}>掛上鑰匙</button>
            <button class="ghost-button" type="button" onClick={onClear} disabled={loading}>交還伺服器</button>
          </div>
        </form>

        <aside class="keys-stamp">
          <div class="keys-stamp-head">
            <div>
              <p class="crumb">驗印</p>
              <h4>連線戳記</h4>
            </div>
            <button type="button" class="ghost-button compact" onClick={onTest} disabled={loading}>
              {loading ? "蓋印中..." : "蓋一次印"}
            </button>
          </div>
          <p class="keys-status" aria-live="polite">{message}</p>
          {diag ? (
            <ul class="keys-ledger">
              {diag.rows.map((row) => (
                <li key={row.label} class={row.tone ? `tone-${row.tone}` : undefined}>
                  <b>{row.label}</b>
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div class="keys-empty">
              <strong>還沒蓋印</strong>
              <span>掛上鑰匙後按一次，確認讀寫是否通。結果只留在這張戳記上。</span>
            </div>
          )}
          <div class="keys-paper" role="group" aria-label="介面">
            <p class="crumb">介面</p>
            <div class="keys-chips">
              <button type="button" class={theme === "light" ? "keys-chip on" : "keys-chip"} onClick={() => onTheme("light")}>明場</button>
              <button type="button" class={theme === "dark" ? "keys-chip on" : "keys-chip"} onClick={() => onTheme("dark")}>暗場</button>
              <button type="button" class={density === "comfortable" ? "keys-chip on" : "keys-chip"} onClick={() => onDensity("comfortable")}>寬距</button>
              <button type="button" class={density === "compact" ? "keys-chip on" : "keys-chip"} onClick={() => onDensity("compact")}>密排</button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function FengbroCrudApp() {
  const [rows, setRows] = useState<Row[]>([]);
  const [settings, setSettings] = useState<SanitySettings>(defaultSettings);
  const [activeId, setActiveId] = useState("tools");
  const [activeTool, setActiveTool] = useState<ToolTabId>("price");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Row>(() => createEmptyRow(modules[0]));
  const [message, setMessage] = useState("請設定 Sanity 或使用環境變數");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [expandedDocumentUrl, setExpandedDocumentUrl] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [showToken, setShowToken] = useState(false);
  const [diag, setDiag] = useState<DiagReport | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastLeaf, setLastLeaf] = useState<Record<string, string>>({});
  const themeMounted = useRef(false);
  const densityMounted = useRef(false);
  const loadRequestId = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const activeModule = moduleById[activeId];
  const isSettings = activeId === "settings";
  const isAbout = activeId === "about";
  const isNotes = activeId === "notes";
  const isMedia = previewModuleIds.has(activeId);
  const uploadConfig = mediaUploadModules[activeId];
  const todayLabel = new Intl.DateTimeFormat("zh-TW", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Taipei",
  }).format(new Date());

  const activeLeafKey = activeId === "tools" ? `tool:${activeTool}` : activeId;
  const activeGroup = navGroups.find((group) =>
    group.children.some((leaf) => leaf.key === activeLeafKey)
  ) ?? navGroups[0];
  const activeLeaf = navLeaves.find((leaf) => leaf.key === activeLeafKey);
  const activeTitle = activeLeaf ? activeLeaf.label : activeGroup.label;

  const goLeaf = (leaf: NavLeaf) => {
    const owner = navGroups.find((group) => group.children.some((child) => child.key === leaf.key));
    if (owner) setLastLeaf((prev) => ({ ...prev, [owner.id]: leaf.key }));
    if (leaf.toolId) {
      setActiveTool(leaf.toolId);
      setActiveId("tools");
      return;
    }
    setActiveId(leaf.moduleId);
  };

  const goGroup = (group: NavGroup) => {
    if (group.id === activeGroup.id) return;
    goLeaf(resolveGroupLeaf(group, lastLeaf));
  };

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const toggleDensity = () => setDensity((prev) => (prev === "compact" ? "comfortable" : "compact"));

  useEffect(() => {
    let initial: "light" | "dark" = "dark";
    try {
      const saved = localStorage.getItem(themeKey);
      if (saved === "dark" || saved === "light") initial = saved;
      else if (globalThis.matchMedia("(prefers-color-scheme: light)").matches) initial = "light";
    } catch { /* ignore */ }
    applyTheme(document.documentElement, initial);
    themeMounted.current = true;
    setTheme(initial);
  }, []);

  useEffect(() => {
    if (!themeMounted.current) return;
    applyTheme(document.documentElement, theme);
    try {
      localStorage.setItem(themeKey, theme);
    } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    let initial: DensityMode = "comfortable";
    try {
      if (localStorage.getItem(densityKey) === "compact") initial = "compact";
    } catch { /* ignore */ }
    applyDensity(document.documentElement, initial);
    densityMounted.current = true;
    setDensity(initial);
  }, []);

  useEffect(() => {
    if (!densityMounted.current) return;
    applyDensity(document.documentElement, density);
    try {
      if (density === "compact") localStorage.setItem(densityKey, "compact");
      else localStorage.removeItem(densityKey);
    } catch { /* ignore */ }
  }, [density]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  // 失敗訊息本來跟成功訊息共用 message，兩者長得一模一樣，寫入失敗很容易被當成寫入成功。
  // 這裡讓錯誤走自己的通道，才能在表單旁邊用警示樣式獨立呈現。
  const fail = (error: unknown, fallback: string) => {
    const text = error instanceof Error ? error.message : fallback;
    setMessage(text);
    setErrorText(text);
  };

  const loadRows = async (moduleId = activeId, nextSettings = settings) => {
    if (moduleId === "settings") return;
    const requestId = ++loadRequestId.current;
    setLoading(true);
    setErrorText("");
    try {
      const response = await fetch(`/api/sanity/${moduleId}`, {
        headers: authHeaders(nextSettings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 讀取失敗");
      if (requestId !== loadRequestId.current) return;
      setRows(data.rows || []);
      const typeHint = data.type ? `（type: ${data.type}）` : "";
      setMessage(data.error || `已從 Sanity 載入 ${data.rows?.length ?? 0} 筆${typeHint}`);
    } catch (error) {
      if (requestId !== loadRequestId.current) return;
      setRows([]);
      fail(error, "Sanity 讀取失敗");
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
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
    setExpandedDocumentUrl("");
    if (isSettings) {
      setRows([]);
      setMessage("鑰匙只掛在這台瀏覽器");
    } else {
      void loadRows(activeId);
    }
  }, [activeId]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [query, rows]);
  const listEmptyKind = emptyStateKind({ totalRows: rows.length, query });

  const stats = useMemo(() => {
    const total = rows.length;
    const money = rows.reduce((sum, row) => sum + Number(row.price ?? row.deposit ?? 0), 0);
    const boolCount = rows.filter((row) => row.continue === true).length;
    const categories = new Set(rows.map((row) => String(row.category || "").trim()).filter(Boolean)).size;
    const linked = rows.filter((row) => noteLinks(row).length > 0).length;
    return { total, money, boolCount, categories, linked };
  }, [rows]);
  const draftMediaUrl = moduleMediaUrl(activeId, draft);

  const updateDraft = (key: string, value: string | number | boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const draftPayload = () => {
    const row = stripSystemFields({ ...createEmptyRow(activeModule), ...draft });
    const unset = editingId
      ? activeModule.fields
        .filter((field) => ["date", "datetime", "url"].includes(field.type || "") && !String(row[field.key] ?? "").trim())
        .map((field) => field.key)
      : [];
    unset.forEach((key) => delete row[key]);
    if (!editingId) {
      activeModule.fields
        .filter((field) => ["date", "datetime", "url"].includes(field.type || "") && !String(row[field.key] ?? "").trim())
        .forEach((field) => delete row[field.key]);
    }
    return { row, unset };
  };

  const saveDraft = async () => {
    const payload = draftPayload();
    setLoading(true);
    setErrorText("");
    try {
      const response = await fetch(`/api/sanity/${activeId}`, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders(settings),
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : { row: payload.row }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 寫入失敗");
      const typeHint = data.type ? `（type: ${data.type}）` : "";
      setMessage(editingId ? `已更新 Sanity 文件${typeHint}` : `已新增 Sanity 文件${typeHint}`);
      setEditingId(null);
      setDraft(createEmptyRow(activeModule));
      await loadRows();
    } catch (error) {
      fail(error, "Sanity 寫入失敗");
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
    setErrorText("");
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
      fail(error, "Sanity 刪除失敗");
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

  const patchRow = async (row: Row, changes: Row, messageText: string, unset: string[] = []) => {
    setLoading(true);
    setErrorText("");
    try {
      const response = await fetch(`/api/sanity/${activeId}`, {
        method: "PUT",
        headers: authHeaders(settings),
        body: JSON.stringify({ id: row.id, row: changes, unset }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 更新失敗");
      setMessage(messageText);
      await loadRows();
    } catch (error) {
      fail(error, "Sanity 更新失敗");
    } finally {
      setLoading(false);
    }
  };

  const adjustNumber = (row: Row, key: string, delta: number, label: string) => {
    const current = Number(row[key] || 0);
    const next = Math.max(0, Number.isFinite(current) ? current + delta : delta);
    return patchRow(row, { [key]: next }, `${label}已調整為 ${next}`);
  };

  const rollRoutineDates = (row: Row) => {
    if (!confirm("將日期 1 依序推到日期 2、日期 2 推到日期 3，並清空日期 1？")) return;
    const patch: Row = {};
    if (row.lastdate1) patch.lastdate2 = row.lastdate1;
    if (row.lastdate2) patch.lastdate3 = row.lastdate2;
    return patchRow(row, patch, "已遞移例行日期", ["lastdate1"]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!expandedDocumentUrl) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedDocumentUrl("");
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [expandedDocumentUrl]);

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
    setErrorText("");
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
    setErrorText("");
    try {
      const response = await fetch(`/api/sanity/${activeId}`, {
        method: "POST",
        headers: authHeaders(settings),
        body: JSON.stringify({ rows: imported.map(stripSystemFields) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 匯入失敗");
      const typeHint = data.type ? `（type: ${data.type}）` : "";
      setMessage(`${label}：已匯入 ${data.written ?? imported.length} 筆到 Sanity${typeHint}`);
      await loadRows();
    } catch (error) {
      fail(error, "Sanity 匯入失敗");
    } finally {
      setLoading(false);
    }
  };

  const importFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importRows(rowsFromCsv(text, activeModule), "CSV");
    } catch (error) {
      fail(error, "CSV 匯入失敗");
    } finally {
      input.value = "";
    }
  };

  const uploadMedia = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !uploadConfig) return;

    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const response = await fetch(`/api/sanity-asset/${activeId}`, {
        method: "POST",
        headers: {
          "x-sanity-project-id": settings.projectId,
          "x-sanity-dataset": settings.dataset,
          "x-sanity-token": settings.token,
          "x-sanity-api-version": settings.apiVersion,
        },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sanity 上傳失敗");
      const urlField = activeId === "food" || activeId === "routine" ? "photo" : "url";
      updateDraft(urlField, data.url || "");
      if (activeModule.fields.some((field) => field.key === "assetId")) {
        updateDraft("assetId", data.asset?._id || "");
        updateDraft("filename", data.asset?.originalFilename || file.name);
        updateDraft("mimeType", data.asset?.mimeType || file.type);
        updateDraft("size", Number(data.asset?.size || file.size || 0));
      }
      setMessage(`已上傳 ${file.name} 到 Sanity Assets`);
    } catch (error) {
      fail(error, "Sanity 上傳失敗");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const saveSettings = () => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    setMessage("鑰匙已掛上本機");
    void loadRows("subscription", settings);
  };

  const clearSettings = () => {
    try {
      localStorage.removeItem(settingsKey);
    } catch { /* ignore */ }
    setSettings(defaultSettings);
    setDiag(null);
    setShowToken(false);
    setMessage("已交還，改用伺服器環境變數");
  };

  const testConnection = async () => {
    setLoading(true);
    setErrorText("");
    try {
      const response = await fetch(`/api/sanity/subscription`, {
        method: "PATCH",
        headers: authHeaders(settings),
      });
      const data = await response.json();
      const info = data.info || {};
      const rows: DiagRow[] = [
        { label: "連線", value: data.ok ? "通過" : "失敗", tone: data.ok ? "ok" : "bad" },
        { label: "專案號", value: String(info.projectId || "—"), tone: info.projectId ? "mute" : "bad" },
        { label: "冊頁", value: String(info.dataset || "—"), tone: info.dataset ? "mute" : "bad" },
        { label: "版本戳", value: String(info.apiVersion || "—"), tone: "mute" },
        { label: "令牌", value: info.hasToken ? "伺服器或本機已備妥" : "沒有令牌", tone: info.hasToken ? "ok" : "bad" },
      ];
      if (info.tokenPrefix) rows.push({ label: "令牌前綴", value: String(info.tokenPrefix), tone: "mute" });
      if (Array.isArray(info.typeAliases) && info.typeAliases.length > 0) {
        rows.push({ label: "型別別名", value: info.typeAliases.join("、"), tone: "mute" });
      }
      if (info.readOk !== undefined) {
        rows.push({ label: "讀取", value: info.readOk ? "成功" : "失敗", tone: info.readOk ? "ok" : "bad" });
      }
      if (Array.isArray(info.readByType) && info.readByType.length > 0) {
        rows.push({
          label: "現有文件",
          value: info.readByType.map((item: { type: string; count: number }) => `${item.type} ${item.count}`).join(" · "),
          tone: "mute",
        });
      }
      if (info.writeOk !== undefined) {
        rows.push({ label: "寫入", value: info.writeOk ? "成功" : "失敗", tone: info.writeOk ? "ok" : "bad" });
      }
      if (info.cleanupOk !== undefined) {
        rows.push({ label: "清理", value: info.cleanupOk ? "成功" : "失敗", tone: info.cleanupOk ? "ok" : "bad" });
      }
      if (data.error || info.error) {
        rows.push({ label: "錯誤", value: String(data.error || info.error), tone: "bad" });
      }
      setDiag({ ok: Boolean(data.ok), rows });
      setMessage(data.ok ? "戳記通過，讀寫可通" : `蓋印失敗：${data.error || info.error || "未知原因"}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "診斷請求失敗";
      setDiag({ ok: false, rows: [{ label: "請求", value: msg, tone: "bad" }] });
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="app-shell">
      {/* 平板：左側圖示軌 */}
      <aside class="rail" aria-label="模組導覽">
        <div class="rail-head">
          <div class="brand-mark">鋒</div>
        </div>
        <nav class="rail-nav" aria-label="主要導覽">
          {navGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              title={group.label}
              aria-current={group.id === activeGroup.id ? "page" : undefined}
              class={group.id === activeGroup.id ? "rail-item active" : "rail-item"}
              onClick={() => goGroup(group)}
            >
              <Icon name={group.icon} />
              <span>{group.short}</span>
            </button>
          ))}
        </nav>
        <div class="rail-foot">
          <button
            type="button"
            class={density === "compact" ? "rail-item active" : "rail-item"}
            title={density === "compact" ? "切換為寬距" : "切換為密排"}
            aria-pressed={density === "compact"}
            onClick={toggleDensity}
          >
            <Icon name={density === "compact" ? "spread" : "rows"} />
            <span>{density === "compact" ? "密排" : "寬距"}</span>
          </button>
          <button type="button" class="rail-item" title="全部模組" onClick={() => setSheetOpen(true)}>
            <Icon name="grid" />
            <span>全部</span>
          </button>
        </div>
      </aside>

      <div class="app-main">
        {/* 桌面：上方雙列導覽 */}
        <header class="topnav">
          <div class="topnav-row">
            <div class="brand">
              <div class="brand-mark">鋒</div>
              <div class="brand-text">
                <p>鋒兄工作台</p>
                <h1>{activeTitle}</h1>
              </div>
            </div>

            <nav class="nav-primary" aria-label="主要導覽">
              {navGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  aria-current={group.id === activeGroup.id ? "page" : undefined}
                  class={group.id === activeGroup.id ? "nav-tab active" : "nav-tab"}
                  onClick={() => goGroup(group)}
                >
                  <Icon name={group.icon} />
                  <span>{group.label}</span>
                </button>
              ))}
            </nav>

            <div class="mode-cluster">
              <button
                type="button"
                class="mode-button"
                onClick={toggleTheme}
                title={theme === "dark" ? "切換為明場" : "切換為暗場"}
                aria-label={theme === "dark" ? "切換為明場" : "切換為暗場"}
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} />
              </button>
              <button
                type="button"
                class={density === "compact" ? "mode-button on" : "mode-button"}
                onClick={toggleDensity}
                title={density === "compact" ? "切換為寬距" : "切換為密排"}
                aria-pressed={density === "compact"}
                aria-label={density === "compact" ? "切換為寬距" : "切換為密排"}
              >
                <Icon name={density === "compact" ? "spread" : "rows"} />
              </button>
              <div class="mode-meta">
                <span>{theme === "dark" ? "暗場" : "明場"}</span>
                <strong>{density === "compact" ? "密排" : "寬距"}</strong>
              </div>
            </div>

            <button
              type="button"
              class="menu-button"
              aria-label="全部模組"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <Icon name="grid" />
            </button>
          </div>

          <div class="subnav-row">
            <nav class="nav-sub" aria-label="子導覽">
              {activeGroup.children.map((leaf) => {
                const isActive = leaf.key === activeLeafKey;
                return (
                  <button
                    key={leaf.key}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    class={isActive ? "nav-subtab active" : "nav-subtab"}
                    onClick={() => goLeaf(leaf)}
                  >
                    <Icon name={leaf.icon} />
                    <span>{leaf.label}</span>
                    {isActive && !leaf.toolId && leaf.moduleId !== "settings" && (
                      <span class="nav-count">{rows.length}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <main class={`workspace module-${activeId}`}>
        <header class="surface-bar">
          <div>
            <span>目前模組</span>
            <strong>{activeId === "tools" ? toolTabs.find((tab) => tab.id === activeTool)?.label : activeModule.shortLabel}</strong>
          </div>
          <div class="surface-pills">
            <span><b>今天</b>{todayLabel}</span>
            <span><b>模組</b>{modules.length} 個</span>
            <span><b>介面</b>{theme === "dark" ? "暗場" : "明場"} · {density === "compact" ? "密排" : "寬距"}</span>
          </div>
        </header>

        <section class="console-card">
        <header class="topbar">
          <div>
            <p class="crumb">{isAbout ? "誌" : isSettings ? "鑰匙" : isNotes ? "口袋" : "冊頁台"}</p>
            <h2>{activeId === "tools" ? "鋒兄工具" : isAbout ? "鋒兄誌" : isSettings ? "鑰匙櫃" : isNotes ? "口袋冊" : activeModule.label}</h2>
            <p>{activeModule.description}</p>
          </div>
          {!isSettings && !isAbout && activeId !== "tools" && (
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
          <SettingsCabinet
            settings={settings}
            loading={loading}
            message={message}
            theme={theme}
            density={density}
            diag={diag}
            showToken={showToken}
            onField={(key, value) => setSettings({ ...settings, [key]: value })}
            onSave={saveSettings}
            onTest={() => void testConnection()}
            onClear={clearSettings}
            onTheme={setTheme}
            onDensity={setDensity}
            onToggleToken={() => setShowToken((prev) => !prev)}
          />
        ) : activeId === "tools" ? (
          <ToolWorkbench activeTool={activeTool} setActiveTool={setActiveTool} />
        ) : isAbout ? (
          <AboutDesk
            rows={rows}
            draft={draft}
            editingId={editingId}
            loading={loading}
            message={message}
            theme={theme}
            moduleCount={modules.length}
            onDraft={updateDraft}
            onSave={() => void saveDraft()}
            onEdit={editRow}
            onDelete={(row) => void deleteRow(row)}
            onCancel={() => {
              setEditingId(null);
              setDraft(createEmptyRow(activeModule));
            }}
            onReload={() => void loadRows()}
            onSeed={() => void importRows(activeModule.seed, "範例資料")}
          />
        ) : (
          <>
            <section class="metric-row" aria-label={isMedia ? "媒體概況" : isNotes ? "冊頁概況" : "資料概況"}>
              <div class="metric"><span>{isMedia ? "件數" : isNotes ? "頁數" : "Sanity 筆數"}</span><strong>{stats.total}</strong></div>
              {isMedia ? (
                <div class="metric"><span>分類</span><strong>{stats.categories}</strong></div>
              ) : isNotes ? (
                <>
                  <div class="metric"><span>有連結</span><strong>{stats.linked}</strong></div>
                  <div class="metric"><span>分類</span><strong>{stats.categories}</strong></div>
                </>
              ) : (
                <>
                  <div class="metric"><span>金額合計</span><strong>{stats.money.toLocaleString("zh-TW")}</strong></div>
                  <div class="metric"><span>續訂中</span><strong>{stats.boolCount}</strong></div>
                </>
              )}
              <div class={errorText ? "metric status has-error" : "metric status"}>
                <span>狀態</span>
                <strong style="display:flex;align-items:center;gap:6px;">{loading && <span class="spinner" aria-hidden="true" />}{message}</strong>
              </div>
            </section>

            <section class={`content-grid${isMedia ? " atelier-layout" : isNotes ? " folio-layout" : ""}`}>
              {isMedia ? (
                <MediaWall
                  moduleId={activeId}
                  shortLabel={activeModule.shortLabel}
                  rows={rows}
                  filteredRows={filteredRows}
                  query={query}
                  selectedIds={selectedIds}
                  editingId={editingId}
                  loading={loading}
                  message={message}
                  onQuery={setQuery}
                  onEdit={editRow}
                  onDuplicate={(row) => void duplicateRow(row)}
                  onDelete={(row) => void deleteRow(row)}
                  onToggle={toggleSelect}
                  onDeleteSelected={openDeleteSelected}
                  onExpand={setExpandedDocumentUrl}
                  onSeed={() => void importRows(activeModule.seed, "範例資料")}
                />
              ) : isNotes ? (
                <NotesFolio
                  rows={rows}
                  filteredRows={filteredRows}
                  query={query}
                  selectedIds={selectedIds}
                  editingId={editingId}
                  loading={loading}
                  message={message}
                  onQuery={setQuery}
                  onEdit={editRow}
                  onDuplicate={(row) => void duplicateRow(row)}
                  onDelete={(row) => void deleteRow(row)}
                  onToggle={toggleSelect}
                  onDeleteSelected={openDeleteSelected}
                  onSeed={() => void importRows(activeModule.seed, "範例資料")}
                />
              ) : (
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
                    <label class="select-all-mobile">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                      />
                      <span>{allFilteredSelected ? "取消全選" : "全選"}</span>
                    </label>
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
                        {activeModule.fields.slice(0, 6).map((field) => <th class={columnClass(field)}>{field.label}</th>)}
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
                              <td class={columnClass(field)} data-label={field.label}>
                                {field.type === "url" && row[field.key]
                                  ? (
                                    <div class="media-cell">
                                      {isPreviewField(activeId, field.key) ? (
                                        <MediaPreview
                                          moduleId={activeId}
                                          url={String(row[field.key])}
                                          compact
                                          onExpand={activeId === "documents" ? setExpandedDocumentUrl : undefined}
                                        />
                                      ) : null}
                                      <a
                                        href={String(row[field.key])}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={String(row[field.key])}
                                      >
                                        {hostLabel(String(row[field.key]))}
                                      </a>
                                    </div>
                                  )
                                  : field.type === "boolean"
                                  ? <span class={row[field.key] ? "pill on" : "pill"}>{row[field.key] ? "是" : "否"}</span>
                                  : field.type === "password"
                                  ? <span class="secret-cell">{row[field.key] ? "••••••" : ""}</span>
                                  : <span class={field.type === "textarea" ? "multiline" : ""}>{String(row[field.key] ?? "")}</span>}
                              </td>
                            ))}
                            <td class="row-actions">
                              {activeId === "food" && (
                                <>
                                  <button type="button" title="庫存減 1" onClick={() => void adjustNumber(row, "amount", -1, "庫存")}>庫 -1</button>
                                  <button type="button" title="庫存加 1" onClick={() => void adjustNumber(row, "amount", 1, "庫存")}>庫 +1</button>
                                </>
                              )}
                              {activeId === "bank" && (
                                <>
                                  <button type="button" title="餘額減 1,000" onClick={() => void adjustNumber(row, "deposit", -1000, "餘額")}>餘 -1K</button>
                                  <button type="button" title="餘額加 1,000" onClick={() => void adjustNumber(row, "deposit", 1000, "餘額")}>餘 +1K</button>
                                </>
                              )}
                              {activeId === "routine" && (
                                <button type="button" title="日期 1 → 日期 2 → 日期 3" onClick={() => void rollRoutineDates(row)}>日期遞移</button>
                              )}
                              <button type="button" title="編輯" onClick={() => editRow(row)}>編輯</button>
                              <button type="button" title="複製" onClick={() => void duplicateRow(row)}>複製</button>
                              <button type="button" title="刪除" class="danger" onClick={() => void deleteRow(row)}>刪除</button>
                            </td>
                          </tr>
                        );
                      })}
                      {loading && filteredRows.length === 0 && [0, 1, 2, 3, 4].map((n) => (
                        <tr class="skeleton-row" aria-hidden="true" key={n}>
                          <td class="check-col"><span class="skeleton-bar" /></td>
                          {activeModule.fields.slice(0, 6).map((field) => (
                            <td class={columnClass(field)} data-label={field.label}><span class="skeleton-bar" /></td>
                          ))}
                          <td class="row-actions"><span class="skeleton-bar" /></td>
                        </tr>
                      ))}
                      {!loading && filteredRows.length === 0 && (
                        <tr>
                          <td colSpan={activeModule.fields.slice(0, 6).length + 2} class="empty-cell">
                            <div class={`empty-state empty-${listEmptyKind}`}>
                              <span class="empty-icon"><Icon name={activeModule.icon} /></span>
                              <strong>
                                {listEmptyKind === "no-search-hits" ? "沒有符合搜尋的資料" : `${activeModule.shortLabel}還沒有資料`}
                              </strong>
                              <p>
                                {listEmptyKind === "no-search-hits"
                                  ? `「${query.trim()}」在 ${rows.length} 筆裡找不到相符的內容，換個關鍵字或清空搜尋。`
                                  : "用右側表單新增第一筆，或按上方「匯入範例」帶入預設資料。"}
                              </p>
                              {listEmptyKind === "no-search-hits" && (
                                <button type="button" class="ghost-button compact" onClick={() => setQuery("")}>清空搜尋</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              <form class="editor-panel" onSubmit={(event) => { event.preventDefault(); void saveDraft(); }}>
                <div class="editor-head">
                  <div>
                    <h3>{isNotes ? (editingId ? "改這一頁" : "寫一頁") : editingId ? "編輯項目" : "新增項目"}</h3>
                    <p>{isNotes ? "釘在口袋冊右側" : activeModule.label}</p>
                  </div>
                  {editingId && <button type="button" class="ghost-button compact" onClick={() => { setEditingId(null); setDraft(createEmptyRow(activeModule)); }}>取消</button>}
                </div>
                {errorText && (
                  <p class="form-alert" role="alert">
                    <span class="form-alert-icon" aria-hidden="true">!</span>
                    {errorText}
                  </p>
                )}
                <div class="form-grid">
                  {activeModule.fields.map((field) => (
                    <label class={field.wide ? "field wide" : "field"}>
                      <span>{field.label}</span>
                      {field.type === "textarea"
                        ? <textarea value={String(draft[field.key] ?? "")} onInput={(event) => updateDraft(field.key, event.currentTarget.value)} />
                        : field.options
                        ? (
                          <select value={String(draft[field.key] ?? "")} onChange={(event) => updateDraft(field.key, event.currentTarget.value)}>
                            <option value="">未設定</option>
                            {field.options.map((option) => <option value={option.value}>{option.label}</option>)}
                          </select>
                        )
                        : field.type === "boolean"
                        ? (
                          <select value={draft[field.key] ? "true" : "false"} onChange={(event) => updateDraft(field.key, event.currentTarget.value === "true")}>
                            <option value="true">是</option>
                            <option value="false">否</option>
                          </select>
                        )
                        : (
                          <input
                            type={field.type === "number"
                              ? "number"
                              : field.type === "date"
                              ? "date"
                              : field.type === "datetime"
                              ? "datetime-local"
                              : field.type === "time"
                              ? "time"
                              : field.type === "url"
                              ? "url"
                              : field.type === "password"
                              ? "password"
                              : "text"}
                            value={field.type === "datetime" ? toDateTimeLocalValue(draft[field.key]) : String(draft[field.key] ?? "")}
                            autocomplete={field.type === "password" ? "new-password" : undefined}
                            onInput={(event) => updateDraft(
                              field.key,
                              field.type === "number"
                                ? Number(event.currentTarget.value || 0)
                                : field.type === "datetime"
                                ? fromDateTimeLocalValue(event.currentTarget.value)
                                : event.currentTarget.value,
                            )}
                          />
                        )}
                    </label>
                  ))}
                </div>
                {previewableModuleIds.has(activeId) && draftMediaUrl.trim() && (
                  <div class="editor-preview">
                    <span>媒體預覽</span>
                    <MediaPreview moduleId={activeId} url={draftMediaUrl} />
                  </div>
                )}
                {uploadConfig && (
                  <div class="upload-box">
                    <input
                      ref={uploadRef}
                      type="file"
                      accept={uploadConfig.accept}
                      class="visually-hidden"
                      onChange={(event) => void uploadMedia(event)}
                    />
                    <button
                      type="button"
                      class="ghost-button upload-button"
                      disabled={uploading || loading}
                      onClick={() => uploadRef.current?.click()}
                    >
                      {uploading ? "上傳中..." : uploadConfig.label}
                    </button>
                    <p>檔案會上傳到 Sanity Assets，成功後自動填入「{activeId === "food" || activeId === "routine" ? "照片" : "連結"}」欄位。</p>
                  </div>
                )}
                <button class="save-button" type="submit" disabled={loading}>
                  {isNotes ? (editingId ? "覆寫這一頁" : "釘進冊裡") : editingId ? "儲存到 Sanity" : "建立 Sanity 文件"}
                </button>
              </form>
            </section>
          </>
        )}
        </section>
        </main>

        {/* 手機：底部快捷列 */}
        <nav class="bottom-nav" aria-label="手機快捷選單">
          <div class="bottom-nav-inner">
            {dockLeaves.map((leaf) => {
              const isActive = leaf.key === activeLeafKey;
              return (
                <button
                  key={leaf.key}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  class={isActive ? "dock-item active" : "dock-item"}
                  onClick={() => goLeaf(leaf)}
                >
                  <span class="dock-icon"><Icon name={leaf.icon} /></span>
                  <span>{leaf.short}</span>
                </button>
              );
            })}
            <button
              type="button"
              class={sheetOpen ? "dock-item active" : "dock-item"}
              aria-label="更多模組"
              onClick={() => setSheetOpen(true)}
            >
              <span class="dock-icon"><Icon name="grid" /></span>
              <span>更多</span>
            </button>
          </div>
        </nav>
      </div>

      {sheetOpen && (
        <div class="sheet-overlay">
          <button type="button" class="sheet-scrim" aria-label="關閉選單" onClick={() => setSheetOpen(false)} />
          <aside class="sheet" role="dialog" aria-modal="true" aria-label="全部模組">
            <div class="sheet-grip" aria-hidden="true" />
            <div class="sheet-head">
              <p>全部模組</p>
              <button type="button" class="mode-button" aria-label="關閉選單" onClick={() => setSheetOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <div class="sheet-body">
              <div class="sheet-grid">
                {navLeaves.map((leaf) => {
                  const isActive = leaf.key === activeLeafKey;
                  return (
                    <button
                      key={leaf.key}
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      class={isActive ? "sheet-tile active" : "sheet-tile"}
                      onClick={() => {
                        goLeaf(leaf);
                        setSheetOpen(false);
                      }}
                    >
                      <span class="sheet-tile-icon"><Icon name={leaf.icon} /></span>
                      <span>{leaf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

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

      {expandedDocumentUrl && (
        <div
          class="document-lightbox"
          onClick={(event) => {
            if (event.target === event.currentTarget) setExpandedDocumentUrl("");
          }}
        >
          <div class="document-lightbox-shell">
            <div class="document-lightbox-bar">
              <strong>文件預覽</strong>
              <div class="document-lightbox-actions">
                <a class="ghost-button" href={expandedDocumentUrl} target="_blank" rel="noreferrer">另開文件</a>
                <button type="button" class="primary-button" onClick={() => setExpandedDocumentUrl("")}>關閉</button>
              </div>
            </div>
            <div class="document-lightbox-frame">
              <iframe src={expandedDocumentUrl} title="全寬文件預覽" loading="lazy" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

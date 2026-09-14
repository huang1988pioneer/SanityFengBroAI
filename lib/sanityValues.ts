/**
 * 把 Sanity 回傳的欄位值攤平成表格吃得下的純量。
 *
 * `goldshoot0720/sanitygoldshoot0720` 的 Studio schema 裡，article.image、
 * article.pdf、video.video、food.photo、inventory.image 都是 `image` / `file`
 * 型別 —— GROQ 回來的是 `{ _type, asset: { _ref } }` 物件，不是字串。工作台的
 * 表格與 CSV 只認純量，直接丟進去會印出 `[object Object]`，連結也開不了。
 *
 * 型別與欄位的對照表住在 `lib/sanityModules.ts`；這裡只管「值長什麼樣」。
 */

export type AssetContext = {
  projectId: string;
  dataset: string;
};

/**
 * Sanity asset `_ref` → cdn.sanity.io 連結。
 * 圖片是 `image-<hash>-<寬x高>-<副檔名>`，檔案是 `file-<hash>-<副檔名>`。
 */
export function assetRefToUrl(ref: string, context: AssetContext): string {
  const { projectId, dataset } = context;
  if (!ref || !projectId || !dataset) return "";

  const image = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref);
  if (image) {
    const [, hash, dimensions, extension] = image;
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${hash}-${dimensions}.${extension}`;
  }

  const file = /^file-([a-f0-9]+)-(\w+)$/.exec(ref);
  if (file) {
    const [, hash, extension] = file;
    return `https://cdn.sanity.io/files/${projectId}/${dataset}/${hash}.${extension}`;
  }

  return "";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Portable Text 區塊 → 純文字，備註欄才讀得到內容。 */
function blockToText(block: Record<string, unknown>): string {
  const children = Array.isArray(block.children) ? block.children : [];
  return children
    .map((child) => (isPlainObject(child) && typeof child.text === "string" ? child.text : ""))
    .join("");
}

/** 單一 Sanity 值 → 純量。看不懂的物件退回 JSON，總比 `[object Object]` 有用。 */
export function flattenSanityValue(value: unknown, context: AssetContext): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => String(flattenSanityValue(item, context)))
      .filter((item) => item !== "")
      .join("\n");
  }

  if (isPlainObject(value)) {
    if (value._type === "block") return blockToText(value);
    if (typeof value.current === "string") return value.current;

    // 查詢有展開 asset 時直接用它的 url，沒展開就從 _ref 拼 CDN 連結。
    const asset = value.asset;
    if (isPlainObject(asset)) {
      if (typeof asset.url === "string") return asset.url;
      if (typeof asset._ref === "string") return assetRefToUrl(asset._ref, context);
    }
    if (typeof value._ref === "string") {
      return assetRefToUrl(value._ref, context) || value._ref;
    }
    if (typeof value.lat === "number" && typeof value.lng === "number") return `${value.lat},${value.lng}`;

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return String(value);
}

/**
 * 整份文件攤平。`_id` / `_type` 這類系統欄位原樣留著，交由後續步驟處理。
 */
export function flattenSanityDoc(
  doc: Record<string, unknown>,
  context: AssetContext,
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc || {})) {
    flat[key] = key.startsWith("_") ? value : flattenSanityValue(value, context);
  }
  return flat;
}

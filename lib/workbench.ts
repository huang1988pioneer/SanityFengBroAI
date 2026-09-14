/** 鋒兄工作台殼層純函式：導覽、網址標籤、空狀態、介面明暗場。供 island 與 Deno 測試共用。 */

export type ThemeMode = "light" | "dark";
export type DensityMode = "comfortable" | "compact";
export type EmptyStateKind = "no-rows" | "no-search-hits";

export const THEME_STORAGE_KEY = "fengbro.theme";
export const DENSITY_STORAGE_KEY = "fengbro.density";

export type GroupLeaf = { key: string };
export type NavGroupLike<T extends GroupLeaf = GroupLeaf> = {
  id: string;
  children: T[];
};

/** 表格只顯示網域；完整網址留在 href / title。 */
export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * 切回某個頂部分組時，還原該組最後停留的葉片；沒有紀錄則用該組第一片。
 * 對應工作台 goGroup() 的解析規則。
 */
export function resolveGroupLeaf<T extends GroupLeaf>(
  group: NavGroupLike<T>,
  lastLeafByGroup: Record<string, string>,
): T {
  const remembered = lastLeafByGroup[group.id];
  const found = remembered
    ? group.children.find((leaf) => leaf.key === remembered)
    : undefined;
  return found ?? group.children[0];
}

/** 同一個模組：空清單 vs 有資料但搜尋沒打中，兩種空狀態。 */
export function emptyStateKind(input: {
  totalRows: number;
  query: string;
}): EmptyStateKind {
  if (input.query.trim().length > 0 && input.totalRows > 0) return "no-search-hits";
  return "no-rows";
}

export type ShellTarget = {
  dataset: {
    theme?: string;
    density?: string;
    [name: string]: string | undefined;
  };
};

export function applyTheme(target: ShellTarget, theme: ThemeMode): void {
  target.dataset.theme = theme;
}

export function applyDensity(target: ShellTarget, density: DensityMode): void {
  if (density === "compact") target.dataset.density = "compact";
  else delete target.dataset.density;
}

/** 一次套用暗場 + 密排（或明場 + 寬距）到文件根。 */
export function applyShell(
  target: ShellTarget,
  theme: ThemeMode,
  density: DensityMode,
): void {
  applyTheme(target, theme);
  applyDensity(target, density);
}

/**
 * 首屏 FOUC 防護：在第一幀前寫入 html[data-theme] / [data-density]。
 * 這版的原生狀態是暗場，所以沒有存過偏好、也問不到系統偏好時一律先給暗場。
 */
export const shellBootScript =
  `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.dataset.theme=t;var d=localStorage.getItem("${DENSITY_STORAGE_KEY}");if(d==="compact")document.documentElement.dataset.density="compact";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

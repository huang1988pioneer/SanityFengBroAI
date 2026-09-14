[sanityfengbroai-production.up.railway.app
](https://sanityfengbroai-production.up.railway.app/)

# SanityFengBroAI

Deno Fresh 版鋒兄 AI CRUD 工作台。表格資料直接使用 Sanity；瀏覽器 `localStorage` 只保存「鋒兄設定」中的 Sanity 連線資訊。

參考專案：[`goldshoot0720/fengbroaiappwrite`](https://github.com/goldshoot0720/fengbroaiappwrite)

## 介面設計（稜鏡終端 · Prism Terminal）

自家 Fresh 樣式表。資訊架構（單頁模組切換、雙列頂導、平板圖示軌、手機底欄）刻意靠近參考專案的家用工作台，
但視覺語言整套換成科技終端：色票、質感、幾何、字級與類名都是本專案寫的，不是它的樣式表或 Tailwind 工具鏈移植。
參考專案是暖紙與陶土，這版是深艙與青電，兩邊不會看起來像同一個產品。

- **色票**：暗場（深艙 `#070b11`）為原生狀態，明場是冷白藍圖；主色是青電（`--clay` / `--gold`），
  次色紫電（`--hint`），狀態色為訊號綠／琥珀／洋紅。
- **底層**：藍圖網格（雙軸 26px）+ 三道極光暈染 + 極淡掃描線，往下用遮罩淡出。
- **幾何**：沒有膠囊。圓角收到 2–10px，品牌標、主鍵、模組磚、空狀態圖示改用 `clip-path` 切角；
  主控面四角有角標，面板頂緣是一道青電→紫電的訊號線。
- **字體**：內文 Inter／系統無襯線；標籤、計數、金額、日期、網址一律等寬（`--font-mono`）+ 大寫字距，
  數字用 `tabular-nums` 對齊。
- **主題與密度**：右上角切換明場／暗場、寬距／密排；存在 `localStorage`（`fengbro.theme`、`fengbro.density`）。
  `<head>` 的 FOUC 腳本在第一幀前寫入 `<html data-theme>` / `data-density`；沒存過偏好時預設暗場，
  除非系統偏好是淺色。
- **導覽**（單頁模組切換，不是一路由一模組）：
  - 桌面（≥1024px）：上方雙列——第一列鋒兄管理／鋒兄影音／鋒兄工具／鋒兄設定（作用中是淡主色底 + 腳下發光指示條），
    第二列是該組葉片（作用中是實心青電塊）；切回某一組會還原上次葉片。
  - 平板（768–1023px）：左側圖示軌承載四組，作用中在軌內側亮一條指示線。
  - 手機（<768px）：頂部標題列 + 底部快捷（訂閱／食品／筆記／工具葉／更多），作用中在頂緣亮一條指示線；
    「更多」打開全部模組抽屜。
- **資料表**：終端帳表——大寫等寬表頭、列 hover 時第一格左緣亮起主色指示線、數字靠右 + tabular-nums、網址只顯示主機。
  勾選欄 sticky 左、操作欄 sticky 右；選取列用告警色（因為下一步是批次刪除），不是主色。
  小於 768px 改卡片，欄名讀 `td[data-label]`。
- **空狀態**：空清單（虛線框）與搜尋無結果（主色實心）是兩種畫面。
- **設定**：Sanity 鑰匙只存在這台瀏覽器。

## 功能

- 鋒兄訂閱
- 鋒兄試用／首購、重灌、額度、購物清單
- 鋒兄食品（商品庫存）
- 鋒兄筆記
- 鋒兄常用
- 鋒兄郵件、經歷、成員、雲端、主機（相容舊 Sanity Studio）
- 鋒兄圖片、影片、音樂、文件、播客
- 鋒兄銀行（電子票證）
- 鋒兄例行
- 鋒兄工具：鋒兄比價、手機比價、鋒兄Tube、鋒兄金融
- 鋒兄設定、鋒兄關於
- 每個資料模組支援新增、編輯、複製、刪除、搜尋、CSV 匯入、CSV 匯出

## Sanity 環境變數

建立 `.env` 或在部署平台設定：

```powershell
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token
SANITY_API_VERSION=v2025-02-19
```

前端「鋒兄設定」也可以保存同樣欄位作為本機覆寫。

讀取時相容既有的 Sanity 型別（`article`、`video`、`inventory`…）與舊欄名；`image` / `file`
欄位會攤平成 `cdn.sanity.io` 連結。寫入一律用 `fengbro_*` 型別。對照表在
[`lib/sanity_docs.ts`](lib/sanity_docs.ts)，完整清單見 [SANITY_SETUP.md](SANITY_SETUP.md)。

## CSV 遷移（`/migrate`）

`/migrate` 是獨立的一頁，把 Appwrite 匯出的 CSV 搬進 Sanity：

- 連線設定跟「鋒兄設定」共用同一份 `localStorage` 鑰匙
- Appwrite 系統欄（`$id`、`$createdAt`…）自動剔除，`balance → deposit` 這類舊欄名自動改名
- 送出前先列出「對上／丟棄／CSV 沒帶」哪些欄位，再附前 8 筆預覽
- 每批 50 筆寫入，失敗就停在那一批並回報已寫入筆數（寫入不會回滾）

## 開發

```powershell
deno task start
```

開啟 `http://localhost:8000`，遷移工具在 `http://localhost:8000/migrate`。

## 檢查

```powershell
deno task check
deno task test
deno task build
```

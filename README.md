[sanityfengbroai-production.up.railway.app
](https://sanityfengbroai-production.up.railway.app/)

# SanityFengBroAI

Deno Fresh 版鋒兄 AI CRUD 工作台。表格資料直接使用 Sanity；瀏覽器 `localStorage` 只保存「鋒兄設定」中的 Sanity 連線資訊。

參考專案：[`goldshoot0720/fengbroaiappwrite`](https://github.com/goldshoot0720/fengbroaiappwrite)

## 介面設計（暖紙與陶土）

自家 Fresh 樣式，調性靠近參考專案的家用工作台，但色票、類名與骨架都是本專案寫的：

- **色票**：暖紙淺底／夜紙深底，主色與作用中狀態用陶土金（`--gold` / `--clay`），不是紫藍 AI 套件漸層。
- **主題與密度**：右上角切換暖紙／夜紙、舒適／緊湊；存在 `localStorage`（`fengbro.theme`、`fengbro.density`）。`<head>` 的 FOUC 腳本在第一幀前寫入 `<html data-theme>` / `data-density`。
- **導覽**（單頁模組切換，不是一路由一模組）：
  - 桌面（≥1024px）：上方雙列——第一列鋒兄管理／鋒兄影音／鋒兄工具／鋒兄設定，第二列是該組葉片；切回某一組會還原上次葉片。
  - 平板（768–1023px）：左側圖示軌承載四組。
  - 手機（<768px）：頂部標題列 + 底部快捷（訂閱／食品／筆記／工具葉／更多）；「更多」打開全部模組。
- **資料表**：勾選欄 sticky 左、操作欄 sticky 右；數字靠右 + tabular-nums；網址只顯示主機。小於 768px 改卡片，欄名讀 `td[data-label]`。
- **空狀態**：空清單與搜尋無結果是兩種畫面。
- **設定**：Sanity 鑰匙只存在這台瀏覽器。

## 功能

- 鋒兄訂閱
- 鋒兄食品（商品庫存）
- 鋒兄筆記
- 鋒兄常用
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

## 開發

```powershell
deno task start
```

開啟 `http://localhost:8000`。

## 檢查

```powershell
deno task check
deno task build
```

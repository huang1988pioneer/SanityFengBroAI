sanityfengbroai-production.up.railway.app

# SanityFengBroAI

Deno Fresh 版鋒兄 AI CRUD 工作台。表格資料直接使用 Sanity；瀏覽器 `localStorage` 只保存「鋒兄設定」中的 Sanity 連線資訊。

參考專案：[`goldshoot0720/fengbroaiappwrite`](https://github.com/goldshoot0720/fengbroaiappwrite)

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

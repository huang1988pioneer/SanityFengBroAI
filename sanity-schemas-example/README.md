# Sanity Studio Schema 範例

這個資料夾提供鋒兄 AI CRUD 工作台可用的 Sanity schema 範例。

## 使用方式

1. 將這些 `.ts` 檔案複製到 Sanity Studio 專案的 `schemas/` 資料夾。
2. 在 `schemas/index.ts` 匯出 `schemaTypes`。
3. 在 `sanity.config.ts` 的 `schema.types` 使用 `schemaTypes`。
4. 重新啟動 Sanity Studio。

## 檔案說明

- `fengbro-subscription.ts`：鋒兄訂閱
- `fengbro-food.ts`：鋒兄食品與商品庫存
- `fengbro-notes.ts`：鋒兄筆記
- `fengbro-common.ts`：鋒兄常用
- `fengbro-images.ts`：鋒兄圖片，含 Sanity Asset metadata
- `fengbro-videos.ts`：鋒兄影片，含 Sanity Asset metadata
- `fengbro-music.ts`：鋒兄音樂，含 Sanity Asset metadata
- `fengbro-documents.ts`：鋒兄文件，含 Sanity Asset metadata
- `fengbro-podcast.ts`：鋒兄播客，含 Sanity Asset metadata
- `fengbro-bank.ts`：鋒兄銀行與電子票證
- `fengbro-routine.ts`：鋒兄例行
- `index.ts`：集中匯出 schema

## sanity.config.ts 範例

```ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'default',
  title: '鋒兄 AI',
  projectId: 'your-project-id',
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
```

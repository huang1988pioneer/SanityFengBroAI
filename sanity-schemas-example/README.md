# Sanity Studio Schema 範例

這個資料夾包含了鋒兄 AI 工作台所需的所有 Sanity Schema 定義。

## 使用方法

1. 將此資料夾中的所有 `.ts` 文件複製到你的 Sanity Studio 項目的 `schemas/` 目錄
2. 在 `sanity.config.ts` 中導入並註冊這些 schema
3. 重新啟動 Sanity Studio

## 文件列表

- `fengbro-subscription.ts` - 訂閱管理
- `fengbro-food.ts` - 食品庫存
- `fengbro-notes.ts` - 筆記
- `fengbro-common.ts` - 常用帳號
- `fengbro-images.ts` - 圖片
- `fengbro-videos.ts` - 影片
- `fengbro-music.ts` - 音樂
- `fengbro-documents.ts` - 文件
- `fengbro-podcast.ts` - 播客
- `fengbro-bank.ts` - 銀行/票證
- `fengbro-routine.ts` - 例行事項
- `index.ts` - 統一導出

## sanity.config.ts 範例

\`\`\`typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'default',
  title: '鋒兄 AI',
  projectId: 'your-project-id',
  dataset: 'production',
  
  plugins: [
    structureTool(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
\`\`\`

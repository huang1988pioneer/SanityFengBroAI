# Sanity Studio 設定指南

## 問題說明

如果你在 Sanity Studio 看到 "No documents of this type"，但應用顯示有資料，這表示：

1. 資料可能還在瀏覽器 localStorage 中（舊版本）
2. 或 Sanity Studio 的 Schema 尚未定義這些文檔類型

## 解決方案

### 方案 1：使用資料遷移工具

1. 訪問 `http://localhost:8000/migrate`
2. 填寫 Sanity 連線設定（跟「鋒兄設定」共用同一份 `localStorage` 鑰匙，設定過就會自動帶入）：
   - Project ID
   - Dataset
   - API Token（需要 Write 權限）
   - API Version
3. 選擇要遷移的模組（例如：鋒兄訂閱）
4. 從 Appwrite 或本應用匯出 CSV，貼進遷移工具或直接選檔
5. 看「3 · 對照與預覽」確認欄位：
   - **對上 N 欄**：會寫進 Sanity 的欄位；`balance → deposit` 這類舊欄名會標出改名後的目標
   - **丟棄 N 欄**：這個模組存不下的表頭，不會寫進文件
   - **CSV 沒帶 N 欄**：模組有、但這份 CSV 缺的欄位
   - Appwrite 的系統欄（`$id`、`$createdAt`、`$updatedAt`、`$permissions`…）會自動剔除，不列入丟棄
6. 點擊「開始遷移」。每批 50 筆送出，進度條會走完；**寫入不會回滾**，某一批失敗就停在那裡，紀錄會寫出已成功幾筆

### 方案 2：在 Sanity Studio 定義 Schema

在你的 Sanity Studio 項目中，需要定義以下文檔類型：

#### 創建 schemas/fengbro-subscription.ts

\`\`\`typescript
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_subscription',
  title: '鋒兄訂閱',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名稱',
      type: 'string',
    }),
    defineField({
      name: 'site',
      title: '網站',
      type: 'url',
    }),
    defineField({
      name: 'price',
      title: '價格',
      type: 'number',
    }),
    defineField({
      name: 'nextdate',
      title: '下次日期',
      type: 'date',
    }),
    defineField({
      name: 'note',
      title: '備註',
      type: 'text',
    }),
    defineField({
      name: 'account',
      title: '帳號',
      type: 'string',
    }),
    defineField({
      name: 'currency',
      title: '幣別',
      type: 'string',
    }),
    defineField({
      name: 'continue',
      title: '續訂',
      type: 'boolean',
    }),
  ],
})
\`\`\`

#### 創建 schemas/fengbro-food.ts

\`\`\`typescript
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_food',
  title: '鋒兄食品',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名稱',
      type: 'string',
    }),
    defineField({
      name: 'amount',
      title: '庫存',
      type: 'number',
    }),
    defineField({
      name: 'todate',
      title: '到期日',
      type: 'datetime',
    }),
    defineField({
      name: 'photo',
      title: '照片',
      type: 'url',
    }),
    defineField({
      name: 'price',
      title: '價格',
      type: 'number',
    }),
    defineField({
      name: 'shop',
      title: '店家',
      type: 'string',
    }),
    defineField({
      name: 'photohash',
      title: '照片雜湊',
      type: 'string',
    }),
  ],
})
\`\`\`

#### 在 sanity.config.ts 中註冊

\`\`\`typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import fengbroSubscription from './schemas/fengbro-subscription'
import fengbroFood from './schemas/fengbro-food'
// ... 其他 schema imports

export default defineConfig({
  name: 'default',
  title: 'Your Project',
  projectId: 'your-project-id',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [
      fengbroSubscription,
      fengbroFood,
      // ... 其他 schema types
    ],
  },
})
\`\`\`

## 完整的 Schema 類型列表

新文件一律寫進「寫入型別」那一欄；「相容讀取型別」是既有資料可能用的舊名稱，
應用讀取時會一併撈進來，但不會拿它們建新文件。對照表的實體在
`lib/sanity_docs.ts` 的 `moduleTypeAliases`。

| 模組 | 寫入型別 | 相容讀取型別 | 說明 |
|------|----------|--------------|------|
| subscription | fengbro_subscription | subscription | 訂閱管理 |
| trialpurchase | fengbro_trialpurchase | trialpurchase | 試用／首購 |
| reinstall | fengbro_reinstall | reinstall | 重灌清單 |
| quota | fengbro_quota | quota | 額度（不含同步憑證） |
| food | fengbro_food | food, inventory | 食品庫存 |
| shoppinglist | fengbro_shoppinglist | shoppinglist | 購物清單 |
| notes | fengbro_notes | article, notes | 筆記 |
| common | fengbro_common | commonaccount, common | 常用帳號 |
| mail | fengbro_mail | mail | 郵件 |
| experience | fengbro_experience | experience | 經歷 |
| member | fengbro_member | member | 成員 |
| cloud | fengbro_cloud | cloud | 雲端 |
| host | fengbro_host | host | 主機 |
| images | fengbro_images | images | 圖片 |
| videos | fengbro_videos | videos, video | 影片 |
| music | fengbro_music | music | 音樂 |
| documents | fengbro_documents | documents | 文件 |
| podcast | fengbro_podcast | podcast | 播客 |
| bank | fengbro_bank | bank | 銀行/票證 |
| routine | fengbro_routine | routine | 例行事項 |
| tools | fengbro_tools | tools | 鋒兄工具 |
| about | fengbro_about | about | 鋒兄關於 |

`article`、`video`、`inventory` 這幾個是 `goldshoot0720/sanitygoldshoot0720`
Studio 現場已經在用的型別。它們的欄名跟工作台不完全一樣（`article.name`、
`routine.date1`、`inventory.imgurl`…），讀進來時會投影成工作台欄位；`image` /
`file` 這類物件欄位則會攤平成 `cdn.sanity.io` 連結，表格才不會出現
`[object Object]`。

## 快速測試

1. 在應用中點擊"鋒兄設定"
2. 填寫 Sanity 連線設定
3. 點擊"🔍 測試 Sanity 連線"
4. 查看連線診斷結果

## 常見問題

### Q: 為什麼 Sanity Studio 顯示 "No documents"？

A: 有兩個可能：
   1. Schema 類型未定義（按上面步驟定義）
   2. 資料確實沒寫入（使用遷移工具導入）

### Q: 如何從 Appwrite CSV 遷移？

A: 
   1. 從 Appwrite 匯出 CSV
   2. 訪問 `/migrate` 頁面
   3. 選擇對應模組和 CSV 格式
   4. 貼上 CSV 內容並遷移

### Q: API Token 權限要求？

A: Token 需要有 Editor 或 Admin 角色，才能執行 create/update/delete 操作

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_music',
  title: '鋒兄音樂',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '標題', type: 'string' }),
    defineField({ name: 'url', title: '連結', type: 'url' }),
    defineField({ name: 'assetId', title: 'Sanity Asset ID', type: 'string' }),
    defineField({ name: 'filename', title: '檔名', type: 'string' }),
    defineField({ name: 'mimeType', title: 'MIME 類型', type: 'string' }),
    defineField({ name: 'size', title: '大小 bytes', type: 'number' }),
    defineField({ name: 'category', title: '分類', type: 'string' }),
    defineField({ name: 'date', title: '日期', type: 'date' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
  ],
})

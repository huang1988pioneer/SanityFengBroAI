import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_music',
  title: '鋒兄音樂',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '標題', type: 'string' }),
    defineField({ name: 'url', title: '連結', type: 'url' }),
    defineField({ name: 'category', title: '分類', type: 'string' }),
    defineField({ name: 'date', title: '日期', type: 'date' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
  ],
})

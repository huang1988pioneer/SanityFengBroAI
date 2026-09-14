import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_tools',
  title: '鋒兄工具',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '工具名稱', type: 'string' }),
    defineField({ name: 'kind', title: '子項目', type: 'string' }),
    defineField({ name: 'url', title: '連結', type: 'url' }),
    defineField({ name: 'query', title: '預設查詢', type: 'string' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
  ],
})

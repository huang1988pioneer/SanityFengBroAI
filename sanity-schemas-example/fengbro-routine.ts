import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_routine',
  title: '鋒兄例行',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '標題', type: 'string' }),
    defineField({ name: 'frequency', title: '頻率', type: 'string' }),
    defineField({ name: 'time', title: '時間', type: 'string' }),
    defineField({ name: 'description', title: '描述', type: 'text', rows: 4 }),
    defineField({ name: 'active', title: '啟用', type: 'boolean', initialValue: true }),
  ],
})

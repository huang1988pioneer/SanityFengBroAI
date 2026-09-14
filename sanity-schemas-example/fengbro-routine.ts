import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_routine',
  title: '鋒兄例行',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
    defineField({ name: 'lastdate1', title: '日期 1', type: 'datetime' }),
    defineField({ name: 'lastdate2', title: '日期 2', type: 'datetime' }),
    defineField({ name: 'lastdate3', title: '日期 3', type: 'datetime' }),
    defineField({ name: 'link', title: '連結', type: 'url' }),
    defineField({ name: 'photo', title: '照片', type: 'url' }),
  ],
})

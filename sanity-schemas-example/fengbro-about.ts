import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_about',
  title: '鋒兄關於',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '標題', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'value', title: '內容', type: 'text', rows: 6 }),
  ],
})

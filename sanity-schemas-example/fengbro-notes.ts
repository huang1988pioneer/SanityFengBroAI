import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_notes',
  title: '鋒兄筆記',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '標題',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: '分類',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: '內容',
      type: 'text',
      rows: 10,
    }),
    defineField({
      name: 'tags',
      title: '標籤',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: '日期',
      type: 'date',
    }),
  ],
})

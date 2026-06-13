import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_common',
  title: '鋒兄常用',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名稱',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: '分類',
      type: 'string',
    }),
    defineField({
      name: 'url',
      title: '連結',
      type: 'url',
    }),
    defineField({
      name: 'account',
      title: '帳號',
      type: 'string',
    }),
    defineField({
      name: 'password',
      title: '密碼',
      type: 'string',
    }),
    defineField({
      name: 'note',
      title: '備註',
      type: 'text',
      rows: 4,
    }),
  ],
})

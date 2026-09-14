import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_cloud',
  title: '鋒兄雲端',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'site', title: '網站', type: 'url' }),
    defineField({ name: 'account', title: '帳號', type: 'string' }),
    defineField({ name: 'space', title: '容量', type: 'number', initialValue: 0 }),
  ],
})

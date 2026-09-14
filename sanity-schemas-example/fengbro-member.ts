import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_member',
  title: '鋒兄成員',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'title', title: '職稱', type: 'string' }),
    defineField({ name: 'relation', title: '關係', type: 'string' }),
    defineField({ name: 'gov', title: '單位', type: 'string' }),
    defineField({ name: 'site', title: '網站', type: 'url' }),
    defineField({ name: 'img', title: '頭像', type: 'url' }),
  ],
})

import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_experience',
  title: '鋒兄經歷',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '標題', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'year', title: '年份', type: 'number' }),
    defineField({ name: 'gov', title: '單位', type: 'string' }),
    defineField({ name: 'site', title: '網站', type: 'url' }),
  ],
})

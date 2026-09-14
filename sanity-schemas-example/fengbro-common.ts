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
    defineField({ name: 'site01', title: '網站 01', type: 'string' }),
    defineField({ name: 'note01', title: '備註 01', type: 'string' }),
    defineField({ name: 'site02', title: '網站 02', type: 'string' }),
    defineField({ name: 'note02', title: '備註 02', type: 'string' }),
    defineField({ name: 'site03', title: '網站 03', type: 'string' }),
    defineField({ name: 'note03', title: '備註 03', type: 'string' }),
    defineField({ name: 'site04', title: '網站 04', type: 'string' }),
    defineField({ name: 'note04', title: '備註 04', type: 'string' }),
  ],
})

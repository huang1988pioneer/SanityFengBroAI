import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_mail',
  title: '鋒兄郵件',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'host', title: '主機', type: 'string' }),
    defineField({ name: 'address', title: '地址', type: 'string' }),
    defineField({ name: 'account', title: '帳號', type: 'string' }),
    defineField({ name: 'url', title: '網址', type: 'url' }),
  ],
})

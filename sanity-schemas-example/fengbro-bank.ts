import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_bank',
  title: '鋒兄銀行',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'deposit', title: '餘額', type: 'number', initialValue: 0 }),
    defineField({ name: 'site', title: '網站', type: 'url' }),
    defineField({ name: 'address', title: '地址', type: 'string' }),
    defineField({ name: 'withdrawals', title: '提款次數', type: 'number', initialValue: 0 }),
    defineField({ name: 'transfer', title: '轉帳次數', type: 'number', initialValue: 0 }),
    defineField({ name: 'activity', title: '活動', type: 'url' }),
    defineField({ name: 'card', title: '卡片', type: 'string' }),
    defineField({ name: 'account', title: '帳號', type: 'string' }),
  ],
})

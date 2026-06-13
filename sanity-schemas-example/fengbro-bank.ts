import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_bank',
  title: '鋒兄銀行',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '名稱', type: 'string' }),
    defineField({ name: 'type', title: '類型', type: 'string' }),
    defineField({ name: 'balance', title: '餘額', type: 'number' }),
    defineField({ name: 'account', title: '帳號', type: 'string' }),
    defineField({ name: 'bank', title: '銀行', type: 'string' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
  ],
})

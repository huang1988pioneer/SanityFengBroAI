import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_trialpurchase',
  title: '鋒兄試用／首購',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '服務名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'eventDate', title: '活動日期', type: 'datetime' }),
    defineField({ name: 'firstPurchasePrice', title: '首購價格', type: 'number', initialValue: 0 }),
    defineField({ name: 'regularPrice', title: '原價', type: 'number', initialValue: 0 }),
    defineField({ name: 'account', title: '帳號', type: 'string' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
    defineField({
      name: 'trialStatus', title: '試用狀態', type: 'string', initialValue: 'untried', options: {
        list: [
          { title: '未試用', value: 'untried' },
          { title: '試用中', value: 'trialing' },
          { title: '已試用', value: 'tried' },
          { title: '無試用', value: 'no_trial' },
        ],
      },
    }),
    defineField({
      name: 'purchaseStatus', title: '首購狀態', type: 'string', initialValue: 'not_purchased', options: {
        list: [
          { title: '無首購', value: 'not_purchased' },
          { title: '首購中', value: 'purchasing' },
          { title: '已首購', value: 'purchased' },
          { title: '無提供首購', value: 'unavailable' },
        ],
      },
    }),
  ],
})

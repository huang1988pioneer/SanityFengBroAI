import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_subscription',
  title: '鋒兄訂閱',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名稱',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'site',
      title: '網站',
      type: 'url',
    }),
    defineField({
      name: 'price',
      title: '價格',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'nextdate',
      title: '下次日期',
      type: 'date',
    }),
    defineField({
      name: 'note',
      title: '備註',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'account',
      title: '帳號',
      type: 'string',
    }),
    defineField({
      name: 'currency',
      title: '幣別',
      type: 'string',
      initialValue: 'TWD',
      options: {
        list: [
          { title: '台幣 (TWD)', value: 'TWD' },
          { title: '美元 (USD)', value: 'USD' },
          { title: '人民幣 (CNY)', value: 'CNY' },
          { title: '日幣 (JPY)', value: 'JPY' },
        ],
      },
    }),
    defineField({
      name: 'continue',
      title: '續訂',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'nextdate',
      price: 'price',
      currency: 'currency',
    },
    prepare({ title, subtitle, price, currency }) {
      return {
        title: title || '未命名訂閱',
        subtitle: subtitle ? `${subtitle} | ${price} ${currency}` : `${price} ${currency}`,
      }
    },
  },
})

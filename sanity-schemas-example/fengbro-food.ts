import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_food',
  title: '鋒兄食品',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名稱',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'amount',
      title: '庫存',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'todate',
      title: '到期日',
      type: 'datetime',
    }),
    defineField({
      name: 'photo',
      title: '照片',
      type: 'url',
    }),
    defineField({
      name: 'price',
      title: '價格',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'shop',
      title: '店家',
      type: 'string',
    }),
    defineField({
      name: 'photohash',
      title: '照片雜湊',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      amount: 'amount',
      todate: 'todate',
      photo: 'photo',
    },
    prepare({ title, amount, todate, photo }) {
      return {
        title: title || '未命名食品',
        subtitle: todate ? `庫存: ${amount} | 到期: ${new Date(todate).toLocaleDateString('zh-TW')}` : `庫存: ${amount}`,
        media: photo ? { url: photo } : undefined,
      }
    },
  },
})

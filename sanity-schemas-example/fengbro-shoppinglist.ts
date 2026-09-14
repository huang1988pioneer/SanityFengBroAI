import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_shoppinglist',
  title: '鋒兄購物清單',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '商品名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'plannedDate', title: '預定購買日', type: 'datetime' }),
    defineField({ name: 'price', title: '預定價格', type: 'number', initialValue: 0 }),
    defineField({ name: 'currency', title: '幣別', type: 'string', initialValue: 'TWD', options: { list: [{ title: '台幣 (TWD)', value: 'TWD' }, { title: '美元 (USD)', value: 'USD' }, { title: '日圓 (JPY)', value: 'JPY' }, { title: '人民幣 (CNY)', value: 'CNY' }] } }),
    defineField({ name: 'quantity', title: '數量', type: 'number', initialValue: 1, validation: Rule => Rule.min(1) }),
    defineField({ name: 'shop', title: '預定商店', type: 'string' }),
    defineField({ name: 'pickupMethod', title: '取貨方式', type: 'string' }),
    defineField({ name: 'imageUrl', title: '商品圖片', type: 'url' }),
    defineField({ name: 'account', title: '帳號', type: 'string' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
  ],
})

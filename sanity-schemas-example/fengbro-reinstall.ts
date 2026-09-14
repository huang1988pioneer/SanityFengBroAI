import { defineField, defineType } from 'sanity'

const currencies = [
  { title: '台幣 (TWD)', value: 'TWD' },
  { title: '美元 (USD)', value: 'USD' },
  { title: '日圓 (JPY)', value: 'JPY' },
  { title: '人民幣 (CNY)', value: 'CNY' },
]

export default defineType({
  name: 'fengbro_reinstall',
  title: '鋒兄重灌',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '軟體名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'category', title: '分類', type: 'string' }),
    defineField({ name: 'system', title: '系統', type: 'string', initialValue: 'win', options: { list: [{ title: 'Windows', value: 'win' }, { title: 'Mac', value: 'mac' }] } }),
    defineField({ name: 'softwareType', title: '軟體類型', type: 'string', initialValue: 'free', options: { list: [{ title: '試用軟體', value: 'trial' }, { title: '免費軟體', value: 'free' }, { title: '付費軟體', value: 'paid' }] } }),
    defineField({ name: 'licenseType', title: '授權方式', type: 'string', initialValue: 'none', options: { list: [{ title: '無序號', value: 'none' }, { title: '付費序號', value: 'paid_serial' }] } }),
    defineField({ name: 'serial', title: '序號', type: 'string' }),
    defineField({ name: 'viewPassword', title: '檢視密碼', type: 'string' }),
    defineField({ name: 'subscriptionSoftware', title: '訂閱制軟體', type: 'boolean', initialValue: false }),
    defineField({ name: 'subscriptionPeriod', title: '訂閱週期', type: 'string' }),
    defineField({ name: 'subscriptionPrice', title: '訂閱價格', type: 'number', initialValue: 0 }),
    defineField({ name: 'subscriptionCurrency', title: '訂閱幣別', type: 'string', initialValue: 'TWD', options: { list: currencies } }),
    defineField({ name: 'site', title: '軟體網站', type: 'url' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
  ],
})

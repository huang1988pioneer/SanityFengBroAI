import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fengbro_quota',
  title: '鋒兄額度',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '服務名稱', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'serviceType', title: '服務類型', type: 'string', initialValue: 'general', options: { list: [{ title: '一般', value: 'general' }, { title: 'AI 服務', value: 'ai' }] } }),
    defineField({ name: 'account', title: '帳號', type: 'string' }),
    defineField({ name: 'quotaRemaining', title: '剩餘額度', type: 'number', initialValue: 0 }),
    defineField({ name: 'quotaPoints', title: '剩餘點數', type: 'number', initialValue: 0 }),
    defineField({ name: 'litmediaAccount', title: 'LitMedia 帳號', type: 'string' }),
    defineField({ name: 'pointsSyncedAt', title: '點數同步時間', type: 'datetime' }),
    defineField({ name: 'quotaRatio', title: '額度剩餘比例', type: 'number', initialValue: 0 }),
    defineField({ name: 'quotaExpiry', title: '額度到期', type: 'datetime' }),
    defineField({ name: 'usageSyncedAt', title: '用量同步時間', type: 'datetime' }),
    defineField({ name: 'ratio5h', title: '5 小時比例', type: 'number', initialValue: 0 }),
    defineField({ name: 'expiry5h', title: '5 小時到期', type: 'string' }),
    defineField({ name: 'ratioWeek', title: '一週比例', type: 'number', initialValue: 0 }),
    defineField({ name: 'expiryWeek', title: '一週到期', type: 'date' }),
    defineField({ name: 'ratioMonth', title: '一月比例', type: 'number', initialValue: 0 }),
    defineField({ name: 'expiryMonth', title: '一月到期', type: 'date' }),
    defineField({ name: 'resetCreditsBalance', title: '重置額度', type: 'number', initialValue: 0 }),
    defineField({ name: 'resetCreditsExpiry', title: '重置額度到期', type: 'string' }),
    defineField({ name: 'note', title: '備註', type: 'text', rows: 4 }),
  ],
})

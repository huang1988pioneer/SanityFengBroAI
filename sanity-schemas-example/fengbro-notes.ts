import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'fengbro_notes',
  title: '鋒兄筆記',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '標題',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: '內容',
      type: 'text',
      rows: 10,
    }),
    defineField({
      name: 'category',
      title: '分類',
      type: 'string',
    }),
    defineField({
      name: 'newDate',
      title: '新增日期',
      type: 'date',
    }),
    defineField({ name: 'url1', title: '連結 1', type: 'url' }),
    defineField({ name: 'url2', title: '連結 2', type: 'url' }),
    defineField({ name: 'url3', title: '連結 3', type: 'url' }),
    defineField({ name: 'file1', title: '檔案 1', type: 'url' }),
    defineField({ name: 'file1name', title: '檔名 1', type: 'string' }),
    defineField({ name: 'file1type', title: '檔案類型 1', type: 'string' }),
    defineField({ name: 'file2', title: '檔案 2', type: 'url' }),
    defineField({ name: 'file2name', title: '檔名 2', type: 'string' }),
    defineField({ name: 'file2type', title: '檔案類型 2', type: 'string' }),
    defineField({ name: 'file3', title: '檔案 3', type: 'url' }),
    defineField({ name: 'file3name', title: '檔名 3', type: 'string' }),
    defineField({ name: 'file3type', title: '檔案類型 3', type: 'string' }),
  ],
})

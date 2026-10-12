import { state, t } from './index'

// Stored memorial dates stay canonical; only the displayed text is localized.
export function formatMemorialDate(value) {
  if (!value || typeof value !== 'string' || state.locale === 'zh-CN') return value
  const solar = value.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*$/)
  if (solar) return t('{year}年{month}月{day}日', { year: solar[1], month: solar[2], day: solar[3] })
  const lunar = value.match(/^(\d{4})年([闰閏]?(?:正|冬|腊|臘|十二|十一|十|[二三四五六七八九])月)(.+?)\s*$/)
  if (lunar) return t('旧历日期显示', { year: lunar[1], month: t(lunar[2].replace('閏', '闰').replace('臘', '腊')), day: t(lunar[3]) })
  return value
}

export function datePickerOptions() {
  return {
    calType: { show: false },
    translate: t,
    formatDate: formatMemorialDate,
    formatYear: (year, description) => /^(zh|ja)/.test(state.locale) ? year + description : String(year)
  }
}

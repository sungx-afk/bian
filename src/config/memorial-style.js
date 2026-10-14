// 展示风格与已选择的界面语言绑定，不增加单独的模式设置。
export function getMemorialStyle(locale) {
  return ['zh-CN', 'zh-TW'].indexOf(locale) >= 0 ? 'chinese' : 'western'
}

// 主题 1 的视觉素材单独区分国家风格，点烛等业务模式继续沿用上面的规则。
export function getMemorialThemeVariant(locale) {
  if (locale === 'ja') return 'japanese'
  if (locale === 'ko') return 'korean'
  return getMemorialStyle(locale)
}

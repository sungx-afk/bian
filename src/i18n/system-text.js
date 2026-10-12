import { t } from './index'
import { formatMemorialDate } from './dates'

// Only use this at system-log display boundaries, never on messages or biographies.
// These templates come from SpaceController, Product.logTpl and UserController.
const offeringActions = [
  '点蜡烛', '上香', '烧纸钱', '送鲜花', '祭红烧肉', '祭鸡', '祭茅台',
  '祭米饭', '祭馒头', '祭鸭', '祭鱼', '祭拜', '祭烤鸭', '祭月饼',
  '祭五粮液', '祭水果', '祭花圈', '祭瓜果', '祭香烛(长燃)', '点长明灯', '祭酒席'
]

export function formatSystemText(value) {
  if (typeof value !== 'string' || !value) return value
  if (value.indexOf('上次祭拜：') === 0) {
    const relative = value.slice('上次祭拜：'.length)
    const match = relative.match(/^(\d+)(秒|分钟|小时|天|月|年)前$/)
    const time = match ? t('{count}' + match[2] + '前', { count: match[1] }) : formatMemorialDate(t(relative))
    return t('上次祭拜：{time}', { time })
  }
  const credit = value.match(/^(新用户注册，)?系统赠送(\d+(?:\.\d+)?)云币$/)
  if (credit) return t(credit[1] ? '新用户注册，系统赠送{count}云币' : '系统赠送{count}云币', { count: credit[2] })
  for (const action of offeringActions) {
    if (value.length >= action.length && value.slice(-action.length) === action) {
      return t('{name}' + action, { name: value.slice(0, -action.length) })
    }
  }
  return t(value)
}

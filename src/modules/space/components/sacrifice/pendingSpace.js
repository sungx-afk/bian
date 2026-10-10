// 列表点击进馆时，把列表项里已包含的 backgroundId 临时存下来，
// 供祭拜页 created() 在 getSpaceDetail 异步返回前先据此应用主题，
// 避免进馆先闪默认主题(theme_1)再切到设置的主题。
// （列表项已是完整 Space 实体，但缺 products/logs 等详情接口动态计算的字段，
//   故只透传 backgroundId，不整体替换 this.space，以免计算属性访问 products 报错）
let pendingBackgroundId = null

export function setPendingBackgroundId (space) {
  pendingBackgroundId = space && (space.backgroundId || 1)
}

export function consumePendingBackgroundId () {
  const id = pendingBackgroundId
  pendingBackgroundId = null
  return id
}

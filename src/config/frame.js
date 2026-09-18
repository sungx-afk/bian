/**
 * 相框（遗像框）配置表
 *
 * 图片统一放在 src/modules/space/components/sacrifice/images/ 下，
 * 命名格式：item_xiang_kuang_<key>.png，尺寸与 item_xiang_kuang_black.png 保持一致，
 * 渲染时沿用 .xiang_kuang 的 background-size: cover 处理，不需要按布局单独适配。
 *
 * 新增相框步骤：
 *   1. 把同尺寸图片按命名格式放入上述 images 目录
 *   2. 在 FRAMES 末尾追加一项 { id, key, title }
 *   3. 在 frameImages 中增加一条同名 key 的 require
 *
 * 注意：id 需与服务端 space.frameId 的取值保持一致；
 * 若 frameId 缺失或未匹配到任何一项（含老数据），回退到 DEFAULT_FRAME_ID。
 */

//默认相框：经典黑，与改造前的固定相框保持一致
export const DEFAULT_FRAME_ID = 1

export const FRAMES = [
  { id: 1, key: 'black', title: '经典黑', slice: [80, 120, 90, 110] },
  { id: 2, key: 'cream', title: '米白', slice: [80, 120, 90, 110] },
  { id: 3, key: 'gray', title: '雅灰', slice: [80, 120, 90, 110] },
  { id: 4, key: 'oak', title: '原木', slice: [80, 120, 90, 110] },
  { id: 5, key: 'baroque', title: '巴洛克', slice: [140, 185, 140, 170] },
  { id: 6, key: 'silver', title: '银雕', slice: [100, 170, 110, 170] },
]

const frameImages = {
  black: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_black.png'),
  cream: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_cream.png'),
  gray: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_gray.png'),
  oak: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_oak.png'),
  baroque: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_baroque.png'),
  silver: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_silver.png'),
}

//合影（combine）模式用的横版相框：竖版图顺时针旋转90°生成（test/make_combine_frames.py）
const combineFrameImages = {
  black: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_black_h.png'),
  cream: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_cream_h.png'),
  gray: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_gray_h.png'),
  oak: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_oak_h.png'),
  baroque: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_baroque_h.png'),
  silver: require('@/modules/space/components/sacrifice/images/item_xiang_kuang_silver_h.png'),
}

/*根据 frameId 取相框配置，取不到（含 frameId 为空、非法值）时回退默认相框*/
export const getFrame = (frameId) => {
  let frame = FRAMES.filter(item => item.id === Number(frameId))[0]
  if (!frame) {
    frame = FRAMES.filter(item => item.id === DEFAULT_FRAME_ID)[0]
  }
  return frame
}

/*根据 frameId 取相框图片地址*/
export const getFrameImage = (frameId) => {
  const frame = getFrame(frameId)
  return frameImages[frame.key] || frameImages.black
}

/*根据 frameId 取合影模式横版相框图片地址*/
export const getFrameCombineImage = (frameId) => {
  const frame = getFrame(frameId)
  return combineFrameImages[frame.key] || combineFrameImages.black
}

/*取全部相框（含图片地址），供相框选择弹窗使用*/
export const getFrames = () => FRAMES.map(item => ({
  id: item.id,
  key: item.key,
  title: item.title,
  image: frameImages[item.key]
}))


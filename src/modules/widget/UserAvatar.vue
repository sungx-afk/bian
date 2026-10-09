<template>
  <!-- 有头像显示图片；无头像显示「名字最后一个字 + 稳定背景色」占位（同一用户颜色固定） -->
  <img class="avatar" v-if="url" :src="url" :style="{ width: sizePx, height: sizePx }">
  <div class="avatar avatar-fallback" v-else :style="{ width: sizePx, height: sizePx, fontSize: fontSize, background: color }">{{ char }}</div>
</template>

<script>
export default {
  name: 'UserAvatar',
  props: {
    // 头像图片地址，为空时走占位
    url: { type: String, default: '' },
    // 用户昵称（取最后一个字做占位）
    name: { type: String, default: '' },
    // 用户 id（参与取色哈希，保证同一用户颜色稳定）
    uid: { type: [String, Number], default: '' },
    // 头像边长（px），默认 50
    size: { type: Number, default: 50 }
  },
  computed: {
    sizePx(){
      return this.size + 'px'
    },
    fontSize(){
      return Math.round(this.size * 0.44) + 'px'
    },
    char(){
      const n = this.name || ''
      return n ? n.slice(-1) : '客'
    },
    color(){
      const colors = ['#E8A87C', '#83B5D1', '#A5C882', '#D6A2C8', '#F2C57C', '#8FCACA', '#C98BB9', '#7FB685']
      const key = String(this.uid || '') + (this.name || '')
      let h = 0
      for (let i = 0; i < key.length; i++) {
        h = (h * 31 + key.charCodeAt(i)) % 997
      }
      return colors[h % colors.length]
    }
  }
}
</script>

<style rel="stylesheet/less" lang="less" scoped>
  .avatar-fallback{
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
    color: #fff;
    font-weight: bold;
    user-select: none;
  }
</style>

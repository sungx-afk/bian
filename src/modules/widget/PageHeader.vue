<template>
  <div class="page-header">
    <div class="back-btn" @click.stop="goBack" aria-label="返回">
      <i class="chevron"></i>
    </div>
    <div class="title">{{ title }}</div>
    <div class="right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
  /**
   * 统一页面顶部栏：返回按钮 + 居中标题
   * 与纪念馆详情页的顶区同一套视觉（主题色 #825621 实色），
   * 箭头用 CSS 画，不依赖图标字体；触控区 44px。
   */
  export default {
    name: 'PageHeader',
    props: {
      title: {
        type: String,
        default: ''
      },
      // 返回时是否用 $router.back()，false 时走 go(-1)
      nativeBack: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      goBack() {
        if (this.$listeners && this.$listeners.back) {
          this.$emit('back')
          return
        }
        this.$router.go(-1)
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .page-header {
    position: relative;
    height: 48px;
    padding: 0 12px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    background: @MAIN_THEME_COLOR;
    color: #fff;

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
      &:active {
        background: rgba(255, 255, 255, 0.16);
      }
      .chevron {
        width: 11px;
        height: 11px;
        border-left: 2px solid #fff;
        border-bottom: 2px solid #fff;
        transform: rotate(45deg);
        margin-left: 4px;
      }
    }

    .title {
      flex: 1;
      text-align: center;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 1px;
      margin-right: 40px;   // 抵消左侧按钮宽度，保证标题居中
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .right {
      position: absolute;
      right: 12px;
      top: 0;
      height: 48px;
      display: flex;
      align-items: center;
      color: rgba(255, 255, 255, 0.92);
    }
  }
</style>

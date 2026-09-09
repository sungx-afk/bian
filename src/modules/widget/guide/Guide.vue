<template>
  <transition name="guide-fade">
    <div class="guide-mask">
      <div class="guide-content">
        <img class="guide-logo" :src="logo" />
        <div class="guide-title">{{ title }}</div>
        <div class="guide-slogan">{{ slogan }}</div>
        <div class="guide-desc" v-html="desc"></div>
        <van-button class="guide-enter"
                    type="default"
                    @click.stop="enter">
          {{ buttonText }}
        </van-button>
        <div class="guide-tip" v-if="tip">{{ tip }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
  /**
   * Guide 引导页组件
   * ------------------------------------------------------------
   * 用法（父组件控制显隐）：
   *   <Guide v-if="showGuideFlag" @enter="onGuideEnter" />
   *
   * 流程：
   *   1. 父组件在合适时机把 showGuideFlag 置为 true，本组件被挂载并显示
   *   2. 用户点击“进入”按钮 -> 触发 @enter 事件 -> 父组件执行 authWechat()
   *   3. 父组件处理完（记录已展示、关闭引导页）后把 showGuideFlag 置为 false，本组件被卸载
   *
   * 说明：
   *   - “是否已展示过”的判断、storage 记录统一由父组件负责，本组件只负责展示 + 通知
   * ------------------------------------------------------------
   */
  export default {
    name: 'Guide',
    props: {
      // 品牌 logo
      logo: {
        type: String,
        default: require('@/modules/images/index_header.jpg')
      },
      // 主标题
      title: {
        type: String,
        default: '彼岸思念'
      },
      // 标语（副标题）
      slogan: {
        type: String,
        default: '爱，永存'
      },
      // 描述文案（支持 <br/>）
      desc: {
        type: String,
        default: '为逝去的亲友创建一个永久的纪念馆<br/>在线追悼 · 留言祈福 · 私密祭奠'
      },
      // 按钮文字
      buttonText: {
        type: String,
        default: '进入纪念馆'
      },
      // 底部提示
      tip: {
        type: String,
        default: '点击进入即表示同意获取微信授权以登录'
      }
    },
    methods: {
      /**
       * 用户点击“进入纪念馆”
       */
      enter() {
        // 通知父组件：此时再执行 authWechat() 走微信授权
        this.$emit('enter')
      }
    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  /* ===== 引导页 ===== */
  .guide-mask {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #2b2b3a 0%, #1a1a26 100%);
    .guide-content {
      width: 80%;
      text-align: center;
      color: #fff;
      .guide-logo {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.6);
        margin-bottom: 18px;
        object-fit: cover;
      }
      .guide-title {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 2px;
      }
      .guide-slogan {
        margin-top: 8px;
        font-size: 18px;
        color: #d4b887;
        letter-spacing: 4px;
      }
      .guide-desc {
        margin: 28px 0 36px;
        font-size: 14px;
        line-height: 1.8;
        color: rgba(255, 255, 255, 0.75);
      }
      .guide-enter {
        width: 100%;
        height: 44px;
        border: none;
        border-radius: 22px;
        color: #fff;
        font-size: 16px;
        background-color: @MAIN_THEME_COLOR;
      }
      .guide-tip {
        margin-top: 14px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }
  .guide-fade-enter-active,
  .guide-fade-leave-active {
    transition: opacity 0.4s;
  }
  .guide-fade-enter,
  .guide-fade-leave-to {
    opacity: 0;
  }
</style>

<template>
  <transition name="guide-fade">
    <div class="guide-mask">
      <div class="guide-content">
        <img class="guide-logo" :src="logo" />
        <div class="guide-title">{{ title }}</div>
        <div class="guide-slogan">{{ slogan }}</div>
        <div class="guide-desc" v-html="desc"></div>

        <!-- 关注公众号引导区 -->
        <div class="guide-follow" v-if="showFollow && qrcodeImg">
          <div class="follow-label">关注公众号，及时收到追悼通知</div>
          <van-button class="follow-btn" type="default" @click.stop="showQrcode = true">
            立即关注
          </van-button>
        </div>

        <!-- Apple 登录：App 内（iOS）显示，审核 4.8 要求必须提供 -->
        <div class="guide-apple" v-if="showAppleLogin" @click.stop="appleLogin">
          <span class="apple-mark"></span>
          <span>通过 Apple 登录</span>
        </div>

        <van-button class="guide-enter"
                    type="default"
                    @click.stop="enter">
          {{ buttonText }}
        </van-button>
        <div class="guide-tip" v-if="tip">{{ tip }}</div>
      </div>

      <!-- 公众号二维码弹层 -->
      <div class="qrcode-mask" v-if="showQrcode" @click="showQrcode = false">
        <div class="qrcode-box" @click.stop>
          <div class="qrcode-title">长按识别，关注公众号</div>
          <img class="qrcode-img" :src="qrcodeImg" />
          <div class="qrcode-close" @click="showQrcode = false">关闭</div>
        </div>
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
   *   1. 父组件把 showGuideFlag 置为 true，本组件被挂载并显示
   *   2. 用户点击"进入"按钮 -> 触发 @enter 事件 -> 父组件执行 authWechat()
   *   3. 父组件把 showGuideFlag 置为 false，本组件被卸载
   * ------------------------------------------------------------
   */
  export default {
    name: 'Guide',
    props: {
      logo: {
        type: String,
        default: require('@/modules/images/index_header.jpg')
      },
      title: {
        type: String,
        default: '彼岸思念'
      },
      slogan: {
        type: String,
        default: '爱，永存'
      },
      desc: {
        type: String,
        default: '为逝去的亲友创建一个永久的纪念馆<br/>在线追悼 · 留言祈福 · 私密祭奠'
      },
      buttonText: {
        type: String,
        default: '进入纪念馆'
      },
      tip: {
        type: String,
        default: '点击进入即表示同意获取微信授权以登录'
      },
      // true=显示关注区块，false=隐藏
      showFollow: {
        type: Boolean,
        default: true
      },
      // true=显示「通过 Apple 登录」（仅 iOS App 内为 true）
      showAppleLogin: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        showQrcode: false,
        qrcodeImg: require('@/modules/images/qrcode_bian.jpg'),
      }
    },
    methods: {
      enter() {
        this.$emit('enter')
      },
      appleLogin() {
        this.$emit('apple-login')
      }
    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';

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
      /* Apple 登录按钮：遵循 Apple 规范，黑底白字、圆角、高度 >= 44 */
      .guide-apple {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 44px;
        margin-bottom: 12px;
        border-radius: 22px;
        background: #000;
        color: #fff;
        font-size: 16px;
        font-weight: 500;
        .apple-mark {
          width: 16px;
          height: 16px;
          margin-right: 8px;
          border-radius: 3px;
          background: #fff;
        }
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

      /* 关注公众号区块 */
      .guide-follow {
        width: 100%;
        margin: 0 0 24px;
        padding: 12px;
        box-sizing: border-box;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(212, 184, 135, 0.4);
        .follow-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 10px;
        }
        .follow-btn {
          width: 100%;
          height: 36px;
          border: 1px solid #d4b887;
          border-radius: 18px;
          color: #d4b887;
          font-size: 14px;
          background: transparent;
        }
      }
    }
  }

  /* 二维码弹层 */
  .qrcode-mask {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    .qrcode-box {
      width: 260px;
      padding: 24px 20px 16px;
      border-radius: 16px;
      text-align: center;
      background: #fff;
      .qrcode-title {
        margin-bottom: 16px;
        font-size: 15px;
        color: #333;
      }
      .qrcode-img {
        width: 200px;
        height: 200px;
        object-fit: contain;
      }
      .qrcode-close {
        margin-top: 16px;
        font-size: 14px;
        color: #999;
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
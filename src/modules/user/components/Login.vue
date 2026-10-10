<template>
  <div class="login-page">
    <!-- 顶部柔光氛围层（CSS 拟合，不依赖图片资源） -->
    <div class="login-ambient" aria-hidden="true"></div>

    <div class="login-card">
      <div class="login-brand">
        <img class="login-brand-logo" src="~@/modules/images/index_header.jpg" alt="彼岸思念" />
        <h1 class="login-brand-title">彼岸思念</h1>
        <p class="login-brand-sub">逝者已矣，生者如斯</p>
      </div>

      <div class="login-actions">
        <button class="login-btn login-btn--apple" @click="doAppleLogin">
          <svg class="login-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.152 6.896c-.022-2.303 1.88-3.405 1.966-3.46-1.072-1.566-2.74-1.78-3.333-1.805-1.418-.144-2.773.835-3.498.835-.722 0-1.84-.815-3.028-.793-1.558.022-2.994.904-3.796 2.303-1.62 2.813-.414 6.977 1.164 9.273.772 1.118 1.692 2.372 2.898 2.327 1.162-.046 1.603-.75 3.01-.75 1.405 0 1.8.75 3.033.728 1.252-.022 2.045-1.14 2.813-2.26 1.252-1.63 1.77-3.21 1.79-3.297-.04-.016-2.81-1.077-2.84-4.206zM9.8 3.18c.638-.773 1.068-1.844.951-2.91-.919.038-2.03.612-2.69 1.385-.593.683-1.112 1.777-1.072 2.823.996.078 2.016-.508 2.811-1.298z"/>
          </svg>
          <span>Apple 登录 / 注册</span>
        </button>
      </div>

      <p class="login-tip">
        Apple 登录同时用于注册账号。
      </p>
    </div>
  </div>
</template>

<script>
import * as auth from '@/native/auth'
import { mapGetters } from 'vuex'

export default {
  name: 'Login',
  data () {
    return {}
  },
  computed: {
    ...mapGetters({ user: 'userStore/user' })
  },
  created () {
    // 已登录（如刷新后 store 仍有用户信息）直接跳走
    if (this.user) {
      this.goAfterLogin()
    }
  },
  methods: {
    goAfterLogin () {
      const redirect = this.$route.query.redirect
      if (redirect) {
        this.$router.replace(redirect)
      } else {
        this.$router.replace('/home')
      }
    },
    async doAppleLogin () {
      try {
        const res = await auth.loginByApple()
        await this.$store.dispatch('userStore/loginWithApple', res)
        this.goAfterLogin()
      } catch (e) {
        if (e && e.message && e.message.indexOf('不可用') > -1) {
          this.$toast && this.$toast(e.message)
        } else if (e && e.message && e.message.indexOf('取消') === -1) {
          this.$toast && this.$toast('Apple 登录失败，请重试')
        }
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  /* 沉静祭奠夜色：近黑底 + 暖色烛光径向晕染 */
  background:
    radial-gradient(120% 80% at 50% 8%, rgba(232, 176, 107, 0.18) 0%, rgba(232, 176, 107, 0) 55%),
    linear-gradient(180deg, #14110f 0%, #0e0c0b 55%, #080706 100%);
  overflow: hidden;
}

/* 烛光柔光层，缓慢呼吸，营造庄重氛围（尊重系统“减弱动态效果”） */
.login-ambient {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 120vw;
  height: 60vh;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(232, 176, 107, 0.22), rgba(232, 176, 107, 0));
  filter: blur(8px);
  animation: ambient-breathe 6s ease-in-out infinite;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .login-ambient { animation: none; }
}
@keyframes ambient-breathe {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.06); }
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-brand {
  text-align: center;
  margin-bottom: 40px;
}
.login-brand-logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  object-fit: cover;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(232, 176, 107, 0.25);
}
.login-brand-title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 4px;
  margin: 18px 0 8px;
  color: #f4ede3;
}
.login-brand-sub {
  font-size: 13px;
  letter-spacing: 2px;
  color: rgba(244, 237, 227, 0.55);
  margin: 0;
}

.login-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  color: #fff;
  transition: transform 0.12s ease, opacity 0.2s ease;
}
.login-btn:active {
  transform: scale(0.98);
}
.login-btn-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
  flex: none;
}

/* Apple 黑 */
.login-btn--apple {
  background: #000;
}
.login-btn--apple:active {
  background: #1a1a1a;
}

.login-tip {
  margin-top: 28px;
  font-size: 12px;
  line-height: 1.7;
  color: rgba(244, 237, 227, 0.4);
  text-align: center;
  max-width: 300px;
}
</style>

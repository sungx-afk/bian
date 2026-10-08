<template>
  <div class="login-page">
    <div class="login-logo">
      <img src="~@/modules/images/index_header.jpg" alt="彼岸思念" />
      <h1>彼岸思念</h1>
      <p>逝者已矣，生者如斯</p>
    </div>

    <div class="login-box">
      <van-button
        type="primary"
        block
        class="login-apple"
        @click="doAppleLogin">
        通过 Apple 登录 / 注册
      </van-button>

      <div class="login-divider"><span>或</span></div>

      <div class="login-debug">
        <input
          v-model="debugUid"
          type="number"
          class="login-debug-input"
          placeholder="调试：输入用户 ID（等价于 ?uid=）" />
        <van-button block @click="doUidLogin">使用 UID 登录</van-button>
      </div>

      <p class="login-tip">
        未登录时所有页面都会跳转至此。Apple 登录同时用于注册账号；
        UID 登录仅用于本地/内测调试。
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
    return {
      debugUid: ''
    }
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
    },
    doUidLogin () {
      const uid = (this.debugUid || '').trim()
      if (!uid) {
        this.$toast && this.$toast('请输入用户 ID')
        return
      }
      this.$store.dispatch('userStore/loginWithUid', {uid}).then(() => {
        this.goAfterLogin()
      }).catch(() => {
        this.$toast && this.$toast('登录失败，请检查用户 ID')
      })
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 18%;
  box-sizing: border-box;
}
.login-logo {
  text-align: center;
}
.login-logo img {
  width: 96px;
  height: 96px;
  border-radius: 16px;
  object-fit: cover;
}
.login-logo h1 {
  font-size: 22px;
  margin: 12px 0 4px;
  color: #333;
}
.login-logo p {
  font-size: 13px;
  color: #999;
  margin: 0;
}
.login-box {
  width: 80%;
  max-width: 360px;
  margin-top: 48px;
}
.login-apple {
  background: #000;
  border-color: #000;
}
.login-divider {
  display: flex;
  align-items: center;
  color: #bbb;
  font-size: 12px;
  margin: 20px 0;
}
.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}
.login-divider span {
  padding: 0 12px;
}
.login-debug-input {
  width: 100%;
  box-sizing: border-box;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0 10px;
  margin-bottom: 12px;
  font-size: 14px;
}
.login-tip {
  margin-top: 24px;
  font-size: 12px;
  color: #999;
  line-height: 1.6;
}
</style>

<template>
  <van-popup
    v-model="visible"
    class="set-username-popup"
    :close-on-click-overlay="false">
    <div class="set-username-card">
      <div class="sut-title">{{ $t('设置用户名') }}</div>
      <div class="sut-desc">{{ $t('请设置您的用户名以便亲友识别') }}</div>
      <van-field
        v-model="name"
        class="sut-field"
        :placeholder="$t('请输入用户名')"
        maxlength="10"
        ref="nameField" />
      <div class="sut-error" v-if="error">{{ error }}</div>
      <div class="sut-actions">
        <van-button class="sut-skip" @click="skip">{{ $t('稍后再说') }}</van-button>
        <van-button class="sut-confirm" type="default" @click="confirm">{{ $t('确定') }}</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script>
  import { t } from '@/i18n'
  import { mapGetters, mapActions } from 'vuex'

  export default {
    name: 'SetUsernameModal',
    data () {
      return {
        name: '',
        error: '',
        // 本次 app 会话内是否已关闭（跳过/已保存），避免页面来回切换时反复弹出
        dismissedSession: false
      }
    },
    computed: {
      ...mapGetters({
        user: 'userStore/user'
      }),
      // 是否需要引导设置用户名：后端显式标记优先，否则兜底判断（用户名为空或与 ID 相同）
      show () {
        if (!this.user || this.dismissedSession) return false
        if (this.user.needSetName === true) return true
        if (this.user.needSetName === false) return false
        const id = String(this.user.id)
        const nm = this.user.name
        return !nm || nm === id
      },
      visible: {
        get () { return this.show },
        set (val) {
          // 任何试图关闭弹窗的行为（含遮罩/返回）都视为本次会话关闭，下次进入软件再提示
          if (!val) this.skip()
        }
      }
    },
    watch: {
      show (val) {
        if (val) {
          this.name = ''
          this.error = ''
          this.$nextTick(() => {
            this.$refs.nameField && this.$refs.nameField.focus()
          })
        }
      }
    },
    methods: {
      ...mapActions({
        updateUserInfo: 'userStore/updateUserInfo'
      }),
      skip () {
        this.dismissedSession = true
      },
      confirm () {
        const name = (this.name || '').trim()
        if (!name) {
          this.error = t('用户名不能为空')
          return
        }
        this.error = ''
        $API.home.updateUserInfo({ nickName: name }, rsp => {
          if (this.user) {
            this.user.name = name
            this.user.needSetName = false
          }
          this.updateUserInfo(this.user)
          this.dismissedSession = true
          this.$toast && this.$toast(t('保存成功'))
        }, error => {
          this.$toast && this.$toast(t('修改失败，请稍后重试'))
        })
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .set-username-card {
    width: 100%;
    box-sizing: border-box;
    padding: 20px 18px 16px;
    background: #fff;
    border-radius: 10px;

    .sut-title {
      font-size: 17px;
      font-weight: 600;
      color: @FONT_SECOND_COLOR;
      text-align: center;
    }
    .sut-desc {
      margin-top: 8px;
      font-size: 13px;
      color: @FONT_FOUR_COLOR;
      text-align: center;
      line-height: 1.4;
    }
    .sut-field {
      margin-top: 16px;
      background: #f6f6f6;
      border-radius: 8px;
    }
    .sut-error {
      margin-top: 6px;
      font-size: 12px;
      color: #d43c33;
    }
    .sut-actions {
      display: flex;
      margin-top: 18px;

      .van-button {
        flex: 1;
        height: 40px;
        line-height: 38px;
        border-radius: 20px;

        &.sut-skip {
          color: @FONT_THIRD_COLOR;
          border: 1px solid @BORDER_COLOR_1;
          margin-right: 10px;
        }
        &.sut-confirm {
          color: #fff;
          border: none;
          background: @MAIN_THEME_COLOR;
        }
      }
    }
  }
</style>

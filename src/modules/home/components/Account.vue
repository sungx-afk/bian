<template>
  <div class="account-container">
    <div class="account-wrapper">
      <van-cell class="account-cell">
        <span>账号ID：</span><span>{{user && user.id}}</span>
      </van-cell>
      <van-cell class="charge-cell" v-if="supportPay">
        <span>账号余额：</span><span class="charge-remain">{{user && user.point }}</span><span>&nbsp;云币</span>
        <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
      </van-cell>
      <van-cell class="log-cell" v-if="supportPay" :is-link="true" @click.stop="goLogs">
        <span>充值和扣费记录</span>
      </van-cell>
    </div>
  </div>
</template>

<script>
import constant from '@/config/constant'
import {mapGetters, mapActions} from 'vuex';
import {Link} from '@/config/utils'

export default {
  name: 'Account',
  components: {
  },
  props: {},
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters({
      user: 'userStore/user'
    }),
    supportPay(){
      return config_server.supportPay
    }
  },
  watch: {},
  methods: {
    ...mapActions({
      updateUserInfo: 'userStore/updateUserInfo',
    }),
    goLogs(){
      Link(`/store/logs`)
    },
    charge(){
      Link(`/store/charge`)
    },
    updateInfo(point){
      console.error("updateInfo:",point)
      let user = this.user
      user.point += point
      this.updateUserInfo(user)
    },
    registerEvent(){
      eventHub.$on(constant.EVENT_PAY_SUCCESS,this.updateInfo)
    }
  },
  created () {
    this.registerEvent()
  },
  mounted () {
  },
  beforeDestroy(){
    eventHub.$off(constant.EVENT_PAY_SUCCESS,this.updateInfo)
  }
}
</script>

<style rel="stylesheet/less" lang="less" scoped>
   @import "~@/config/config.less";
  .account-container{
    background: @BG_GRAY;
    display: flex;
    flex-direction: column;
    height: 100%;
    .account-wrapper{
      background: @BG_WHITE;
      .van-cell__value{
        display: flex;
        align-items: center;
        .charge-remain{
          font-weight: bold;
        }
        .charge-btn{
          margin-left: auto;
          color: @FONT_WHITE_COLOR;
          background: @SECOND_THEME_COLOR;
        }
      }
    }
  }
</style>

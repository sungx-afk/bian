<template>
  <div class="user-center-container" v-if="user">
    <page-header title="账号设置"></page-header>
    <div class="user-center-wrapper">
      <van-cell class="user-cell">
        <van-uploader :after-read="afterSelectPhoto">
          <div class="avatar-box">
            <img class="avatar" :src="avatarUrl">
          </div>
        </van-uploader>
        <div class="name-wrapper">
          <template v-if="isModifyName">
            <van-field class="name-input"
              ref="name_input"
              v-model="name"
              placeholder="请输入昵称"
              maxlength="10"
              @blur="nameChanged">
            </van-field>
          </template>
          <template v-else>
            <span class="name">{{ user.name }}</span>
            <i class="iconfont icon-bianji" @click="goModifyName"></i>
          </template>
        </div>
        <van-button size="small" class="logout-btn" @click="logout">退出登录</van-button>
      </van-cell>
      <!-- 尊贵会员：账号级订阅卡片。
           user.vip=1 为已开通，vipEndDate 为到期时间（毫秒时间戳，iOS 订阅续期后后端更新） -->
      <van-cell class="vip-card" :border="false">
        <div class="vip-head">
          <div class="vip-logo">VIP</div>
          <div class="vip-info">
            <div class="vip-title">
              <span>尊贵会员</span>
              <span class="vip-state" :class="{'is-active': user.vip == 1}">{{ user.vip == 1 ? '已开通' : '未开通' }}</span>
            </div>
            <div class="vip-desc">
              <template v-if="user.vip == 1 && user.vipEndDate">有效期至 {{ user.vipEndDate | timesToDate('yyyy-MM-dd') }}</template>
              <template v-else-if="user.vip == 1">尊贵特权已生效，感谢支持</template>
              <template v-else>开通后可享专属纪念特权</template>
            </div>
          </div>
          <van-button v-if="nativeApp && user.vip != 1" round size="small" class="vip-btn" @click="buyVip">立即开通</van-button>
        </div>
        <!-- 审核 3.1.2：App 内必须提供「恢复购买」，换设备/重装后取回已购订阅 -->
        <div class="vip-restore" v-if="nativeApp && user.vip != 1" @click="restorePurchases">恢复购买</div>
      </van-cell>
      <van-cell class="account-cell">
        <span>账号ID：</span><span>{{user.id}}</span>
      </van-cell>
      <van-cell class="charge-cell" v-if="supportPay && supportPoint">
        <div class="charge-remain-wrapper">账号余额：<span class="charge-remain">{{user.point }}</span>&nbsp;云币</div>
        <div class="charge-btn-wrapper">
          <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
        </div>
      </van-cell>
      <van-cell class="log-cell" v-if="supportPay && supportPoint" :is-link="true" @click.stop="goLogs">
        <span>充值和扣费记录</span>
      </van-cell>
      <van-cell class="account-cell" v-if="showOrder" @click="goViewMyOrder" :is-link="true">
        <span>我的订单</span>
      </van-cell>
      <!-- 上架必填：App 内必须能访问隐私政策与订阅条款 -->
      <van-cell class="doc-cell" @click="goPrivacy" :is-link="true">
        <span>隐私政策</span>
      </van-cell>
      <van-cell class="doc-cell" @click="goTerms" :is-link="true">
        <span>服务条款（自动续期订阅）</span>
      </van-cell>
      <!-- 审核 5.1.1(v)：App 内必须提供注销账号入口 -->
      <van-cell class="delete-cell">
        <div class="delete-btn" @click="goDeleteAccount">注销账号</div>
      </van-cell>
    </div>
  </div>
</template>

<script>
import constant from '@/config/constant'
import {mapGetters, mapActions} from 'vuex';
import {Link,gUuid} from '@/config/utils'
import PageHeader from '@/modules/widget/PageHeader'
import { isNative } from '@/native/platform'
import * as iap from '@/native/iap'

export default {
  name: 'UserCenter',
  components: {
    PageHeader
  },
  props: {},
  data () {
    return {
      name:'',
      avatarUrl:'',
      oldName:'',
      isModifyName:false
    }
  },
  computed: {
    ...mapGetters({
      user: 'userStore/user'
    }),
    supportPay(){
      return config_server.supportPay
    },
    // 是否展示「云币」概念：关闭后全站只有尊贵馆(VIP)概念
    supportPoint(){
      return !!config_server.supportPoint
    },
    showOrder(){
      let appid = window.app_id || config_server.wechatAppId
      if(appid && appid == 'wx502b2e237549374c'){
        return true
      }
      return false
    },
    // 是否 iOS 原生 App：会员（尊贵会员）开通走 App Store 内购，仅原生 App 展示入口
    nativeApp(){
      return isNative()
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
    goPrivacy(){
      Link(`/privacy`)
    },
    goTerms(){
      Link(`/terms`)
    },
    // 注销账号：后端脱敏并标记删除，本地清 token 后回到首页
    goDeleteAccount(){
      this.$dialog.confirm({
        title: '注销账号',
        message: '注销后账号内的个人信息将被清除且无法恢复，已创建的纪念馆将保留。确认注销吗？'
      }).then(() => {
        $API.user.deleteAccount({}, rsp => {
          if (rsp && (rsp.result === 0 || rsp.result === '0')){
            this.clearLocalLogin()
            this.$toast && this.$toast('账号已注销')
            Link(`/home`)
          }else{
            this.$toast && this.$toast((rsp && rsp.msg) || '注销失败，请稍后重试')
          }
        }, error => {
          this.$toast && this.$toast('注销失败，请稍后重试')
        })
      }).catch(()=>{})
    },
    // 清登录态：必须同时清 Vuex（user/token）与本地 token。
    // 只清 localStorage 的话，Vuex 里 user 还在，跳登录页会被 Login.vue 的 created 立刻弹回首页。
    clearLocalLogin(){
      this.$store.dispatch('userStore/clearLogin')
    },
    // 退出登录：清登录态后跳到登录页
    logout(){
      this.$dialog.confirm({
        title: '退出登录',
        message: '确定要退出当前账号吗？'
      }).then(() => {
        this.clearLocalLogin()
        this.$toast && this.$toast('已退出登录')
        Link('/login')
      }).catch(() => {})
    },
    charge(){
      Link(`/store/charge`)
    },
    updateInfo(point){
      let user = this.user
      user.point += point
      this.updateUserInfo(user)
    },
    afterSelectPhoto(photo,detail){
      let data = {}
      data.identifier = gUuid()
      data.content = photo.content
      data.name = photo.file.name
      data.size = photo.file.size
      data.type = photo.file.type
      data.lastModified = photo.file.lastModified
      global.jumpData = data
      this.$nextTick(()=>{
        Link(`/cropper?avatar_type=normal`)
      })
    },
    updateAvatarData(result){
      let that = this
      let info = result.info

      let cropperData = result.cropperData

      that.loading = true
      $API.space.filesQiniuUploadTicket({
        reqType: 'general_file',
        name: info.name,
        expand: info.name.replace(/.+\./, ''),
        size: info.size,
      }, resp => {
        $API.space.filesQiniuUpload({
          data:cropperData,
          token:resp.uptoken,
          key:resp.key
        },rsp=>{
          that.avatarUrl = rsp.url
          $API.home.updateUserInfo({
            avatarUrl:this.avatarUrl
          },rsp=>{
            let user = that.user
            user.avatarUrl = that.avatarUrl
            that.updateUserInfo(user)
          },error=>{
            this.$toast("修改失败，请稍后重试")
          })
          that.loading = false
        },error=>{
          this.$toast("上传失败，请稍后重试")
          that.loading = false
        })
      },error=>{
        this.$toast("上传失败，请稍后重试")
        that.loading = false
      })
    },
    goModifyName(){
      this.oldName = this.name
      this.isModifyName = true
      setTimeout(() => {
        this.$refs.name_input && this.$refs.name_input.focus()
      }, 200);
    },
    nameChanged(){
      this.isModifyName = false
      //和原来一致就返回
      if (this.oldName == this.name){
        this.oldName = ''
        return
      }
      $API.home.updateUserInfo({
        nickName:this.name
      },rsp=>{
        let user = this.user
        user.name = this.name
        this.updateUserInfo(user)
      },error=>{
        this.$toast("修改失败，请稍后重试")
      })
    },
    registerEvent(){
      eventHub.$on(constant.EVENT_PAY_SUCCESS,this.updateInfo)
      eventHub.$on(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    },
    goViewMyOrder(){
      Link('/mortuary/order_list?scope=my')
    },
    // ============ 账号级会员（尊贵会员）开通：参照 store/Info.vue 的 iOS 内购流程 ============
    // 会员是用户级的（user.vip），不绑定具体纪念馆，所以不传 space_id（后端 /pay/ios/verify 该参数可选）
    buyVip(){
      this.buyVipByIap()
    },
    // iOS App：尊贵会员按年订阅走 App Store 内购，交易 ID 交后端核实后发货
    async buyVipByIap(){
      try {
        this.$toast && this.$toast('正在唤起 App Store…')
        const result = await iap.order(iap.IAP_PRODUCTS.VIP_YEARLY)
        if (!result || !result.transactionId){
          this.$toast && this.$toast('未取到 Apple 交易 ID，请稍后重试')
          return
        }
        this.verifyAndDeliver(result, '尊贵会员已开通')
      } catch (e) {
        console.log('iap error:', e)
        const msg = e && e.message ? e.message : '购买失败'
        // 用户主动取消不提示
        if (msg.indexOf('取消') < 0){
          this.$toast && this.$toast(msg)
        }
      }
    },
    // 恢复购买：换设备/重装后用同一 Apple ID 取回已购订阅（审核 3.1.2 要求）
    async restorePurchases(){
      try {
        this.$toast && this.$toast('正在向 App Store 恢复购买…')
        const result = await iap.restore()
        if (!result || !result.transactionId){
          this.$toast && this.$toast('未取到 Apple 交易 ID，请稍后重试')
          return
        }
        this.verifyAndDeliver(result, '尊贵会员已恢复')
      } catch (e) {
        console.log('iap restore error:', e)
        const msg = e && e.message ? e.message : '恢复购买失败'
        if (msg.indexOf('取消') < 0){
          this.$toast && this.$toast(msg)
        }
      }
    },
    // 把 Apple 交易 ID 交给后端核实（App Store Server API），成功才发货、才结束交易
    verifyAndDeliver(result, okMsg){
      const payload = {
        transaction_id: result.transactionId
      }
      console.log('[iap] 提交后端核实 ' + JSON.stringify(iap.describeTransaction(result)))
      $API.space.verifyIosTransaction(payload, rsp => {
        console.log('[iap] 后端返回 ' + JSON.stringify({
          result: rsp && rsp.result, msg: rsp && rsp.msg,
          vip: rsp && rsp.vip, endDate: rsp && rsp.endDate
        }))
        if (rsp && (rsp.result === 0 || rsp.result === '0')){
          // 只有后端确认发货后才 finish，否则交易一直挂着，下次启动还会再回调
          // 按 ID 结束「这一笔」，多笔并发时互相不覆盖
          iap.finish(result.transactionId)
          this.$toast && this.$toast(okMsg)
          // 用户级 VIP 记在 user 上，必须刷新它，页面上的会员状态才跟着变
          this.refreshUser()
        }else{
          console.warn('[iap] 后端未通过：' + (rsp && rsp.msg))
          this.$toast && this.$toast((rsp && rsp.msg) || '开通失败，请联系客服')
        }
      }, error => {
        console.warn('[iap] 请求异常 ' + JSON.stringify({status: error && error.status, msg: error && (error.msg || error.message)}))
        this.$toast && this.$toast('校验失败，请联系客服')
      })
    },
    // 刷新当前用户，拿到最新的 user.vip 会员状态
    refreshUser(){
      const token = this.$store.getters['userStore/token']
      this.$store.dispatch('userStore/fetchMyInfo', {token}).catch(() => {})
    }
  },
  created () {
    if (this.user){
      this.name = this.user.name
      this.avatarUrl = this.user.avatarUrl
    }
    this.registerEvent()
    // 上次付款后没 finish 的交易，进本页时自动补一次校验发货
    iap.setApprovedHandler(payload => {
      this.verifyAndDeliver(payload, '尊贵会员已开通')
    })
  },
  mounted () {
  },
  beforeDestroy(){
    eventHub.$off(constant.EVENT_PAY_SUCCESS,this.updateInfo)
    eventHub.$off(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    iap.setApprovedHandler(null)
  }
}
</script>

<style rel="stylesheet/less" lang="less" scoped>
   @import "~@/config/config.less";
  .user-center-container{
    background: @BG_GRAY;
    display: flex;
    flex-direction: column;
    height: 100%;
    .user-center-wrapper{
      background: @BG_WHITE;

      /deep/.van-cell__value{
        display: flex;
        align-items: center;
        .avatar-box{
          .avatar{
            width:50px;
            height:50px;
            border-radius:50%;
            flex-shrink:0;
          }
        }

        .name-wrapper{
          margin-left: 12px;
          .name{
            font-size: 14px;
            color: @FONT_THIRD_COLOR;
          }
          .iconfont{
            margin-left: 8px;
            font-size: 14px;
            color: @FONT_THIRD_COLOR;
          }
          .name-input{
            padding-left: 0;
          }
        }
        .charge-remain{
          font-weight: bold;
        }
      }
      /* 尊贵会员卡片：淡金底 + VIP 徽标 + 状态标签 + 主按钮，恢复购买降级为底部文字链 */
      .vip-card{
        margin: 12px;
        padding: 16px;
        border-radius: 12px;
        background: linear-gradient(135deg, #fdf7ec 0%, #f8ecd7 100%);
        box-shadow: 0 2px 10px rgba(196, 130, 44, 0.12);
        /deep/.van-cell__value{
          display: block;
        }
        .vip-head{
          display: flex;
          align-items: center;
        }
        .vip-logo{
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: @FONT_WHITE_COLOR;
          background: linear-gradient(135deg, #e9c483 0%, @SECOND_THEME_COLOR 100%);
          box-shadow: 0 2px 6px rgba(196, 130, 44, 0.35);
        }
        .vip-info{
          flex: 1;
          min-width: 0;
          margin-left: 12px;
        }
        .vip-title{
          display: flex;
          align-items: center;
          font-size: 15px;
          font-weight: 600;
          color: @FONT_SECOND_COLOR;
        }
        .vip-state{
          margin-left: 8px;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 400;
          color: @FONT_THIRD_COLOR;
          background: rgba(0, 0, 0, 0.06);
          &.is-active{
            color: @FONT_WHITE_COLOR;
            background: @SECOND_THEME_COLOR;
          }
        }
        .vip-desc{
          margin-top: 5px;
          font-size: 12px;
          color: #9a8663;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vip-btn{
          flex-shrink: 0;
          margin-left: 12px;
          height: 30px;
          padding: 0 16px;
          font-size: 13px;
          color: @FONT_WHITE_COLOR;
          border: none;
          background: linear-gradient(135deg, #dda94f 0%, @SECOND_THEME_COLOR 100%);
          box-shadow: 0 2px 8px rgba(196, 130, 44, 0.3);
        }
        .vip-restore{
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(196, 130, 44, 0.18);
          text-align: center;
          font-size: 13px;
          color: @SECOND_THEME_COLOR;
          &:active{
            opacity: 0.6;
          }
        }
      }
      .logout-btn{
        margin-left: auto;
        color: #d43c33;
        border: 1px solid #d43c33;
      }
      .charge-cell{
        /deep/.van-cell__value{
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .charge-remain-wrapper{
          flex-shrink: 0;
        }
        .charge-btn-wrapper{
          flex-shrink: 0;
          .charge-btn{
            color: @FONT_WHITE_COLOR;
            background: @SECOND_THEME_COLOR;
          }
        }
      }
      .doc-cell{
        margin-top: 12px;
      }
      .delete-cell{
        margin-top: 12px;
        .delete-btn{
          width: 100%;
          text-align: center;
          color: #d43c33;
          font-size: 14px;
        }
      }
    }
  }
</style>

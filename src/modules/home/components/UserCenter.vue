<template>
  <div class="user-center-container" v-if="user">
    <page-header :title="$t('账号设置')"></page-header>
    <div class="user-center-wrapper">
      <van-cell class="user-cell">
        <van-uploader :after-read="afterSelectPhoto">
          <div class="avatar-box">
            <user-avatar :url="avatarUrl" :name="user.name" :uid="user.id" :size="50"></user-avatar>
          </div>
        </van-uploader>
        <div class="name-wrapper">
          <template v-if="isModifyName">
            <van-field class="name-input"
              ref="name_input"
              v-model="name"
              :placeholder="$t('请输入昵称')"
              maxlength="10"
              @blur="nameChanged">
            </van-field>
          </template>
          <template v-else>
            <span class="name">{{ user.name }}</span>
            <span class="user-id">({{ user.id }})</span>
            <i class="iconfont icon-bianji" @click="goModifyName"></i>
          </template>
        </div>
        <van-button size="small" class="logout-btn" @click="logout">{{ $t('退出登录') }}</van-button>
      </van-cell>
      <!-- 尊贵会员：账号级订阅卡片。
           user.vip=1 为已开通，vipEndDate 为到期时间（毫秒时间戳，iOS 订阅续期后后端更新） -->
      <van-cell class="vip-card" :border="false">
        <div class="vip-head">
          <div class="vip-logo">VIP</div>
          <div class="vip-info">
            <div class="vip-title">
              <span>{{ $t('尊贵会员') }}</span>
              <span class="vip-state" :class="{'is-active': user.vip == 1}">{{ user.vip == 1 ? $t('已开通') : $t('未开通') }}</span>
            </div>
            <div class="vip-desc">
              <template v-if="user.vip == 1 && user.vipEndDate">{{ $t('有效期至') }} {{ user.vipEndDate | timesToDate('yyyy-MM-dd') }}</template>
              <template v-else-if="user.vip == 1">{{ $t('尊贵特权已生效，感谢支持') }}</template>
              <template v-else>{{ $t('开通后可享专属纪念特权') }}</template>
            </div>
          </div>
          <van-button v-if="nativeApp && user.vip != 1" round size="small" class="vip-btn" :loading="vipBusy" @click="buyVip">{{ $t('立即开通') }}</van-button>
        </div>
        <!-- 未开通：价格（最醒目）、权益说明、自动续订披露，与 store/Info.vue 保持同一套 3.1.2(c) 规范 -->
        <template v-if="nativeApp && user.vip != 1">
          <div class="vip-price">
            <span class="price-amount">{{ vipPriceText || '99' }}</span>
            <span class="price-unit">{{ $t('/年') }}</span>
          </div>
          <div class="vip-benefits">{{ $t('会员权益：纪念馆内全部祭奠物品（送花、瓜果贡品、酒席、花圈、长明灯等）免费无限使用，无广告打扰。') }}</div>
          <div class="vip-renew">{{ $t('订阅将自动续订，除非在当前周期结束前至少 24 小时于「设置 → Apple ID → 订阅」中取消。续订费用将从您的 iTunes 账户扣除，到期前不会涨价。') }}</div>
          <!-- 审核 3.1.2：App 内必须提供「恢复购买」，换设备/重装后取回已购订阅 -->
          <div class="vip-restore" @click="restorePurchases">{{ $t('恢复购买') }}</div>
        </template>
      </van-cell>
      <van-cell class="charge-cell" v-if="supportPay && supportPoint">
        <div class="charge-remain-wrapper">{{ $t('账号余额：') }}<span class="charge-remain">{{user.point }}</span>&nbsp;{{ $t('云币') }}</div>
        <div class="charge-btn-wrapper">
          <van-button size="small" class="charge-btn" @click="charge">{{ $t('充值（1 元 = 10 云币）') }}</van-button>
        </div>
      </van-cell>
      <van-cell class="log-cell" v-if="supportPay && supportPoint" :is-link="true" @click.stop="goLogs">
        <span>{{ $t('充值和扣费记录') }}</span>
      </van-cell>
      <van-cell class="account-cell" v-if="showOrder" @click="goViewMyOrder" :is-link="true">
        <span>{{ $t('我的订单') }}</span>
      </van-cell>
      <!-- 语言切换 -->
      <van-cell class="lang-cell" :is-link="true" @click="showLanguageSheet = true">
        <span class="lang-title">{{ $t('语言') }}</span>
        <span class="lang-current">{{ currentLanguageName }}</span>
      </van-cell>
      <!-- 上架必填：App 内必须能访问隐私政策与订阅条款 -->
      <van-cell class="doc-cell" @click="goPrivacy" :is-link="true">
        <span>{{ $t('隐私政策') }}</span>
      </van-cell>
      <van-cell class="doc-cell" @click="goTerms" :is-link="true">
        <span>{{ $t('服务条款（自动续期订阅）') }}</span>
      </van-cell>
      <!-- 审核 5.1.1(v)：App 内必须提供注销账号入口 -->
      <van-cell class="delete-cell">
        <div class="delete-btn" @click="goDeleteAccount">{{ $t('注销账号') }}</div>
      </van-cell>
    </div>
    <!-- 语言切换面板 -->
    <van-action-sheet
      v-model="showLanguageSheet"
      :actions="showLanguageSheet ? languageActions : []"
      :cancel-text="$t('取消')"
      close-on-click-action
      @select="onSelectLanguage"
    />
  </div>
</template>

<script>
import { t, languages, setLocale } from '@/i18n'

import LanguageSelector from '@/modules/widget/LanguageSelector'
import constant from '@/config/constant'
import {mapGetters, mapActions} from 'vuex';
import {Link,gUuid} from '@/config/utils'
import PageHeader from '@/modules/widget/PageHeader'
import UserAvatar from '@/modules/widget/UserAvatar'
import { isNative } from '@/native/platform'
import * as iap from '@/native/iap'

// App Store 真实价格的本地缓存 key：与 store/Info.vue 共用，页面加载时直接展示真价，
// 既不初始化 StoreKit，也不会把上次未结束的交易重新投递（不会自动发起购买）
const VIP_PRICE_CACHE_KEY = 'bian.vip.yearly.price'

export default {
  name: 'UserCenter',
  components: {
    LanguageSelector,
    PageHeader,
    UserAvatar
  },
  props: {},
  data () {
    return {
      name:'',
      avatarUrl:'',
      oldName:'',
      isModifyName:false,
      showLanguageSheet: false,
      // 会员开通/恢复购买过程中的 loading 态：点击按钮到后端校验发货结束期间为 true，
      // 既驱动按钮 loading 防重复点击，也由 verifyAndDeliver 用来显示页面级 Toast.loading 遮罩
      vipBusy:false,
      // 会员年费：App Store 本地化价格（如 ¥199.00），取自 StoreKit / 本地缓存
      vipPriceText:''
    }
  },
  computed: {
    ...mapGetters({
      user: 'userStore/user'
    }),
    supportPay(){
      return config_server.supportPay
    },
    // 是否展示「云币」概念：关闭后全站只有会员(VIP)概念
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
    },
    currentLanguageName() {
      const cur = languages.find(item => item.code === this.$locale)
      return cur ? cur.name : '简体中文'
    },
    languageActions() {
      return languages.map(item => ({
        name: item.name,
        code: item.code,
        color: item.code === this.$locale ? '#c4822c' : '#333333'
      }))
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
        title: t('注销账号'),
        message: t('注销后账号内的个人信息将被清除且无法恢复，已创建的纪念馆将保留。确认注销吗？')
      }).then(() => {
        $API.user.deleteAccount({}, rsp => {
          if (rsp && (rsp.result === 0 || rsp.result === '0')){
            this.clearLocalLogin()
            this.$toast && this.$toast(t('账号已注销'))
            Link(`/home`)
          }else{
            this.$toast && this.$toast(t((rsp && rsp.msg) || t('注销失败，请稍后重试')))
          }
        }, error => {
          this.$toast && this.$toast(t('注销失败，请稍后重试'))
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
        title: t('退出登录'),
        message: t('确定要退出当前账号吗？')
      }).then(() => {
        this.clearLocalLogin()
        this.$toast && this.$toast(t('已退出登录'))
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
            this.$toast(t('修改失败，请稍后重试'))
          })
          that.loading = false
        },error=>{
          this.$toast(t('上传失败，请稍后重试'))
          that.loading = false
        })
      },error=>{
        this.$toast(t('上传失败，请稍后重试'))
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
        this.$toast(t('修改失败，请稍后重试'))
      })
    },
    registerEvent(){
      eventHub.$on(constant.EVENT_PAY_SUCCESS,this.updateInfo)
      eventHub.$on(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    },
    goViewMyOrder(){
      Link('/mortuary/order_list?scope=my')
    },
    onSelectLanguage(action) {
      if (!action || !action.code) return
      if (action.code === this.$locale) return
      const code = action.code
      setLocale(code)
      $API.home.updateUserInfo({
        language: code
      }, rsp => {
        let user = Object.assign({}, this.user, { language: code })
        this.updateUserInfo(user)
        this.$toast && this.$toast(t('修改成功'))
      }, error => {
        console.warn('更新用户语言失败:', error)
      })
    },
    // ============ 账号级会员（尊贵会员）开通：参照 store/Info.vue 的 iOS 内购流程 ============
    // 会员是用户级的（user.vip），不绑定具体纪念馆，所以不传 space_id（后端 /pay/ios/verify 该参数可选）
    buyVip(){
      this.buyVipByIap()
    },
    // iOS App：尊贵会员按年订阅走 App Store 内购，交易 ID 交后端核实后发货
    async buyVipByIap(){
      if (this.vipBusy) return
      try {
        this.vipBusy = true
        // 点击「立即开通」时才初始化 StoreKit，顺带刷新 App Store 真实价格
        await this.loadVipPrice()
        this.$toast && this.$toast(t('正在唤起 App Store…'))
        const result = await iap.order(iap.IAP_PRODUCTS.VIP_YEARLY)
        if (!result || !result.transactionId){
          this.vipBusy = false
          this.$toast && this.$toast(t('未取到 Apple 交易 ID，请稍后重试'))
          return
        }
        this.verifyAndDeliver(result, '尊贵会员已开通')
      } catch (e) {
        this.vipBusy = false
        console.log('iap error:', e)
        const msg = e && e.message ? e.message : '购买失败'
        // 用户主动取消不提示
        if (msg.indexOf('取消') < 0){
          this.$toast && this.$toast(t(msg))
        }
      }
    },
    // 恢复购买：换设备/重装后用同一 Apple ID 取回已购订阅（审核 3.1.2 要求）
    async restorePurchases(){
      if (this.vipBusy) return
      try {
        this.vipBusy = true
        this.$toast && this.$toast(t('正在向 App Store 恢复购买…'))
        const result = await iap.restore()
        if (!result || !result.transactionId){
          this.vipBusy = false
          this.$toast && this.$toast(t('未取到 Apple 交易 ID，请稍后重试'))
          return
        }
        this.verifyAndDeliver(result, '尊贵会员已恢复')
      } catch (e) {
        this.vipBusy = false
        console.log('iap restore error:', e)
        const msg = e && e.message ? e.message : '恢复购买失败'
        if (msg.indexOf('取消') < 0){
          this.$toast && this.$toast(t(msg))
        }
      }
    },
    // 把 Apple 交易 ID 交给后端核实（App Store Server API），成功才发货、才结束交易
    // 全程（含后端校验网络请求）显示页面级 Toast.loading，避免支付完成后到发货之间无反馈
    verifyAndDeliver(result, okMsg){
      const tip = (okMsg && okMsg.indexOf('恢复') >= 0) ? '正在恢复会员…' : '正在开通会员…'
      this.vipBusy = true
      // forbidClick + duration:0：持续遮罩，禁止用户操作，直到下方用普通 toast 覆盖/关闭
      this.$toast.loading({ message: t(tip), forbidClick: true, duration: 0 })
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
          this.$toast(t(okMsg)) // 覆盖 loading，给出成功提示
          // 用户级 VIP 记在 user 上，必须刷新它，页面上的会员状态才跟着变
          this.refreshUser()
        }else{
          console.warn('[iap] 后端未通过：' + (rsp && rsp.msg))
          this.$toast(t((rsp && rsp.msg) || t('开通失败，请联系客服')))
        }
        this.vipBusy = false
      }, error => {
        console.warn('[iap] 请求异常 ' + JSON.stringify({status: error && error.status, msg: error && (error.msg || error.message)}))
        this.$toast(t('校验失败，请联系客服'))
        this.vipBusy = false
      })
    },
    // 刷新当前用户，拿到最新的 user.vip 会员状态
    refreshUser(){
      const token = this.$store.getters['userStore/token']
      this.$store.dispatch('userStore/fetchMyInfo', {token}).catch(() => {})
    },
    // 页面加载阶段取 App Store 真价：走原生只读商品查询插件（BianProductPrice），
    // 不初始化内购插件、不注册交易观察者，因此不会发起购买（与 store/Info.vue 同逻辑）
    loadVipPriceOnly(){
      if (!isNative()) return
      iap.getPriceOnly(iap.IAP_PRODUCTS.VIP_YEARLY).then(text => {
        if (text){
          this.vipPriceText = text
          this.writeCachedVipPrice(text)
        }
      })
    },
    // 读缓存的 App Store 价格：页面加载阶段用它展示，不触碰 StoreKit
    readCachedVipPrice(){
      try {
        return localStorage.getItem(VIP_PRICE_CACHE_KEY) || ''
      } catch (e) {
        return ''
      }
    },
    writeCachedVipPrice(text){
      try {
        if (text) localStorage.setItem(VIP_PRICE_CACHE_KEY, text)
      } catch (e) {}
    },
    // 会员年费：价格取自 App Store 的本地化价格（App Store Connect 调价 / 不同区域货币自动跟随）。
    // 只在用户点击「立即开通」时调用：页面加载阶段不初始化 StoreKit，避免自动发起购买；
    // 取到的真价写进缓存，之后进页面就能直接展示真价，且仍不碰 StoreKit。
    loadVipPrice(){
      if (!isNative()) return Promise.resolve()
      return iap.getPrice(iap.IAP_PRODUCTS.VIP_YEARLY).then(text => {
        if (text){
          this.vipPriceText = text
          this.writeCachedVipPrice(text)
        }
      }).catch(() => {})
    }
  },
  created () {
    if (this.user){
      this.name = this.user.name
      this.avatarUrl = this.user.avatarUrl
    }
    // 先用缓存的真价兜底，再只读刷新一次真价（不初始化内购、不会自动发起购买）
    this.vipPriceText = this.readCachedVipPrice()
    this.loadVipPriceOnly()
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
          // 用户名后的 ID（替代原独立"账号ID"行）
          .user-id{
            margin-left: 4px;
            font-size: 12px;
            color: @FONT_FOUR_COLOR;
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
        /* 通栏整条：去掉左右外边距与圆角，横向铺满、与上下行左右对齐 */
        margin: 12px 0;
        padding: 16px;
        border-radius: 0;
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
        /* 价格：Apple 3.1.2(c) 要求为最醒目元素（大字、金色、加粗） */
        .vip-price{
          margin-top: 12px;
          display: flex;
          align-items: baseline;
          .price-amount{
            font-size: 30px;
            font-weight: 700;
            color: @SECOND_THEME_COLOR;
          }
          .price-unit{
            margin-left: 2px;
            font-size: 14px;
            color: #9a8663;
          }
        }
        /* 权益说明：明确花钱能得到什么 */
        .vip-benefits{
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.5;
          color: #9a8663;
        }
        /* 自动续订披露（小字、浅色，Apple 3.1.2(c) 强制要求） */
        .vip-renew{
          margin-top: 6px;
          font-size: 11px;
          line-height: 1.4;
          color: #b7a582;
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
      .lang-cell{
        margin-top: 12px;
        /deep/.van-cell__value{
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .lang-title{
          font-size: 14px;
          color: @FONT_SECOND_COLOR;
        }
        .lang-current{
          font-size: 14px;
          color: @FONT_THIRD_COLOR;
          margin-right: 4px;
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

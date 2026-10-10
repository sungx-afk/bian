<template>
  <div class="info-container">
    <page-header title="祭奠物品"></page-header>
    <div class="header">
      <img src="~@/modules/images/index_header_2.png" class="header-bg" />
      <div class="header-text">{{filterName}}意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思</div>
    </div>
    <div class="content">
      <div class="charge-area">
        <van-cell-group :title="chargeTitle">
          <!-- 账号ID：右侧放「恢复购买」（App 内必须提供，审核 3.1.2） -->
          <van-cell class="account-cell">
            <span>账号ID：</span><span>{{space && space.currentUser && space.currentUser.id}}</span>
            <van-button size="small" class="restore-btn" v-if="nativeApp" :loading="vipBusy" @click="restorePurchases">恢复购买</van-button>
          </van-cell>
          <!-- 开通会员：整行紧贴账号ID 下方 -->
          <van-cell class="product-cell vip-cell" v-for="product in vipProducts" :key="product.id">
            <!-- 会员权益说明：放在「会员」标题上方 -->
            <div class="product-head">开通会员后，创建的纪念馆所有人员均可使用全部祭品</div>
            <div class="product-top">
              <span class="vip-product">{{product.name}}</span>
              <van-button size="small" class="purchase-btn" :loading="vipBusy" :icon="product.point > 0?iconMoney:''" @click="buyProduct(product)">{{buyProductBtnText(product)}}</van-button>
            </div>
            <!-- 价格来自 App Store（StoreKit 本地化价格），取不到时回退兜底价 -->
            <div class="product-bottom">
              <span class="product-tip">按年支付，{{vipPriceText || '199'}}/年</span>
            </div>
          </van-cell>
          <van-cell class="charge-cell" v-if="supportPay && supportPoint">
            <div class="charge-remain-wrapper">账号余额：<span class="charge-remain">{{space && space.currentUser && space.currentUser.point }}</span>&nbsp;云币</div>
            <div class="charge-btn-wrapper">
              <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
            </div>
          </van-cell>
          <van-cell class="vip-cell" v-if="supportPay && isVipSpace">
            <span style="color: #825621;">当前已开通会员，各种祭奠物品免费</span>
          </van-cell>
          <van-cell class="product-cell" v-for="product in itemProducts" :key="product.id">
            <div class="product-top">
              <span>{{product.name}}</span>
              <van-button size="small" class="purchase-btn" :icon="product.point > 0?iconMoney:''" @click="buyProduct(product)">{{buyProductBtnText(product)}}</van-button>
            </div>
            <div class="product-bottom" v-if="product.tip">
              <span class="product-tip">{{ product.tip }}</span>
            </div>
          </van-cell>
        </van-cell-group>
      </div>
      <div class="analyze" v-if="space">
        <p class="label">逝者已矣，生者如斯</p>
        <p>到访人次：<span class="num">{{space.visitedTimes}}</span>
          <i class="iconfont icon-wenhao" @click="goShowVisitedTip"></i>
          <span v-if="isSpaceCreator" @click="goViewVisitedLog" class="view-log">查看到访人员 ></span>
        </p>
        <p>上香次数：<span class="num">{{space.worshipTimes || 0}}</span></p>
        <p>点烛次数：<span class="num">{{space.lazuTimes || 0}}</span></p>
        <p>纸钱次数：<span class="num">{{space.zhiQianTimes || 0}}</span></p>
        <p>送花次数：<span class="num">{{space.huaTimes || 0}}</span></p>
        <p>长明灯次数：<span class="num">{{space.dengTimes || 0}}</span></p>
        <p class="create-info">本馆由 {{ space.creator.name }} 于 {{ space.createDate | timesToDate('yyyy-MM-dd HH:mm') }} 创建</p>
      </div>
      <!-- 审核 3.1.2：付费/订阅页面必须能直接打开服务条款与隐私政策 -->
      <div class="view-history doc-links">
        <span @click="goTerms">服务条款（自动续期订阅）</span>
        <span class="split">|</span>
        <span @click="goPrivacy">隐私政策</span>
      </div>
      <div class="view-history"><span @click="goLogs" v-if="supportPay && supportPoint">充值和扣费记录</span></div>
    </div>

    <van-popup class="visited-tip-popup-area" v-model="showVisitedTip" closeable :round="false" close-on-popstate @closed="tipPopupClosed">
      <div class="text">
        到访人次以每次进入纪念馆详情页为准，包括创建者本人进入记录
      </div>
    </van-popup>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {mapGetters, mapActions} from 'vuex';
  import {Link} from '@/config/utils'
  import { isNative } from '@/native/platform'
  import * as iap from '@/native/iap'
  import PageHeader from '@/modules/widget/PageHeader'

    export default {
      name: "Info",
      components:{
        PageHeader
      },
      data(){
        return{
          showVisitedTip:false,
          spaceId:'',
          space:null,
          products:[],
          iconMoney:'https://static-app01.yugusoft.com/bian/money.png',
          products_list:[],//服务器存储的礼物列表
          vipBusy:false,    // 会员开通/恢复购买 loading 态
          buyBusy:false,    // 祭品（云币）购买进行中标记，仅用于防重复点击
          vipPriceText:'',  // 会员年费：App Store 本地化价格（如 ¥199.00），取自 StoreKit
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
          merchant: 'userStore/merchant',
        }),
        isSpaceCreator(){
          let result = false
          if (this.space && this.user.id === this.space.creatorId){
            result = true
          }
          return result
        },
        // 会员 = 馆级 VIP（旧商品 item-space-vip）或用户级 VIP（iOS 订阅，全站通用）
        isVipSpace(){
          return (this.space && this.space.vip == 1) || (this.user && this.user.vip == 1)
        },
        nativeApp(){
          return isNative()
        },
        // 开通会员行（馆级 VIP 商品 item-space-vip）：单独渲染在账号ID 下方
        vipProducts(){
          return this.products.filter(p => p.id == 'item-space-vip')
        },
        // 其余祭品行（送花 / 瓜果贡品 / 酒席 …）
        itemProducts(){
          return this.products.filter(p => p.id != 'item-space-vip')
        },
        // 是否展示「云币」概念（全局开关，关闭后只保留会员/VIP 概念）
        supportPoint(){
          return !!config_server.supportPoint
        },
        chargeTitle(){
          let result = ''
          if (this.space){
            if (this.space.type === 2){
              result = '本纪念馆为样例馆'
            }else if (!this.supportPay){
              result = ''
            }else if (!this.supportPoint){
              // 无云币模式：非会员的权益说明已放进「会员」行内（见模板 .product-head），顶部不再重复
              result = this.isVipSpace
                ? '本馆已开通会员，祭奠物品免费使用'
                : ''
            }else {
              result = '以下是为支付运营成本的收费服务，感谢您的支持'
            }
          }
          return result
        },
        supportPay(){
          let result = true;
          if(this.merchant && this.merchant.virtual_goods_free == 1){
            result = false;
          }else{
            result = config_server.supportPay;
          }
          return result;
        },
        filterName(){
          let result = '彼岸思念';
          if(this.user && this.user.appId == 'wx502b2e237549374c'){
            if(this.user.merchant_name){
              result = this.user.merchant_name;
            }
          }
          return result;
        },
      },
      methods:{
        ...mapActions({
          updateSpaceDetail: 'spaceStore/updateSpaceDetail',
        }),
        charge(){
          Link(`/store/charge`)
        },
        getDetail(){
          return new Promise((resolve,reject)=>{
            if (!this.spaceId){
              reject()
              return
            }
            $API.space.getSpaceDetail({
              sid: this.spaceId,
            }, (rsp)=>{
              this.space = rsp;
              this.updateSpaceDetail(this.space)
              if (this.space.couplets){
                this.coupletsLeft = this.space.couplets.left
                this.coupletsRight = this.space.couplets.right
              }
              resolve()
            }, error=>{
              reject(error)
            })
          })
        },
        updateInfo(){
          this.getDetail().then(()=>{
            this.initProducts()
          })
        },
        initProducts(){
          this.getProductsList().then(() => {
            let products = [];
            products.push({
              id:'item-xuan-hua',
              name:'送花',
              point:this.space.type == 2?0:9
            })

            if(this.showGift('package-gua-guo').show){
              products.push({
                id:'package-gua-guo',
                name:'瓜果贡品（7 天）',
                point:this.showGift('package-gua-guo').price
              })
            }
            if(this.showGift('package-jiu-xi').show){
              products.push({
                id:'package-jiu-xi',
                name:'酒席（7 天）',
                point:this.showGift('package-jiu-xi').price
              })
            }
            if(this.showGift('package-hua-quan').show){
              products.push({
                id:'package-hua-quan',
                name:'花圈装饰（永久）',
                point:this.showGift('package-hua-quan').price
              })
            }
            if(this.showGift('package-xiang-zhu').show){
              products.push({
                id:'package-xiang-zhu',
                name:'香烛长燃（1 年）',
                point:this.showGift('package-xiang-zhu').price
              })
            }
            if(this.showGift('item-zhang-min-ding').show){
              if (this.supportPay){
                products.push({
                  id:'item-zhang-min-ding',
                  name:'长明灯（永久，每次添加两盏，可多次）',
                  point:this.showGift('item-zhang-min-ding').price
                })
              }else {
                products.push({
                  id:'item-zhang-min-ding',
                  name:'长明灯（永久）',
                  point:this.showGift('item-zhang-min-ding').price
                })
              }
            }

            products.sort((a,b) => {
              return a.price - b.price;
            })

            //不是会员，增加对应的会员开通
            if (!this.isVipSpace && this.space.type != 2 && this.showGift('item-space-vip').show){
              products.push({
                id:'item-space-vip',
                name:'会员',
                // 说明文案与年费价格统一在页面上展示（价格取自 App Store），此处不再挂 tip
                point:this.showGift('item-space-vip').price
              })
            }


            this.products = products;

          })
          // this.products = [{
          //   id:'package-gua-guo',
          //   name:'瓜果贡品（7 天）',
          //   point:9
          // },{
          //   id:'package-jiu-xi',
          //   name:'酒席（7 天）',
          //   point:50
          // },{
          //   id:'package-hua-quan',
          //   name:'花圈装饰（永久）',
          //   point:60
          // },{
          //   id:'package-xiang-zhu',
          //   name:'香烛长燃（1 年）',
          //   point:660
          // }]
          // if (this.supportPay){
          //   this.products.push({
          //     id:'item-zhang-min-ding',
          //     name:'长明灯（永久，每次添加两盏，可多次）',
          //     point:999
          //   })
          // }else {
          //   this.products.push({
          //     id:'item-zhang-min-ding',
          //     name:'长明灯（永久）',
          //     point:999
          //   })
          // }
          // //不是会员，增加对应的会员开通
          // if (!this.isVipSpace && this.space.type != 2){
          //   this.products.push({
          //     id:'item-space-vip',
          //     name:'会员',
          //     tip:'对来访所有人员，各种祭奠物品免费。按年支付，方便祭奠',
          //     point:1990
          //   })
          // }
          if (this.space.type === 2 || !this.supportPay){
            this.products = this.products.map(item=>{
              let o = item
              o.point = 0
              return o
            })
          }
        },
        // 把 Apple 交易 ID 交给后端核实（App Store Server API），成功才发货、才结束交易
        verifyAndDeliver(result, okMsg){
          const tip = (okMsg && okMsg.indexOf('恢复') >= 0) ? '正在恢复会员…' : '正在开通会员…'
          this.vipBusy = true
          // forbidClick + duration:0：持续遮罩覆盖「支付完成→后端校验发货」这段，直到下方用普通 toast 覆盖/关闭
          this.$toast.loading({ message: tip, forbidClick: true, duration: 0 })
          const payload = {
            transaction_id: result.transactionId,
            space_id: this.spaceId
          }
          console.log('[iap] 提交后端核实 ' + JSON.stringify(iap.describeTransaction(result)) + ' space_id=' + this.spaceId)
          $API.space.verifyIosTransaction(payload, rsp => {
            console.log('[iap] 后端返回 ' + JSON.stringify({
              result: rsp && rsp.result, msg: rsp && rsp.msg,
              vip: rsp && rsp.vip, endDate: rsp && rsp.endDate
            }))
            if (rsp && (rsp.result === 0 || rsp.result === '0')){
              // 只有后端确认发货后才 finish，否则交易一直挂着，下次启动还会再回调
              // 按 ID 结束「这一笔」，不能用全局的「最近一笔」——多笔并发时会互相覆盖
              iap.finish(result.transactionId)
              this.$toast(okMsg) // 覆盖 loading，给出成功提示
              eventHub.$emit(constant.EVENT_BUY_PRODUCT_SUCCESS,{id:'item-space-vip'})
              // 用户级 VIP 记在 user 上，必须刷新它，页面上的会员状态才会跟着变
              this.refreshUser()
              this.updateInfo()
            }else{
              console.warn('[iap] 后端未通过：' + (rsp && rsp.msg))
              this.$toast((rsp && rsp.msg) || '开通失败，请联系客服')
            }
            this.vipBusy = false
          }, error => {
            console.warn('[iap] 请求异常 ' + JSON.stringify({status: error && error.status, msg: error && (error.msg || error.message)}))
            this.$toast('校验失败，请联系客服')
            this.vipBusy = false
          })
        },
        // 刷新当前用户，拿到最新的 user.vip 会员状态
        refreshUser(){
          const token = this.$store.getters['userStore/token']
          this.$store.dispatch('userStore/fetchMyInfo', {token}).catch(() => {})
        },
        // 会员年费：价格取自 App Store 的本地化价格（App Store Connect 调价 / 不同区域货币自动跟随）。
        // 只在用户点击「开通」时调用：页面加载阶段不初始化 StoreKit，避免自动发起购买。
        loadVipPrice(){
          if (!isNative()) return Promise.resolve()
          return iap.getPrice(iap.IAP_PRODUCTS.VIP_YEARLY).then(text => {
            if (text) this.vipPriceText = text
          }).catch(() => {})
        },
        // 恢复购买：换设备/重装后用同一 Apple ID 取回已购订阅（审核 3.1.2 要求）
        async restorePurchases(){
          if (this.vipBusy) return
          try {
            this.vipBusy = true
            this.$toast && this.$toast('正在向 App Store 恢复购买…')
            const result = await iap.restore()
            if (!result || !result.transactionId){
              this.vipBusy = false
              this.$toast && this.$toast('未取到 Apple 交易 ID，请稍后重试')
              return
            }
            this.verifyAndDeliver(result, '会员已恢复')
          } catch (e) {
            this.vipBusy = false
            console.log('iap restore error:', e)
            const msg = e && e.message ? e.message : '恢复购买失败'
            if (msg.indexOf('取消') < 0){
              this.$toast && this.$toast(msg)
            }
          }
        },
        // iOS App：会员按年订阅走 App Store 内购，交易 ID 交后端核实后发货
        async buyVipByIap(){
          if (this.vipBusy) return
          try {
            this.vipBusy = true
            // 点击「开通」时才初始化 StoreKit，顺带刷新 App Store 真实价格
            await this.loadVipPrice()
            this.$toast && this.$toast('正在唤起 App Store…')
            const result = await iap.order(iap.IAP_PRODUCTS.VIP_YEARLY)
            if (!result || !result.transactionId){
              this.vipBusy = false
              this.$toast && this.$toast('未取到 Apple 交易 ID，请稍后重试')
              return
            }
            this.verifyAndDeliver(result, '会员已开通')
          } catch (e) {
            this.vipBusy = false
            console.log('iap error:', e)
            const msg = e && e.message ? e.message : '购买失败'
            // 用户主动取消不提示
            if (msg.indexOf('取消') < 0){
              this.$toast && this.$toast(msg)
            }
          }
        },
        buyProductBtnText(product){
          if (product.id == 'item-space-vip'){
            return '开通'
          }
          // 已是会员：祭品可直接使用
          if (this.isVipSpace){
            return '使用'
          }
          let result = '祭奠'
          if (product.point > 0){
            // 无云币模式：收费祭品只对会员开放，不再显示点数
            result = this.supportPoint ? product.point : '会员使用'
          }
          return result
        },
        buyProduct(product){
          let that = this;
          // 防重入：会员开通/祭品购买进行中时忽略再次点击
          if (this.vipBusy || this.buyBusy) return
          // iOS App：会员按年订阅必须走 App Store 内购（审核 3.1.1），不能扣云币
          if (isNative() && product.id == 'item-space-vip'){
            this.buyVipByIap()
            return
          }
          if (this.space){
            // 无云币模式：非会员不使用收费祭品，引导开通会员
            if (!this.supportPoint && !this.isVipSpace && this.space.type != 2 && product.point > 0){
              this.$toast(product.id == 'item-space-vip' ? '请点击「开通」' : '开通会员后，本馆祭奠物品免费使用')
              return
            }
            if (this.supportPoint && !this.isVipSpace && this.space.currentUser.point < product.point){
              this.$toast("余额不足，请先充值")
              return
            }
            let productId = product.id
            let spaceId = this.spaceId
            // 祭品（云币）购买：纯网络请求，不加 loading 遮罩（buyBusy 仅用于防重复点击）
            this.buyBusy = true
            $API.space.buy({productId,spaceId},rsp=>{
              if (this.supportPay){
                if (this.isVipSpace || !this.supportPoint){
                  this.$toast(`已祭奠${product.name}`)
                }else{
                  this.$toast(`已购买${product.name}\n扣除${product.point}云币`)
                  this.space.currentUser.point = this.space.currentUser.point - product.point
                }
              }else {
                this.$toast(`已祭奠${product.name}`)
              }
              this.buyBusy = false
              eventHub.$emit(constant.EVENT_BUY_PRODUCT_SUCCESS,{id:product.id})
              if (productId == 'item-space-vip'){
                //这里获取一次详情？
                this.updateInfo()
              }else{
                setTimeout(()=>{
                  //go(-1) 返回原 sacrifice 历史记录，不新增记录，避免返回时再次显示本页
                  that.$router.go(-1);
                }, 1000);
              }
            },error=>{
              this.$toast("购买失败，请稍后重试")
              this.buyBusy = false
            })
          }else{
            this.$toast("获取信息失败，请稍后重试")
          }
        },
        goLogs(){
          Link(`/store/logs`)
        },
        goTerms(){
          Link(`/terms`)
        },
        goPrivacy(){
          Link(`/privacy`)
        },
        goViewVisitedLog(){
          Link(`/space/manage/${this.spaceId}`)
        },
        goShowVisitedTip(){
          this.showVisitedTip = true
        },
        tipPopupClosed(){
          this.showVisitedTip = false
        },
        registerEvent(){
          eventHub.$on(constant.EVENT_PAY_SUCCESS,this.updateInfo)
        },
        getProductsList(){
          return new Promise((resolve, reject) => {
            $API.mortuary.getGiftList({},(rsp) => {
              this.products_list = rsp;
              resolve();
            })
          })
        },
        showGift(id){
          let [obj] = this.products_list.filter(a => a.id == id);
          return obj;
        }
      },
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
            this.getDetail().then(()=>{
              this.initProducts()
            })
          }
        }
        this.registerEvent()
        // 刻意不在页面加载时碰 StoreKit（不取价格、不注册补单回调）：
        // 初始化会把上次未结束的交易重新投递给 StoreKit，真机上表现为
        // 「刚进页面就自动发起开通会员」，且交易未 finish 时会反复出现。
        // 现在只有用户点击「开通」/「恢复购买」时才初始化（loadVipPrice / order / restore）。
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_PAY_SUCCESS,this.updateInfo)
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .info-container{
    background: @BG_GRAY;
    display: flex;
    flex-direction: column;
    height: 100%;
    .header{
      position: relative;
      .header-bg{
        width: 100%;
      }
      .header-text{
        color: @FONT_WHITE_COLOR;
        font-size: 14px;
        position: absolute;
        top: 20%;
        padding: 20px;
        text-align: center;
      }
    }
    .content{
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      .charge-area{
        background: @BG_WHITE;
        .van-cell-group__title{
          color: @FONT_SECOND_COLOR;
        }

        .account-cell,.charge-cell,.vip-cell{
          padding: 20px 15px;
        }
        .account-cell{
          /* 恢复购买按钮：贴在账号ID 右侧 */
          .restore-btn{
            margin-left: auto;
            color: @FONT_WHITE_COLOR;
            background: @SECOND_THEME_COLOR;
            border-color: @SECOND_THEME_COLOR;
          }
        }
        .vip-cell{
          border-top: 12px solid #eee;
          border-bottom: 12px solid #eee;
        }
        .van-cell__value{
          display: flex;
          align-items: center;
          .purchase-btn{
            min-width: 64px;
            margin-left: auto;
            color: @SECOND_THEME_COLOR;
            border: 1px solid @SECOND_THEME_COLOR;
          }
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
        .product-cell{
          .van-cell__value{
            flex-direction: column;
            align-items: flex-start;
          }
          /* 会员行的权益说明：独占一行，位于「会员」标题上方 */
          .product-head{
            width: 100%;
            margin-bottom: 12px;
            font-size: 13px;
            line-height: 1.5;
            color: @FONT_SECOND_COLOR;
          }
          .product-top{
            width: 100%;
            display: flex;
            align-items: center;
            .vip-product{
              font-size: 15px;
              font-weight: bold;
            }
          }
          .product-bottom{
            margin-top: 4px;
            .product-tip{
              font-size: 12px;
              font-weight: bold;
              color: @FONT_THIRD_COLOR;
            }
          }
        }
      }
      .analyze{
        font-size: 14px;
        background: @BG_WHITE;
        margin: 12px 0px 0px;
        padding: 8px 16px;
        color: @FONT_SECOND_COLOR;
        p{
          height: 24px;
          line-height: 24px;
          .num{
            font-weight: bold;
          }
        }
        .label{
          font-size: 16px;
          margin-bottom: 12px;
        }
        .iconfont{
          color: @FONT_THIRD_COLOR;
          margin: 0px 12px;
        }
        .create-info{
          margin-top: 12px;
          font-size: 12px;
          color: @FONT_FOUR_COLOR;
        }
        .view-log{
          color: @MAIN_THEME_COLOR;
        }
      }
      .view-history{
        margin-top: 20px;
        font-size: 14px;
        color: #a9a9a9;
        text-align: center;
        width: 100%;
        cursor: pointer;
        padding: 10px 0 30px;
        flex-shrink: 0;
      }
      .doc-links{
        margin-top: 12px;
        color: @MAIN_THEME_COLOR;
        .split{
          margin: 0 8px;
          color: #ddd;
        }
      }
    }

    .visited-tip-popup-area{
      .text{
        padding: 60px 20px;
        color: @FONT_THIRD_COLOR;
        font-size: 14px;
      }
    }
  }

</style>

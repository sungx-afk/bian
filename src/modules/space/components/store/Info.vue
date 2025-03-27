<template>
  <div class="info-container">
    <div class="header">
      <img src="~@/modules/images/index_header_2.png" class="header-bg" />
      <div class="header-text">彼岸思念意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思</div>
    </div>
    <div class="content">
      <div class="menu-area" v-if="isSpaceCreator">
        <van-cell title="自定义挽联" :is-link="true" @click.stop="enterCouplets"></van-cell>
        <van-cell title="自定义主题" :is-link="true" @click.stop="goSwitchTheme"></van-cell>
      </div>
      <div class="charge-area">
        <van-cell-group :title="chargeTitle">
          <van-cell class="account-cell">
            <span>账号ID：</span><span>{{space && space.currentUser && space.currentUser.id}}</span>
          </van-cell>
          <van-cell class="charge-cell" v-if="supportPay">
            <span>账号余额：</span><span class="charge-remain">{{space && space.currentUser && space.currentUser.point }}</span><span>&nbsp;云币</span>
            <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
          </van-cell>
          <van-cell class="charge-cell" v-if="supportPay && isVipSpace">
            <span style="color: #825621;">当前馆为尊贵馆，各种祭奠物品免费</span>
          </van-cell>
          <van-cell class="product-cell" v-for="product in products" :key="product.id">
            <div class="product-top">
              <span :class="{'vip-product':product.id == 'item-space-vip'}">{{product.name}}</span>
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
      </div>
      <div class="view-history"><span @click="goLogs" v-if="supportPay">充值和扣费记录</span></div>
    </div>

    <van-popup
      v-model="showThemes"
      closeable
      position="bottom"
      @open="mask=true"
      @closed="mask=false"
      @click.stop=""
      :style="{ height: '100%' }">
      <div class="info">
        <van-icon name="info"/>
        请选择一个背景
      </div>
      <div class="theme-wrapper">
        <div class="theme" v-for="(img, index) in backgrounds">
          <van-image
            width="50vw"
            height="65vw"
            :key="img.id"
            @click="themeId = img.id"
            :class="{'right':index % 2 === 1, 'active':themeId == img.id}"
            :src="img.url"/>
          <div class="selected-wrapper" v-if="themeId == img.id">
            <div class="selected">
              <i class="iconfont icon-duigou1"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="button-area">
        <van-button type="danger" block @click="changeThemeId">应用</van-button>
      </div>
    </van-popup>
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

    export default {
      name: "Info",
      components:{

      },
      data(){
        return{
          showThemes: false,
          showVisitedTip:false,
          mask: false,
          spaceId:'',
          themeId:1,
          space:null,
          products:[],
          iconMoney:'https://static-app01.yugusoft.com/bian/money.png'
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user'
        }),
        backgrounds() {
          let arr = new Array(16);
          for (let i = 1; i <= arr.length; i++) {
            let item = {
              id: i,
              url: `https://static-app01.yugusoft.com/bian/bg_${i}.jpeg?v=2`
            }
            arr[i - 1] = item;
          }
          return arr;
        },
        isSpaceCreator(){
          let result = false
          if (this.space && this.user.id === this.space.creatorId){
            result = true
          }
          return result
        },
        isVipSpace(){
          return this.space && this.space.vip == 1
        },
        chargeTitle(){
          let result = ''
          if (this.space){
            if (this.space.type === 2){
              result = '本纪念馆为样例馆'
            }else if (!this.supportPay){
              result = ''
            }else {
              result = '以下是为支付运营成本的收费服务，感谢您的支持'
            }
          }
          return result
        },
        supportPay(){
          return config_server.supportPay
        }
      },
      methods:{
        ...mapActions({
          updateSpaceDetail: 'spaceStore/updateSpaceDetail',
        }),
        changeThemeId(e){
          let that = this;
          let spaceId = this.spaceId;
          $API.space.modifySpace({
            sid: spaceId,
            backgroundId: that.themeId
          }, rsp => {
            that.showThemes = false;
            eventHub.$emit(constant.EVENT_CHANGE_BACKGROUND_SUCCESS,{
              backgroundId:that.themeId
            })
            that.$router.push(`/space/sacrifice/${spaceId}?q=${new Date().getTime()}`);
          }, error => {
            reject && reject(error)
          })
        },
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
                this.themeId = (this.space.backgroundId||1);
                this.coupletsLeft = this.space.couplets.left
                this.coupletsRight = this.space.couplets.right
              }
              resolve()
            }, error=>{
              reject(error)
            })
          })
        },
        enterCouplets(){
          if (!this.isSpaceCreator){
            return
          }
          Link(`/store/couplets?space_id=${this.spaceId}`)
        },
        goSwitchTheme(){
          this.showThemes = true
        },
        updateInfo(){
          this.getDetail().then(()=>{
            this.initProducts()
          })
        },
        initProducts(){
          this.products = [{
            id:'package-hua-quan',
            name:'花圈装饰（永久）',
            point:60
          },{
            id:'package-xiang-zhu',
            name:'香烛长燃（1 年）',
            point:660
          },{
            id:'package-gua-guo',
            name:'瓜果贡品（7 天）',
            point:9
          },{
            id:'package-jiu-xi',
            name:'酒席（7 天）',
            point:50
          }]
          if (this.supportPay){
            this.products.unshift({
              id:'item-zhang-min-ding',
              name:'长明灯（永久，每次添加两盏，可多次）',
              point:999
            })
          }else {
            this.products.unshift({
              id:'item-zhang-min-ding',
              name:'长明灯（永久）',
              point:999
            })
          }
          //不是尊贵馆，增加对应的VIP购买
          if (!this.isVipSpace){
            this.products.unshift({
              id:'item-space-vip',
              name:'尊贵馆',
              tip:'对来访所有人员，各种祭奠物品免费。按年支付，方便祭奠',
              point:2999
            })
          }
          if (this.space.type === 2 || !this.supportPay){
            this.products = this.products.map(item=>{
              let o = item
              o.point = 0
              return o
            })
          }
        },
        buyProductBtnText(product){
          let result = '祭奠'
          if (!this.isVipSpace && product.point > 0){
            result = product.point
          }
          return result
        },
        buyProduct(product){
          let that = this;
          if (this.space){
            if (!this.isVipSpace && this.space.currentUser.point < product.point){
              this.$toast("余额不足，请先充值")
              return
            }
            let productId = product.id
            let spaceId = this.spaceId
            $API.space.buy({productId,spaceId},rsp=>{
              if (this.supportPay){
                if (this.isVipSpace){
                  this.$toast(`已祭奠${product.name}`)
                }else{
                  this.$toast(`已购买${product.name}\n扣除${product.point}云币`)
                  this.space.currentUser.point = this.space.currentUser.point - product.point
                }
              }else {
                this.$toast(`已祭奠${product.name}`)
              }
              eventHub.$emit(constant.EVENT_BUY_PRODUCT_SUCCESS,{id:product.id})
              if (productId == 'item-space-vip'){
                //这里获取一次详情？
                this.updateInfo()
              }else{
                setTimeout(()=>{
                  that.$router.push(`/space/sacrifice/${spaceId}?q=${new Date().getTime()}`);
                  // this.$router.back()
                }, 1000);
              }
            },error=>{
              this.$toast("购买失败，请稍后重试")
            })
          }else{
            this.$toast("获取信息失败，请稍后重试")
          }
        },
        goLogs(){
          Link(`/store/logs`)
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
      .menu-area{
        margin-bottom: 12px;
      }
      .charge-area{
        background: @BG_WHITE;
        .van-cell-group__title{
          color: @FONT_SECOND_COLOR;
        }

        .account-cell,.charge-cell{
          padding: 20px 15px;
        }
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
          .purchase-btn{
            min-width: 64px;
            margin-left: auto;
            color: @SECOND_THEME_COLOR;
            border: 1px solid @SECOND_THEME_COLOR;
          }
        }
        .product-cell{
          .van-cell__value{
            flex-direction: column;
            align-items: flex-start;
          }
          .product-top{
            width: 100%;
            display: flex;
            align-items: center;
            .vip-product{
              font-weight: bold;
            }
          }
          .product-bottom{
            margin-top: 4px;
            .product-tip{
              font-size: 12px;
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
    }

    &.mask {
      z-index: 999;
      opacity: 1;
    }

    .theme-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      overflow-y: auto;
      background: white;
      padding: 10px 0px;
      display: flex;
      flex-wrap: wrap;
      .theme{
        position: relative;
        .selected-wrapper{
          position: absolute;
          right: 16px;
          bottom: 10px;

          .selected{
            border-radius: 50%;
            background: rgba(130,86,33,1);
            height: 22px;
            width: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            .iconfont{
              font-size: 13px;
              color: @FONT_WHITE_COLOR;
            }
          }
        }
      }
      .van-image {
        box-sizing: border-box;
        padding: 5px 5px 0px 10px;
        transition: all 0.35s;
        &::before {
          content: '';
          position: absolute;
          top: 5px;
          right: 5px;
          bottom: 0px;
          left: 10px;
        }
        &.right {
          padding: 5px 10px 0px 5px;
          &::before {
            top: 5px;
            right: 10px;
            bottom: 0px;
            left: 5px;
          }
        }
        &.active {
          text-align: center;
          &::before {
            content: "\F02B";
            background: rgba(0, 0, 0, 0.4);
            color: #ff6034;
            font-size: 30px;
            font-family: vant-icon;
            padding-top: 50%;
            text-align: center;
          }
        }
      }
    }

    .van-popup {
      display: flex;
      flex-direction: column;
      background: #f9f9f9;
      .info {
        text-align: left;
        padding: 15px 35px 5px 15px;
        font-size: 14px;
        color: #666666;
        vertical-align: top;
        line-height: 1.5em;
        .van-icon {
          color: #666;
          margin-right: 5px;
          font-size: 14px;
        }
      }
      i {
        font-size: 14px;
      }
    }

    .button-area {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
      padding: 12px 16px;

      .van-button {
        height: 40px;
        font-weight: 500;
        font-size: 14px;
        line-height: 34px;
        border: none;
        border-radius: 0;
        &::before {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background-color: #000;
          border: inherit;
          border-color: #000;
          border-radius: inherit;
          -webkit-transform: translate(-50%, -50%);
          transform: translate(-50%, -50%);
          opacity: 0;
          themeId: ' ';
        }
        &:active::before {
          opacity: 0.1;
        }
      }

      .van-button--warning {
        background: -webkit-linear-gradient(left, #ffd01e, #ff8917);
        background: linear-gradient(to right, #ffd01e, #ff8917);
      }
      .van-button--danger {
        background: -webkit-linear-gradient(left, #ff6034, #ee0a24);
        background: linear-gradient(to right, #ff6034, #ee0a24);
      }
      .van-button:first-of-type {
        border-top-left-radius: 20px;
        border-bottom-left-radius: 20px;
      }
      .van-button:last-of-type {
        border-top-right-radius: 20px;
        border-bottom-right-radius: 20px;
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

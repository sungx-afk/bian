<template>
  <div class="info-container">
    <div class="header">
      <img src="~@/modules/images/index_header_2.png" class="header-bg" />
      <div class="header-text">彼岸云纪念意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思。</div>
    </div>
    <div class="content">
      <div class="menu-area">
        <van-cell title="自定义挽联" :is-link="isSpaceCreator" @click.stop="enterCouplets"></van-cell>
        <van-cell title="自定义主题" :is-link="isSpaceCreator" @click.stop="showThemes=true"></van-cell>
      </div>
      <div class="charge-area">
        <van-cell-group :title="chargeTitle">
          <van-cell class="charge-cell">
            <span>账号余额：</span><span class="charge-remain">{{space && space.currentUser && space.currentUser.point }}</span><span>&nbsp;云币</span>
            <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
          </van-cell>
          <van-cell v-for="product in products" :key="product.id">
            <span>{{product.name}}</span>
            <van-button size="small" class="purchase-btn" :icon="iconMoney" @click="buyProduct(product)">{{product.point}}</van-button>
          </van-cell>
        </van-cell-group>
      </div>
      <div class="analyze" v-if="space">
        <p class="label">逝者已矣，生者如斯</p>
        <p>到访人次：<span class="num">{{space.visitedTimes}}</span></p>
        <p>上香次数：<span class="num">{{space.worshipTimes}}</span></p>
      </div>
      <div class="view-history"><span @click="goLogs">充值和扣费记录</span></div>
    </div>
    <message v-if="showMessage"></message>



    <van-popup
      v-model="showThemes"
      closeable
      position="bottom"
      @open="mask=true"
      @closed="mask=false"
      @click.stop=""
      :style="{ height: '100%' }"
    >
      <div class="info">
        <van-icon name="info"/>
        请选择一个背景
      </div>
      <div class="wrapper">
        <van-image
          v-for="(img, index) in backgrounds"
          width="50vw"
          height="65vw"
          :key="img.id"
          @click="themeId = img.id"
          :class="{'right':index % 2 === 1, 'active':themeId == img.id}"
          :src="img.url"
        />
      </div>
      <div class="button-area">
        <van-button type="danger" block @click="changeThemeId">应用</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {Link} from '@/config/utils'
  import {mapGetters} from 'vuex'

  import Message from '../Message'

    export default {
      name: "Info",
      components:{
        Message
      },
      data(){
        return{
          showThemes: false,
          mask: false,
          spaceId:'',
          themeId:1,
          space:null,
          products:[],
          showMessage:false,
          iconMoney:'https://ba.yugusoft.com/api/v1/files/download/bian_user/19/07/07/1562485353014/money.png'
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
        chargeTitle(){
          let result = ''
          if (this.space){
            if (this.space.type === 2){
              result = '本纪念馆为样例馆'
            }else {
              result = '以下为支付运营成本的部分收费服务，感谢您的支持。'
            }
          }

          return result
        }
      },
      methods:{
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
        getDetail(cb){
          if (!this.spaceId){
            return
          }
          $API.space.getSpaceDetail({
            sid: this.spaceId,
          }, (rsp)=>{
            this.space = rsp;
            if (this.space.couplets){
              this.themeId = (this.space.backgroundId||1);
              this.coupletsLeft = this.space.couplets.left
              this.coupletsRight = this.space.couplets.right
            }
            cb && cb()
          }, error=>{

          })
        },
        enterCouplets(){
          if (!this.isSpaceCreator){
            return
          }
          Link(`/store/couplets?space_id=${this.spaceId}`)
        },
        updateInfo(){
          this.getDetail()
        },
        initProducts(){
          this.products = [{
            id:'package-hua-quan',
            name:'花圈装饰（永久）',
            point:60
          },{
            id:'package-xiang-zhu',
            name:'香烛长燃（1年）',
            point:660
          },{
            id:'package-gua-guo',
            name:'瓜果贡品（7天）',
            point:9
          },{
            id:'package-jiu-xi',
            name:'酒席（7天）',
            point:50
          },{
            id:'item-zhang-min-ding',
            name:'长明灯（永久）',
            point:999
          }]

          if (this.space.type === 2){
            this.products = this.products.map(item=>{
              let o = item
              o.point = 0
              return o
            })
          }
        },
        buyProduct(product){
          let that = this;
          if (this.space){
            if (this.space.currentUser.point < product.point){
              this.$toast("余额不足，请先进行充值")
              return
            }
            let productId = product.id
            let spaceId = this.spaceId
            $API.space.buy({productId,spaceId},rsp=>{
              this.$toast(`已购买${product.name}\n扣除${product.point}云币`)
              this.space.currentUser.point = this.space.currentUser.point - product.point
              eventHub.$emit(constant.EVENT_BUY_PRODUCT_SUCCESS,{id:product.id})
              setTimeout(()=>{
                //that.$router.push(`/space/sacrifice/${spaceId}?q=${new Date().getTime()}`);
                this.$router.back()
              }, 1500);
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
        registerEvent(){
          eventHub.$on(constant.EVENT_PAY_SUCCESS,this.updateInfo)
        }
      },
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
            this.getDetail((resp) => {
              console.log(resp);
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

      }
      .charge-area{
        margin-top: 12px;
        background: @BG_WHITE;
        .van-cell-group__title{
          color: @FONT_SECOND_COLOR;
        }

        .charge-cell{
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
            margin-left: auto;
            color: @SECOND_THEME_COLOR;
            border: 1px solid @SECOND_THEME_COLOR;
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

    //


    &.mask {
      z-index: 999;
      opacity: 1;
    }

    .wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      overflow-y: auto;
      background: white;
      padding: 10px 0px;
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
  }

</style>

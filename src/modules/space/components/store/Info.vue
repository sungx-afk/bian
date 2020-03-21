<template>
  <div class="info-container">
    <div class="header">
      <img src="~@/modules/images/index_header_2.png" class="header-bg" />
      <div class="header-text">彼岸云纪念意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思。</div>
    </div>
    <div class="content">
      <div class="menu-area">
        <van-cell title="自定义挽联" :is-link="isSpaceCreator" @click.stop="enterCouplets"></van-cell>
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
          spaceId:'',
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
              result = '本纪念馆为公益馆'
            }else {
              result = '以下为支付运营成本的部分收费服务，感谢您的支持。'
            }
          }

          return result
        }
      },
      methods:{
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
            this.space = rsp
            if (this.space.couplets){
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
                that.$router.push(`/space/sacrifice/${spaceId}?q=${new Date().getTime()}`);
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
            this.getDetail(() => {
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
  }

</style>

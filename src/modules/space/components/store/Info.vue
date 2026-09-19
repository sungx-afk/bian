<template>
  <div class="info-container">
    <div class="header">
      <img src="~@/modules/images/index_header_2.png" class="header-bg" />
      <div class="header-text">{{filterName}}意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思</div>
    </div>
    <div class="content">
      <div class="charge-area">
        <van-cell-group :title="chargeTitle">
          <van-cell class="account-cell">
            <span>账号ID：</span><span>{{space && space.currentUser && space.currentUser.id}}</span>
          </van-cell>
          <van-cell class="charge-cell" v-if="supportPay">
            <div class="charge-remain-wrapper">账号余额：<span class="charge-remain">{{space && space.currentUser && space.currentUser.point }}</span>&nbsp;云币</div>
            <div class="charge-btn-wrapper">
              <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
            </div>
          </van-cell>
          <van-cell class="vip-cell" v-if="supportPay && isVipSpace">
            <span style="color: #825621;">当前馆为尊贵馆，各种祭奠物品免费</span>
          </van-cell>
          <van-cell class="product-cell" :class="{'vip-cell':product.id == 'item-space-vip'}" v-for="product in products" :key="product.id">
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
        <p class="create-info">本馆由 {{ space.creator.name }} 于 {{ space.createDate | timesToDate('yyyy-MM-dd HH:mm') }} 创建</p>
      </div>
      <div class="view-history"><span @click="goLogs" v-if="supportPay">充值和扣费记录</span></div>
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

    export default {
      name: "Info",
      components:{

      },
      data(){
        return{
          showVisitedTip:false,
          spaceId:'',
          space:null,
          products:[],
          iconMoney:'https://static-app01.yugusoft.com/bian/money.png',
          products_list:[],//服务器存储的礼物列表
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

            //不是尊贵馆，增加对应的VIP购买
            if (!this.isVipSpace && this.space.type != 2 && this.showGift('item-space-vip').show){
              products.push({
                id:'item-space-vip',
                name:'尊贵馆',
                tip:'对来访所有人员，各种祭奠物品免费。按年支付，方便祭奠',
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
          // //不是尊贵馆，增加对应的VIP购买
          // if (!this.isVipSpace && this.space.type != 2){
          //   this.products.push({
          //     id:'item-space-vip',
          //     name:'尊贵馆',
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
                  //go(-1) 返回原 sacrifice 历史记录，不新增记录，避免返回时再次显示本页
                  that.$router.go(-1);
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

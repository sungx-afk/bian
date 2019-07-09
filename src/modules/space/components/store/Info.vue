<template>
  <div class="info-container">
    <div class="header">
      <img src="~@/modules/images/index_header_2.png" class="header-bg" />
      <div class="header-text">彼岸云纪念意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思。</div>
    </div>
    <div class="wanlian-area">
      <van-cell-group title="自定义挽联">
        <van-field
          v-model="coupletsLeft"
          @blur="leftInputBlur"
          label="上联"
          maxlength="10"
          placeholder="请输入上联"
        ></van-field>

        <van-field
          v-model="coupletsRight"
          @blur="rightInputBlur"
          label="下联"
          maxlength="10"
          placeholder="请输入下联">
        </van-field>
      </van-cell-group>
    </div>
    <div class="charge-area">
      <van-cell-group title="以下为支付运营成本的部分收费服务，感谢您的支持。">
        <van-cell class="charge-cell">
          <span>账号余额：</span><span class="charge-remain">{{space && space.creator && space.creator.point }}</span><span>云币</span>
          <van-button size="small" class="charge-btn" @click="charge">充值（1元 = 10云币）</van-button>
        </van-cell>
        <van-cell v-for="product in products" :key="product.id">
          <span>{{product.name}}</span>
          <van-button size="small" class="purchase-btn" :icon="iconMoney" @click="buyProduct(product)">{{product.point}}</van-button>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {Link} from '@/config/utils'
  import {mapGetters} from 'vuex'

    export default {
      name: "Store",
      data(){
        return{
          spaceId:'',
          space:'',
          products:[],
          coupletsLeft:'',
          coupletsRight:'',
          iconMoney:'https://ba.yugusoft.com/api/v1/files/download/bian_user/19/07/07/1562485353014/money.png'
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
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
            if (this.space.spaceUsers && this.space.spaceUsers.length > 0 && this.space.spaceUsers[0].couplets){
              this.coupletsLeft = this.space.spaceUsers[0].couplets.left
              this.coupletsRight = this.space.spaceUsers[0].couplets.right
            }
            cb && cb()
          }, error=>{

          })
        },
        leftInputBlur(){
          this.updateCouplets()
        },
        rightInputBlur(){
          this.updateCouplets()
        },
        updateCouplets(){
          $API.space.modifyCouplets({
            sid:this.spaceId,
            left:this.coupletsLeft,
            right:this.coupletsRight
          },rsp=>{
            eventHub.$emit(constant.EVENT_UPDATE_COUPLETS_SUCCESS,{left:this.coupletsLeft,right:this.coupletsRight})
          })
        },
        updateInfo(){
          this.getDetail()
        },
        initProducts(){
          this.products = [{
            id:'package-hua-quan',
            name:'花圈装饰（永久）',
            point:50
          },{
            id:'package-xiang-zhu',
            name:'香烛长燃（1年）',
            point:500
          },{
            id:'package-gua-guo',
            name:'瓜果贡品（7天）',
            point:5
          },{
            id:'item-zhi-qian',
            name:'纸钱（当日）',
            point:5
          }]
        },
        buyProduct(product){
          if (this.space){
            if (this.space.creator.point < product.point){
              this.$toast("余额不足，请先进行充值")
              return
            }
            let productId = product.id
            let spaceId = this.spaceId
            $API.space.buy({productId,spaceId},rsp=>{
              this.$toast(`已购买${product.name}\n扣除${product.point}云币`)
              this.space.creator.point = this.space.creator.point - product.point
              eventHub.$emit(constant.EVENT_BUY_PRODUCT_SUCCESS,{id:product.id})
            },error=>{
              this.$toast("购买失败，请稍后重试")
            })
          }else{
            this.$toast("获取信息失败，请稍后重试")
          }
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

            })
          }
        }
        this.initProducts()
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
    .wanlian-area{
      margin-top: 10px;
      background: @BG_WHITE;
      .van-cell-group__title{
        color: @MAIN_THEME_COLOR;
      }
    }
    .charge-area{
      margin-top: 10px;
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
          color: @FONT_WHITE_COLOR;
          background: @SECOND_THEME_COLOR;
        }
      }
    }
  }

</style>

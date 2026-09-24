<template>
  <div class="charge-container">
    <div class="charge-wrapper">
      <template v-if="supportPoint">
        <div class="info">请选择充值金额</div>
        <div class="tag_list clearfix">
          <div class="item" v-for="item in priceTag" :key="item.id" @click="placeOrder(item)">
            <span class="money">{{item.price/100}}元</span>
            <span>{{item.point + item.giftPoint}}云币</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="info">本平台已取消虚拟币充值：开通尊贵馆后，馆内祭奠物品免费使用。</div>
      </template>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {mapGetters} from 'vuex'
    export default {
      name: "Charge",
      data(){
        return{
          priceTag:[],
          isTest:false
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
        // 全局开关：关闭后本页不再提供云币充值
        supportPoint(){
          return !!config_server.supportPoint
        },
      },
      methods:{
        initTest(){
          if (this.user.id == '100001' || this.user.id == '101592'){
            this.isTest = true
          }
        },
        getPriceTag(){
          let param = {}
          if (this.isTest){
            param.test = 1
          }
          $API.space.getPriceTag(param,rsp=>{
            this.priceTag = rsp.list
          },error=>{

          })
        },
        placeOrder(item){
          let param = {}
          if (this.isTest){
            param.test = 1
          }
          param.price_tag_id = item.id
          $API.space.placeOrder(param,rsp=>{
            this.wechatPay(rsp).then((res)=>{
              if (res === 0){
                this.$toast("充值成功")
                eventHub.$emit(constant.EVENT_PAY_SUCCESS,item.point + item.giftPoint)
              }
            }).catch(error=>{
              this.$toast(error.errMsg)
            })
          },error=>{
            this.$toast("获取订单失败，请稍后重试")
          })
        }
      },
      created() {
        // 无云币模式：不发充值档位请求
        if (!this.supportPoint){
          return
        }
        this.initTest()
        this.getPriceTag()
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .charge-container{
    width: 100%;
    height: 100%;
    padding: 15px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    .charge-wrapper{
      flex-grow: 1;
      height: 0;
      overflow: auto;
      .info{
        font-size: 14px;
        color: @FONT_FIRST_COLOR;
      }
      .tag_list{
        margin-top: 15px;
        .item{
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 30%;
          float: left;
          height: 70px;
          margin-right: 2%;
          border: 1px solid @SECOND_THEME_COLOR;
          border-radius: 5px;
          box-sizing: border-box;
          text-align: center;
          margin-bottom: 10px;
          font-size: 13px;
          color: @SECOND_THEME_COLOR;
          .money{
            font-weight: bold;
          }
          &:active{
            background: @SECOND_THEME_COLOR;
            color: @FONT_WHITE_COLOR;
          }
        }
      }
    }
  }

</style>

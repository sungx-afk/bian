<template>
  <div class="charge-container">
    <div class="charge-wrapper">
      <div class="info">请选择充值金额</div>
      <div class="tag_list clearfix">
        <div class="item" v-for="item in priceTag" :key="item.id" @click="placeOrder(item)">
          <span class="money">{{item.price/100}}元</span>
          <span>{{item.point + item.giftPoint}}云币</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
      name: "Charge",
      data(){
        return{
          priceTag:[],
          isTest:false
        }
      },
      methods:{
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

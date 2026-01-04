<template>
  <div class="new-product-container">
    <div class="back-home">
      <div class="left-btn" @click="goHome">
        <van-icon name="arrow-left" /><span>返回</span>
      </div>
      <div class="right-btn" @click="goViewMyOrder">
        <span>历史订单</span>
      </div>
    </div>
    <div class="info">
      <div class="select-product" @click="goSelectProduct" v-if="order.products.length == 0">
        <div class="add-icon">+</div>
        <div class="add-text">点击添加商品</div>
      </div>
      <div class="product-wrapper" v-if="order.products.length > 0">
        <div class="product" v-for="item in order.products">
          <div class="img">
            <img :src="filterImgIcon(item)"/>
          </div>
          <div class="detail">
            <div class="name">{{item.name}}</div>
            <div class="num_price">
              <div class="price">¥ {{item.price | filterMoney}}</div>
              <div class="num">
                <van-stepper v-model="item.num" min="1"/>
              </div>
            </div>

          </div>
        </div>
        <div class="add-more-dashed" @click="goSelectProduct">
          <span class="icon">+</span> <span>添加更多商品</span>
        </div>
        <div class="total-bar">
          <span>商品小计</span>
          <span class="total-price">¥ {{filterTotal | filterMoney}}</span>
        </div>

      </div>




      <div class="other-info">
        <van-field v-model="order.spaceUserName" label="逝者姓名:" placeholder="请填写逝者姓名" input-align="right"></van-field>
        <van-field v-model="order.spaceName" label="告别厅:" placeholder="请填写告别厅" input-align="right"></van-field>
        <van-field v-model="order.senderName" label="赠送人:" placeholder="请填写赠送人" input-align="right"></van-field>
        <van-field v-model="order.senderPhone" label="联系电话:" placeholder="请填写联系电话" input-align="right"></van-field>
        <van-field v-model="order.summary" label="挽联内容:" placeholder="请填写挽联内容" type="textarea" input-align="right"></van-field>

      </div>

    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="confirm">{{order.id?'修改':'创建'}}</van-button>
    </div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid,accAdd,accMul} from '@/config/utils'
  import constant from '@/config/constant'
  import qs from 'qs'
  import SelectProduct from '@/modules/widget/select-product'

  export default{
    data(){
      return {
        order:{
          id:"",
          products:[],
          spaceName:"",
          spaceUserName:"",
          senderName:"",
          senderPhone:"",
          summary:"",
        },
      }
    },
    components: {
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
      showBack(){
        let result = false;
        if(this.$route && this.$route.query.opt_from && this.$route.query.opt_from == 'notice'){
          result = true;
        }
        return result;
      },
      filterTotal(){
        let result = 0;
        if(this.order.products && this.order.products.length > 0){
          this.order.products.forEach(a => {
            let money = accMul(a.num,a.price);
            result = accAdd(result,money)
          })
        }
        return result;
      }
    },
    methods:{
      goSelectProduct(){
        SelectProduct({
          callback:(list) => {
            list.forEach(a => {
              let inx = this.order.products.findIndex(b => b.id == a.id);
              if(inx < 0){
                a.num = 1;
                this.order.products.push(a);
              }
            })
          }
        })
      },
      confirm(){
        if (!this.order.products || this.order.products && this.order.products.length == 0) {
          this.$toast('请选择商品');
          return;
        }
        if(!this.order.spaceUserName){
          this.$toast('请填写逝者姓名');
          return;
        }
        if(!this.order.spaceName){
          this.$toast('请填写告别厅');
          return;
        }
        if(!this.order.senderName){
          this.$toast('请填写赠送人');
          return;
        }
        if(!this.order.senderPhone){
          this.$toast('请填写联系电话');
          return;
        }
        if(!this.order.summary){
          this.$toast('请填写挽联内容');
          return;
        }

        if(this.order.id){
          $API.mortuary.modifyOrder(this.order, rsp => {
            this.$toast({
              message:'修改成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.$router.go(-1)
              }
            })
          }, error => {
            this.$toast('修改失败，请稍后重试')
          })
        }else{
          let params = JSON.parse(JSON.stringify(this.order))
          delete params.id;
          let t_products = [];
          params.products.forEach(a => {
            let temp = {
              id:a.id,
              num:a.num
            }
            t_products.push(temp)
          })
          params.products = t_products;

          $API.mortuary.createOrder(params, rsp => {
            this.$toast({
              message:'创建成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.goPay(rsp);
              }
            })
          }, error => {
            this.$toast('创建失败，请稍后重试')
          })
        }


      },
      getOrderDetail(id){
        $API.mortuary.getOrderDetail({id}, rsp => {
          this.order = rsp;
        })
      },
      goPay(item){
        let orderId = item.id;
        $API.mortuary.getPayOrderInfo({orderId},rsp=>{
          this.wechatPay(rsp).then((res)=>{
            if (res === 0){
              this.$toast("支付成功")
              if(this.showBack){
                this.goHome();
              }else{
                this.$router.go(-1)
              }
            }
          }).catch(error=>{
            this.$toast(error.errMsg)
            if(this.showBack){
              this.goHome();
            }else{
              this.$router.go(-1)
            }
          })
        },error=>{
          this.$toast("获取订单失败，请稍后重试")
        })
      },
      goViewMyOrder(){
        Link('/mortuary/order_list?scope=my')
      },
      filterImgIcon(item){
        let url = "";
        if(item.images && item.images.length > 0){
          for(var i=0;i<item.images.length;i++){
            let obj = JSON.parse(item.images[i]);
            if(obj.url){
              url = obj.url;
              break;
            }
          }
        }
        return url;
      },
      goHome(){
        if(this.showBack){
          Link('/list')
        }else{
          this.$router.go(-1)
        }
      }
    },
    activated(){
      if(this.$route.query.id){
        this.getOrderDetail(this.$route.query.id);
      }
    },
    created() {
      if(this.$route.query.id){
        this.getOrderDetail(this.$route.query.id);
      }
    },
    beforeDestroy() {
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .new-product-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 32px;
    display: flex;
    flex-direction: column;
    .back-home{
      font-size: 16px;
      padding:12px 16px;
      background-color: #fff;
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      .left-btn,.right-btn{
        display: flex;
        align-items: center;
      }
      .right-btn{
        font-size: 14px;
        color:#999;
      }
    }
    /deep/ .van-cell{
      font-size:16px;
    }
    .info{
      padding:16px;
      overflow: auto;
      flex-grow: 1;
      height:0;
      .other-info{
        background-color: #fff;
        border-radius: 12px;
        overflow:hidden;
      }
      .product-wrapper{
        background-color: #fff;
        border-radius: 12px;
        overflow:hidden;
        margin-bottom: 16px;
        padding:0 16px;
        .add-more-dashed{
          margin: 16px 0;
          width: 100%;
          height: 48px;
          border: 1px dashed #c0c4cc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: @MAIN_THEME_COLOR;
          font-size: 14px;
          background-color: #fafafa;
          cursor: pointer;
          .icon{
            font-size: 18px;
            margin-right: 6px;
            font-weight: bold;
          }
        }
        .total-bar{
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #ebedf0;
          margin-top: 4px;
          font-size: 15px;
          .total-price{
            font-size: 18px;
            font-weight: bold;
            color: @MAIN_THEME_COLOR;
          }
        }
      }
    }

    .select-product{
      width: 100%;
      height: 140px;
      background-color: #fff;
      border: 2px dashed #c0c4cc;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
      cursor: pointer;
      transition: all 0.3s;
      box-sizing: border-box;
      &:active{
        background-color: #fafafa;
        border-color: #8d6e63;
      }
      .add-icon{
        font-size: 40px;
        color: #c0c4cc;
        line-height: 1;
        margin-bottom: 8px;
      }
      .add-text{
        font-size: 16px;
        color: #c0c4cc;
        font-weight: bold;
      }

    }
    .product{
      display: flex;
      padding:16px 0;
      background-color: #fff;
      position: relative;
      &::after{
        position: absolute;
        box-sizing: border-box;
        content: ' ';
        pointer-events: none;
        right: 16px;
        bottom: 0;
        left: 16px;
        border-bottom: 1px solid #ebedf0;
        transform: scaleY(.5);
      }
      .detail{
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        .name{
          font-size: 16px;
          font-weight: 500;
          color:#333;
        }
        .num_price{
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          .price{
            font-size: 16px;
            font-weight: bold;
            color:@MAIN_THEME_COLOR;
          }
        }

      }
      .img{
        width:72px;
        height:72px;
        flex-shrink: 0;
        border-radius: 8px;
        overflow: hidden;
        margin-right: 12px;
        img{
          width:100%;
        }
      }
    }

    .bottom-button {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      .van-button--large{
        width: 90%;
        color: white;
        height: 48px;
        line-height: 38px;
        background-color: @MAIN_THEME_COLOR;
        border-radius: 24px;
        font-size: 16px;
        font-weight: bold;
      }
    }

  }

</style>

<template>
  <div class="new-product-container">
    <div class="info">
      <div class="select-product">
        <div class="left-btn"  @click="goSelectProduct">
          <van-icon name="plus" />选择商品
        </div>
        <div class="right-btn" @click="goViewMyOrder">
          <van-button type="primary" size="small">我的历史订单</van-button>
        </div>
      </div>
      <div class="product" v-for="item in order.products">
        <div class="detail">
          <div class="name">{{item.name}}</div>
          <div class="price">¥{{item.price | filterMoney}}</div>
          <div class="num">
            <van-stepper v-model="item.num" min="1"/>
          </div>
        </div>
        <div class="img">
          <img src="https://app01.yugusoft.com/ftask/api/file/down/CFkkDWUAcHfHkHZSM5YcCb.jpeg"/>
        </div>
      </div>
      <van-field v-model="order.spaceUserName" label="逝者姓名:" placeholder="请填写逝者姓名" input-align="right"></van-field>
      <van-field v-model="order.spaceName" label="告别厅:" placeholder="请填写告别厅" input-align="right"></van-field>
      <van-field v-model="order.senderName" label="赠送人:" placeholder="请填写赠送人" input-align="right"></van-field>
      <van-field v-model="order.senderPhone" label="联系电话:" placeholder="请填写联系电话" input-align="right"></van-field>
      <van-field v-model="order.summary" label="挽联内容:" placeholder="请填写挽联内容" type="textarea" input-align="right"></van-field>
    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="confirm">{{order.id?'修改':'创建'}}</van-button>
    </div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
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
              this.$router.go(-1)
            }
          }).catch(error=>{
            this.$toast(error.errMsg)
            this.$router.go(-1)
          })
        },error=>{
          this.$toast("获取订单失败，请稍后重试")
        })
      },
      goViewMyOrder(){
        Link('/mortuary/order_list?scope=my')
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
    .select-product{
      display: flex;
      align-items: center;
      padding:10px;
      background-color: #fff;
      position: relative;
      font-size: 15px;
      color:#825621;
      justify-content: space-between;
      &:active{
        background-color: #f2f3f5;
      }
      &::after{
        position: absolute;
        box-sizing: border-box;
        content: ' ';
        pointer-events: none;
        right: 0;
        bottom: 0;
        left: 16px;
        border-bottom: 1px solid #ebedf0;
        transform: scaleY(.5);
      }
    }
    .product{
      display: flex;
      padding:10px;
      background-color: #fff;
      position: relative;
      &::after{
        position: absolute;
        box-sizing: border-box;
        content: ' ';
        pointer-events: none;
        right: 0;
        bottom: 0;
        left: 16px;
        border-bottom: 1px solid #ebedf0;
        transform: scaleY(.5);
      }
      .detail{
        flex-grow: 1;
        .name{
          font-size: 16px;
          font-weight: 700;
        }
        .price{
          margin-top:5px;
        }
        .num{
          margin-top:5px;
        }
      }
      .img{
        width:70px;
        height:70px;
        flex-shrink: 0;
        border-radius: 5px;
        overflow: hidden;
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
        height: 40px;
        line-height: 38px;
        background-color: @MAIN_THEME_COLOR;
      }
    }

  }

</style>

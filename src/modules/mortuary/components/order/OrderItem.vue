<template>
  <div class="order-item" :class="{'from-detail':source == 'detail'}" @click="goViewDetail">
    <div class="sub-item">
      订单编号：{{item.id}}
      <van-tag type="success" v-if="item.status == 'PAID'">已支付</van-tag>
      <van-tag type="danger" v-if="item.status == 'DELIVERED'">已完成</van-tag>
      <van-tag type="default" v-if="item.status == 'CANCELED'">已取消</van-tag>
    </div>
    <div class="sub-item">下单人：{{item.senderName}}</div>
    <div class="sub-item">下单时间：{{item.createDate | timesToDate('yyyy-MM-dd HH:mm')}}</div>
    <div class="sub-item">挽联留言：{{item.summary}}</div>
    <div class="sub-item">送至：{{item.spaceName}} 逝者：{{item.spaceUserName}}</div>
    <div class="products-wrapper" v-if="item.products.length > 0">
      <template v-for="product in item.products">
        <div class="sub-item product">
          <div class="icon">
            <img :src="filterImgIcon(product)"/>
          </div>
          <div class="name">{{product.name}}</div>
          <div class="price">¥{{product.price | filterMoney}}</div>
          <div class="number">x{{product.num}}</div>
        </div>
      </template>
      <div class="sub-item ar" >商品总金额：¥{{filterTotal | filterMoney}}</div>
    </div>





    <div class="sub-item btn" v-if="item.status != 'CANCELED'">
      <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click.stop="goPay(item)">支付订单</van-button>
      <!-- <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click="goDel(item)">删除订单</van-button> -->
      <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click.stop="goCancel(item)">取消订单</van-button>
      <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click.stop="goEdit(item)">修改订单</van-button>
      <van-button v-if="item.status != 'DELIVERED' && item.status != 'CANCELED' && user && user.merchant_manager" type="primary" size="small" @click.stop="goFinishOrder(item)">完成订单</van-button>
    </div>
    <div class="deliver" v-if="item.status == 'DELIVERED'">
      <div class="sub-item">交付人：{{item.deliverUser && item.deliverUser.name}}</div>
      <div class="sub-item">交付说明：{{item.deliverSummary}}</div>
      <div class="sub-item">
        交付图片：
      </div>
      <div class="sub-item">
        <img v-for="img in item.deliverImages" :src="filterImg(img)"/>
      </div>
    </div>
  </div>
</template>


<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid,accAdd,accMul} from '@/config/utils'
  import FinishOrder from '@/modules/widget/finish-order'
  export default{
    props:["item","source"],
    data(){
      return {
        locked:false,
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
      filterTotal(){
        let result = 0;
        if(this.item && this.item.products && this.item.products.length > 0){
          this.item.products.forEach(a => {
            let money = accMul(a.num,a.price);
            result = accAdd(result,money)
          })
        }

        return result;
      }
    },
    methods:{
      getList(){
        this.$emit('refresh')
      },
      goPay(item){
        let orderId = item.id;
        $API.mortuary.getPayOrderInfo({orderId},rsp=>{
          this.wechatPay(rsp).then((res)=>{
            if (res === 0){
              this.$toast("支付成功")
              this.getList();
            }
          }).catch(error=>{
            this.$toast(error.errMsg)
          })
        },error=>{
          this.$toast("获取订单失败，请稍后重试")
          this.getList();
        })
      },
      goDel(item){
        this.$dialog.confirm({
          title: '提示',
          message: '确定要删除吗？',
        })
        .then(() => {
          $API.mortuary.deleteOrder({sid:item.id}, rsp => {
            this.$toast({
              message:'删除成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.getList()
              }
            })
          }, error => {
            this.$toast('操作失败，请稍后重试')
          })
        })
        .catch(() => {
          // on cancel
        });
      },
      goEdit(item){
        Link('/mortuary/new_order?id='+item.id);
      },
      goFinishOrder(item){
        Link('/mortuary/finish_order?id='+item.id);
      },
      filterImg(item){
        item = JSON.parse(item);
        if(item.url){
          return item.url;
        }else{
          return ''
        }
      },
      goCancel(item){
        this.$dialog.confirm({
          title: '提示',
          message: '确定要取消该订单吗？',
        })
        .then(() => {
          $API.mortuary.cancelOrder({sid:item.id}, rsp => {
            this.$toast({
              message:'取消成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.getList()
              }
            })
          }, error => {
            this.$toast('操作失败，请稍后重试')
          })
        })
        .catch(() => {
          // on cancel
        });
      },
      goViewDetail(){
        if(this.source == 'list'){
          Link('/mortuary/order_detail?id=' + this.item.id)
        }
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
    },
    activated(){
    },
    created(){
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .order-item{
    padding:10px 0 0 0;
    border-bottom:3px solid #f4f4f4;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,.15);
    &.from-detail{
      border-bottom: none;
      box-shadow: none;
    }
    .products-wrapper{
      padding:6px 0;
      border-top: 2px solid #f4f4f4;
    }
    .sub-item{
      margin-bottom:6px;
      font-size: 16px;
      padding:0 20px;
      &.ar{
        text-align: right;
      }
      &.product{
        display: flex;
        align-items: center;
        .icon{
          width:40px;
          height:40px;
          flex-shrink: 0;
          border-radius: 5px;
          overflow: hidden;
          img{
            width:100%;
          }
        }
        .name{
          flex-grow: 1;
          padding-left: 10px;
        }
        .number,.price{
          flex-shrink: 0;
          padding-left: 10px;
        }
      }
      &.btn{
        text-align: right;
        /deep/ .van-button--primary{
          background: @MAIN_THEME_COLOR;
          border:1px solid @MAIN_THEME_COLOR;
        }
      }
    }
    .deliver{
      background-color: #f4f4f4;
      padding:4px 0;
      .sub-item{
        img{
          max-width: 60px;
        }
      }
    }
  }
</style>

<template>
  <div class="order-item" :class="{'from-detail':source == 'detail'}" @click="goViewDetail">
    <div class="sub-item header">
      <div class="create_date">{{item.createDate | timesToDate('yyyy-MM-dd HH:mm')}}</div>
      <div class="status" :class="[item.status]">
        <template v-if="item.status == 'CREATED'">待支付</template>
        <template v-else-if="item.status == 'PAID'">已支付</template>
        <template v-else-if="item.status == 'DELIVERED'">已完成</template>
        <template v-else-if="item.status == 'CANCELED'">已取消</template>
      </div>
    </div>
    <div class="sub-item order_code">
      <span>订单号：{{item.id}}</span>
      <span class="copy-btn" @click.stop="goCopy(item)">复制</span>
    </div>
    <div class="sub-item"><span class="label">下单：</span>{{item.senderName}}</div>
    <div class="sub-item"><span class="label">挽联：</span>{{item.summary}}</div>
    <div class="sub-item"><span class="label">送至：</span>{{item.spaceName}}</div>
    <div class="sub-item"><span class="label">逝者：</span>{{item.spaceUserName}}</div>
    <div class="products-wrapper" v-if="item.products.length > 0">
      <template v-for="product in item.products">
        <div class="sub-item product">
          <div class="icon">
            <img :src="filterImgIcon(product)"/>
          </div>
          <div class="right-info">
            <div class="name">{{product.name}}</div>
            <div class="number_price">
              <div class="number">x{{product.num}}</div>
              <div class="price">¥{{product.price | filterMoney}}</div>
            </div>

          </div>

        </div>
      </template>
    </div>
    <div class="sub-item total" >共{{filterTotalNumber}}件商品，总计：¥<span class="money">{{filterTotal | filterMoney}}</span></div>

    <div class="sub-item btn" v-if="item.status == 'CREATED' && user && item.creatorId == user.id || showFinishBtn">
      <!-- <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click="goDel(item)">删除订单</van-button> -->
      <van-button v-if="item.status == 'CREATED' && user && item.creatorId == user.id" type="primary" size="small" plain @click.stop="goCancel(item)">取消订单</van-button>
      <van-button v-if="item.status == 'CREATED' && user && item.creatorId == user.id" type="primary" size="small" plain @click.stop="goEdit(item)">修改订单</van-button>
      <van-button v-if="item.status == 'CREATED' && user && item.creatorId == user.id" type="primary" size="small" :plain="showFinishBtn" @click.stop="goPay(item)">支付订单</van-button>
      <van-button v-if="showFinishBtn" type="primary" size="small" @click.stop="goFinishOrder(item)">完成订单</van-button>
    </div>
<!--    <div class="deliver" v-if="item.status == 'DELIVERED'">
      <div class="sub-item">交付人：{{item.deliverUser && item.deliverUser.name}}</div>
      <div class="sub-item">交付说明：{{item.deliverSummary}}</div>
      <div class="sub-item">
        交付图片：
      </div>
      <div class="sub-item">
        <img v-for="img in item.deliverImages" @click="goViewImg(img)" :src="filterImg(img)"/>
      </div>
    </div> -->
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
      },
      filterTotalNumber(){
        let result = 0;
        if(this.item && this.item.products && this.item.products.length > 0){
          this.item.products.forEach(a => {
            result = accAdd(result,a.num)
          })
        }
        return result;
      },
      showFinishBtn(){
        let result = false;
        if(this.item.status != 'DELIVERED' && this.item.status != 'CANCELED' && this.user && this.user.merchant_manager){
          result = true;
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
      goViewImg(img){
        var url = this.filterImg(img);
        if(url){
          window.open(url);
        }
      },
      goCopy(item){
        let id = item.id;
        const textarea = document.createElement('textarea');
        textarea.value = id;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.$toast({
          message:'复制成功',
          type:'success',
          onClose:()=>{
          }
        })
      }
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
    background: #fff;
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    &.from-detail{
      border-bottom: none;
      box-shadow: none;
    }
    .products-wrapper{
      background-color: #FAFAFA;
      padding: 8px 0;
      margin-top: 8px;
    }
    .sub-item{
      margin-bottom:6px;
      font-size: 14px;
      padding:0 20px;
      .label{
        font-size: 14px;
        color:#999;
        font-weight: bold;
        min-width: 40px;
      }
      &.total{
        text-align: right;
        font-size: 14px;
        margin-bottom: 12px;
        border-top: 1px solid #eee;
        padding-top: 12px;
        .money{
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
      }
      &.order_code{
        font-size: 12px;
        color: #BBB;
        display: flex;
        align-items: center;
        .copy-btn{
          margin-left: 8px;
          border: 1px solid #EEE;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          color: #999;
          cursor: pointer;
        }
      }
      &.header{
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding:12px 16px;
        border-bottom: 1px solid #eee;
        font-size: 13px;
        color:#999;
        .status{
          font-weight: 14px;
          font-weight: bold;
          color:@MAIN_THEME_COLOR;
          &.PAID{
            color:#00c166;
          }
          &.DELIVERED,&.CANCELED{
            color:#999;
          }
        }
      }
      &.ar{
        text-align: right;
      }
      &.product{
        display: flex;
        align-items: center;
        .icon{
          width:48px;
          height:48px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          img{
            width:100%;
          }
        }
        .right-info{
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-left: 10px;
          .number_price{
            display: flex;
            align-items: center;
            justify-content: space-between;
            .number,.price{
              flex-shrink: 0;
            }
          }
        }


      }
      &.btn{
        text-align: right;
        /deep/ .van-button--primary{
          background: @MAIN_THEME_COLOR;
          border:1px solid @MAIN_THEME_COLOR;
          border-radius: 16px;
          &.van-button--plain{
            border:1px solid @MAIN_THEME_COLOR;
            background: #fff;
            color:#666;
          }
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

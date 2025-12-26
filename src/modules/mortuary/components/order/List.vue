<template>
  <div class="list-wrapper">
    <template v-if="list.length > 0">
      <div class="order-item" v-for="item in list" :key="item.id">
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
        <div class="sub-item btn" v-if="item.status != 'CANCELED'">
          <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click="goPay(item)">支付订单</van-button>
          <!-- <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click="goDel(item)">删除订单</van-button> -->
          <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click="goCancel(item)">取消订单</van-button>
          <van-button v-if="item.status == 'CREATED' && item.creatorId == user.id" type="primary" size="small" @click="goEdit(item)">修改订单</van-button>
          <van-button v-if="item.status != 'DELIVERED' && item.status != 'CANCELED' && user && user.merchant_manager" type="primary" size="small" @click="goFinishOrder(item)">完成订单</van-button>
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
    <div v-else>
      <van-empty description="暂无订单数据" />
    </div>




    <div class="new-btn" @click="goNewOrder">
      <i class="iconfont icon-anonymous-iconfont"></i>
    </div>

  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  import FinishOrder from '@/modules/widget/finish-order'
  export default{
    data(){
      return {
        list:[],
        locked:false,
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
    },
    methods:{
      goNewOrder(){
        let url = '/mortuary/new_order'
        Link(url)
      },
      getList(){
        if(this.locked){
          return false;
        }
        this.locked = true;
        console.log("====>>>",this.$route.query)
        if(this.$route.query.scope && this.$route.query.scope == 'my'){
          $API.mortuary.getMyOrderList({},(rsp) => {
            this.list = rsp;
            this.locked = false;
          },() => {
            this.locked = false;
          })
        }else{
          $API.mortuary.getOrderList({},(rsp) => {
            this.list = rsp;
            this.locked = false;
          },() => {
            this.locked = false;
          })
        }
      },
      goPay(item){
        let orderId = item.id;
        $API.mortuary.getPayOrderInfo({orderId},rsp=>{
          this.wechatPay(rsp).then((res)=>{
            if (res === 0){
              this.$toast("支付成功")
            }
          }).catch(error=>{
            this.$toast(error.errMsg)
          })
        },error=>{
          this.$toast("获取订单失败，请稍后重试")
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
      }
    },
    activated(){
      this.getList();
    },
    created(){
      this.getList();
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .list-wrapper{
    width:100%;
    height:100%;
    overflow: auto;
    .order-item{
      padding:10px 0 0 0;
      border-bottom:1px solid #f4f4f4;
      .sub-item{
        margin-bottom:6px;
        font-size: 14px;
        padding:0 20px;
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
    .new-btn{
      width:50px;
      height:50px;
      line-height:50px;
      color:#fff;
      text-align: center;
      background: @MAIN_THEME_COLOR;
      border-radius: 100%;
      position: fixed;
      bottom: 25px;
      right: 20px;
      .iconfont{
        font-size:20px;
      }
    }
  }
</style>

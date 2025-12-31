<template>
  <div class="order_detail">
    <div class="back-home">
      <div class="left-btn" @click="goHome">
        <span>⬅</span>
      </div>
    </div>
    <div class="detail-wrapper" v-if="order">
      <div class="card">
        <div class="status-header" :class="[order && order.status]">
            <div class="status-left">
                <span v-if="order.status == 'CREATED'">订单未支付</span>
                <span v-else-if="order.status == 'PAID'">订单已支付</span>
                <span v-else-if="order.status == 'DELIVERED'">服务已完成</span>
                <span v-else-if="order.status == 'CANCELED'">订单已取消</span>
            </div>
            <div class="status-right">感谢信任</div>
        </div>
        <div class="service-body">
            <div class="deceased-info">
              <div>
                  <span class="deceased-label">逝者</span>
                  <span class="deceased-name">{{order.spaceUserName}}</span>
              </div>
            </div>

            <div class="location-row">
                <span style="margin-right: 6px;">📍</span>
                送至：{{order.spaceName}}
            </div>

            <!-- 挽联：用引号和特殊字体强调 -->
            <div class="couplet-box">
                {{order.summary}}<br>
                <span style="font-size:12px; color:#999; margin-top:4px; display:block;">(左联 / 右联)</span>
            </div>
        </div>
      </div>

      <div class="card"  v-if="order.status == 'DELIVERED'">
        <div class="delivery-header">
            <span class="delivery-title">交付现场反馈</span>
            <span class="delivery-staff">专员: {{order.deliverUser && order.deliverUser.name || '匿名'}}</span>
        </div>
        <div class="delivery-content">
            <div class="delivery-text">
                {{order.deliverSummary || '暂无交付说明'}}
            </div>

            <!-- 图片网格：这里放置了4张图，如果是2张会自动填充第一行 -->
            <div class="image-grid">
                <img v-for="img in order.deliverImages" @click="goViewImg(img)" :src="filterImg(img)" class="delivery-img" alt="现场图片">
            </div>
        </div>
      </div>


      <div class="card receipt-card">
        <div class="prod-list">
            <div class="prod-item"  v-for="product in order.products">
                <div class="prod-left">
                    <img :src="filterImgIcon(product)" class="prod-pic">
                    <span class="prod-name">{{product.name}}</span>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:bold;">¥ {{product.price | filterMoney}}</div>
                    <div style="font-size:12px; color:#999;">x{{product.num}}</div>
                </div>
            </div>
        </div>

        <div class="meta-section">
            <div class="meta-row">
                <span>商品总额</span>
                <span style="color:#333; font-weight:bold;">¥ {{filterTotal | filterMoney}}</span>
            </div>
            <div style="height:6px;"></div>
            <div class="meta-row">
                <span>订单编号</span>
                <span>{{order.id}} <span class="copy-link" @click.stop="goCopy">复制</span></span>
            </div>
            <div class="meta-row">
                <span>下单时间</span>
                <span>{{order.createDate | timesToDate('yyyy-MM-dd HH:mm')}}</span>
            </div>
        </div>
      </div>



    </div>
    <div class="detail-opt btn" v-if=" order && (order.status == 'CREATED' && user && order.creatorId == user.id || showFinishBtn)">
      <van-button v-if="order.status == 'CREATED' && user && order.creatorId == user.id" type="primary" size="small" plain @click.stop="goCancel(order)">取消订单</van-button>
      <van-button v-if="order.status == 'CREATED' && user && order.creatorId == user.id" type="primary" size="small" plain @click.stop="goEdit(order)">修改订单</van-button>
      <van-button v-if="order.status == 'CREATED' && user && order.creatorId == user.id" type="primary" size="small" :plain="showFinishBtn" @click.stop="goPay(order)">支付订单</van-button>
      <van-button v-if="showFinishBtn" type="primary" size="small" @click.stop="goFinishOrder(order)">完成订单</van-button>
    </div>
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid,accAdd,accMul} from '@/config/utils'
  import OrderItem from './OrderItem'
  export default{
    components:{
      OrderItem
    },
    data(){
      return {
        order:null
      }
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
      },
      showFinishBtn(){
        let result = false;
        if(this.order.status != 'DELIVERED' && this.order.status != 'CANCELED' && this.user && this.user.merchant_manager){
          result = true;
        }
        return result;
      }
    },
    methods:{
      getDetail(){
        if(this.$route.query.id){
          $API.mortuary.getOrderDetail({id:this.$route.query.id}, rsp => {
            this.order = rsp;
          })
        }
      },
      goHome(){
        if(this.showBack){
          Link('/list')
        }else{
          this.$router.go(-1)
        }
      },
      filterImg(item){
        item = JSON.parse(item);
        if(item.url){
          return item.url;
        }else{
          return ''
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
      goPay(item){
        let orderId = item.id;
        $API.mortuary.getPayOrderInfo({orderId},rsp=>{
          this.wechatPay(rsp).then((res)=>{
            if (res === 0){
              this.$toast("支付成功")
              this.getDetail();
            }
          }).catch(error=>{
            this.$toast(error.errMsg)
          })
        },error=>{
          this.$toast("获取订单失败，请稍后重试")
          this.getDetail();
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
                this.getDetail()
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
                this.getDetail()
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
      goCopy(item){
        let id = this.order.id;
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
      this.getDetail();
    },
    created(){
      this.getDetail();
    }
  }
</script>

<style lang="less" scoped>
  @import "~@/config/config.less";
  .order_detail{
    width:100%;
    height:100%;
    background-color: #f6f6f6;
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
    .detail-opt{
      flex-shrink: 0;
      padding:10px 16px;
      background: #fff;
      border-top: 1px solid #ccc;
      text-align: center;
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
    .detail-wrapper{
      flex-grow: 1;
      height:0;
      padding: 16px;
      overflow: auto;
      .card{
        background: #fff;
        border-radius: 12px;
        margin-bottom: 16px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        .status-header{
          background: @MAIN_THEME_COLOR;
          color: #fff;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          &.PAID{
            background: #00c166;
          }
          &.CANCELED{
            background: #999;
          }
          .status-left{
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: bold;
            font-size: 15px;
          }
          .status-right{
            font-size: 13px;
            opacity: 0.9;
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 8px;
            border-radius: 4px;
          }

        }
        .service-body{
          padding:16px;
          .deceased-info{
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 8px;
            .deceased-label{
              font-size: 12px;
              color: #999;
              margin-right: 4px;
            }
            .deceased-name{
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
          }
          .location-row{
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #555;
            margin-bottom: 16px;
            background: #f9f9f9;
            padding: 8px;
            border-radius: 6px;
          }
          .couplet-box{
            position: relative;
            background-color: #FDFBF7;
            border: 1px solid #F0E6DE;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 15px;
            color: #5D4037;
            text-align: center;
            font-family: "KaiTi", "楷体", serif;
            line-height: 1.4;
            &::before{
              content: '"';
              position: absolute;
              top: 2px;
              left: 6px;
              font-size: 24px;
              color: #D7CCC8;
              font-family: sans-serif;
            }

          }

        }

        .delivery-header{
          padding: 12px 16px;
          border-bottom: 1px solid #f5f5f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          .delivery-title{
            font-weight: bold;
            font-size: 15px;
            border-left: 3px solid #8d6e63;
            padding-left: 8px;
            line-height: 1;
          }
          .delivery-staff{
            font-size: 13px;
            color: #666;
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 10px;
          }
        }
        .delivery-content{
          padding:16px;
          .delivery-text{
            margin-bottom: 12px;
            font-size: 14px;
            color: #444;
            line-height: 1.5;
          }
          .image-grid{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            .delivery-img{
              width: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 8px;
              background-color: #eee;
              border: 1px solid rgba(0, 0, 0, 0.05);
            }
          }
        }

        &.receipt-card{
          padding:0;
          .prod-list{
            padding:0 16px;
            .prod-item{
              display: flex;
              justify-content: space-between;
              padding: 14px 0;
              border-bottom: 1px dashed #eee;
              align-items: center;
              .prod-left{
                display: flex;
                align-items: center;
                .prod-pic{
                  width: 36px;
                  height: 36px;
                  border-radius: 4px;
                  background: #ddd;
                  margin-right: 10px;
                  object-fit: cover;
                }
                .prod-name{
                  font-size: 14px;
                }
              }
            }
          }
          .meta-section{
            background-color: #FAFAFA;
            padding: 12px 16px;
            border-top: 1px solid #f0f0f0;
            .meta-row{
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #999;
              margin-bottom: 6px;
              .copy-link{
                    color: #8d6e63;
                    cursor: pointer;
                    margin-left: 4px;
              }
            }
          }
        }


      }
    }

  }
</style>

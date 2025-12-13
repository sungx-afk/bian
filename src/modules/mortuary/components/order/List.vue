<template>
  <div class="list-wrapper">
    <div class="order-item">
      <div class="sub-item">订单编号：20251220221</div>
      <div class="sub-item">下单人：张三</div>
      <div class="sub-item">下单时间：2025-12-20 14:23</div>
      <div class="sub-item">挽联留言：测试留言</div>
      <div class="sub-item">送至：xx厅 逝者：张三</div>
      <div class="sub-item btn">
        <van-button type="primary" size="small">完成订单</van-button>
      </div>
    </div>
    <div class="new-btn" @click="goNewOrder">
      <i class="iconfont icon-anonymous-iconfont"></i>
    </div>

  </div>
</template>

<script>
  import {Link,gUuid} from '@/config/utils'
  export default{
    methods:{
      goNewOrder(){
        let url = '/mortuary/new_order'
        Link(url)
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .list-wrapper{
    .order-item{
      padding:10px 20px;
      border-bottom:1px solid #f4f4f4;
      .sub-item{
        margin-bottom:6px;
        font-size: 14px;
        &.btn{
          text-align: right;
          /deep/ .van-button--primary{
            background: @MAIN_THEME_COLOR;
            border:1px solid @MAIN_THEME_COLOR;
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

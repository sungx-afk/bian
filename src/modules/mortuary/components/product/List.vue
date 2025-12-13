<template>
  <div class="list-wrapper">
    <div class="product-item">
      <div class="icon">
        <img src="https://app01.yugusoft.com/ftask/api/file/down/CFkkDWUAcHfHkHZSM5YcCb.jpeg"/>
      </div>
      <div class="info">
        <div class="name">花圈（大）</div>
        <div class="price">¥20.00</div>
      </div>
      <div class="operate">
        <i class="iconfont icon-gengduo"></i>
      </div>
    </div>
    <div class="product-item">
      <div class="icon">
        <img src="https://app01.yugusoft.com/ftask/api/file/down/CFkkDWUAcHfHkHZSM5YcCb.jpeg"/>
      </div>
      <div class="info">
        <div class="name">花圈（小）</div>
        <div class="price">¥15.00</div>
      </div>
      <div class="operate">
        <i class="iconfont icon-gengduo"></i>
      </div>
    </div>
    <div class="new-btn" @click="goNewProduct">
      <i class="iconfont icon-anonymous-iconfont"></i>
    </div>

  </div>
</template>

<script>
  import {Link,gUuid} from '@/config/utils'
  export default{
    methods:{
      goNewProduct(){
        let url = '/mortuary/new_product'
        Link(url)
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .list-wrapper{
    .product-item{
      display: flex;
      padding:10px 20px;
      border-bottom:1px solid #f4f4f4;
      &:last-child{
        border-bottom: none;
      }
      .icon{
        width:70px;
        height:70px;
        flex-shrink: 0;
        border-radius: 5px;
        overflow: hidden;
        img{
          width:100%;
        }
      }
      .info{
        flex-grow:1;
        padding-left:10px;
        .name{
          font-size:16px;
          font-weight: 700;
        }
        .price{
          font-size: 14px;
          margin-top: 10px;
        }
      }
      .operate{
        flex-shrink: 0;
        .iconfont{
          font-weight: 700;
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

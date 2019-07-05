<template>
  <div class="charge-container">
    <div class="charge-wrapper">
      <div class="info">请选择充值金额</div>
      <div class="tag_list clearfix">
        <div class="item">
          <span class="money">1元</span>
          <span>100云币</span>
        </div>
        <div class="item">
          <span class="money">5元</span>
          <span>500云币</span>
        </div>
        <div class="item">
          <span class="money">10元</span>
          <span>1000云币</span>
        </div>
        <div class="item">
          <span class="money">20元</span>
          <span>2000云币</span>
        </div>
        <div class="item">
          <span class="money">50元</span>
          <span>5000云币</span>
        </div>
        <div class="item">
          <span class="money">100元</span>
          <span>10000云币</span>
        </div>
      </div>
    </div>
    <div class="view-history" @click="goLogs">充值和扣费记录</div>
  </div>
</template>

<script>
  import {Link} from '@/config/utils'
    export default {
      name: "Charge",
      methods:{
        goLogs(){
          Link(`/store/logs`)
        }
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
          border: 1px solid #00a5ff;
          border-radius: 5px;
          box-sizing: border-box;
          text-align: center;
          margin-bottom: 10px;
          font-size: 13px;
          color: #00a5ff;
          .money{
            font-weight: bold;
          }
          &:active{
            background: #00a5ff;
            color: #fff;
          }
        }
      }
    }
    .view-history{
      background: #fff;
      font-size: 14px;
      color: #8796c3;
      text-align: center;
      width: 100%;
      cursor: pointer;
      padding: 10px 0 30px;
      flex-shrink: 0;
    }
  }

</style>

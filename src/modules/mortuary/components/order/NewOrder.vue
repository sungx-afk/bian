<template>
  <div class="new-product-container">
    <div class="info">
      <div class="product">
        <div class="detail">
          <div class="name">花圈（大）</div>
          <div class="price">¥20.00</div>
        </div>
        <div class="img">
          <img src="https://app01.yugusoft.com/ftask/api/file/down/CFkkDWUAcHfHkHZSM5YcCb.jpeg"/>
        </div>
      </div>
      <van-field v-model="order.name" label="逝者姓名:" placeholder="请填写逝者姓名" input-align="right"></van-field>
      <van-field v-model="order.address" label="告别厅:" placeholder="请填写告别厅" input-align="right"></van-field>
      <van-field v-model="order.user_name" label="赠送人:" placeholder="请填写赠送人" input-align="right"></van-field>
      <van-field v-model="order.tel" label="联系电话:" placeholder="请填写联系电话" input-align="right"></van-field>
      <van-field v-model="order.content" label="挽联内容:" placeholder="请填写挽联内容" type="textarea" input-align="right"></van-field>
    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="confirm">{{order.uuid?'修改':'创建'}}</van-button>
    </div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  import constant from '@/config/constant'
  import qs from 'qs'

  export default{
    data(){
      return {
        order:{
          uuid:"",
          address:"",
          user_name:"",
          content:"",
          name:"",
          tel:""
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
      confirm(){


      }
    },
    created() {
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
          margin-top:10px;
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

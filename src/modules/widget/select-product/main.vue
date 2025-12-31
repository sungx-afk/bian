<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="select-product-box" v-show="show">
      <div class="item-box">
        <div class="list-wrapper">
          <div class="product-item" @click="goSelect(item)" v-for="item in list" :key="item.id">
            <div class="icon">
              <img v-if="filterImg(item)" :src="filterImg(item)"/>
              <div class="no-image" v-else></div>
            </div>
            <div class="info">
              <div class="name">{{item.name}}</div>
              <div class="price">¥{{item.price | filterMoney}}</div>
            </div>
            <div class="operate" v-if="isSelect(item)">
              <van-icon name="checked" />
            </div>
          </div>
        </div>
        <div class="bottom-button">
          <van-button type="default" @click.tap="cancel">取消</van-button>
          <van-button type="default" @click.tap="confirm">确定</van-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>

  import {timesToDate,dateToTimes} from '@/config/utils'
  export default {
    data(){
      return {
        show:false,
        callback:null,
        list:[],
        select:[]
      }
    },
    computed:{

    },
    methods: {
      afterLeave(){
        this.$el &&
        this.$el.parentNode &&
        this.$el.parentNode.removeChild(this.$el);
        this.$destroy();
        this.closeEnd();
      },
      close(){
        this.show = false;
      },
      cancel(){
        this.close()
      },
      confirm(){
        this.callback && this.callback(this.select)
        this.close()
      },
      filterImg(item){
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
      isSelect(item){
        let index = this.select.findIndex(a => a.id == item.id);
        if(index >= 0){
          return true;
        }else{
          return false;
        }
      },
      getList(){
        $API.mortuary.getProductList({},(rsp) => {
          this.list = rsp;
        })
      },
      goSelect(item){
        let index = this.select.findIndex(a => a.id == item.id);
        if(index >= 0){
          this.select.splice(index,1)
        }else{
          this.select.push(item)
        }
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.show = true;
        this.getList();
      });
    },
    created(){
    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  .select-product-box{
    overflow-y: auto;
    .modal();
    .item-box{
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-y: hidden;
      .list-wrapper{
        flex-grow:1;
        height:0;
        overflow: auto;

        .product-item{
          display: flex;
          padding:10px 20px;
          border-bottom:1px solid #f4f4f4;
          align-items: center;
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
            .no-image{
              width:100%;
              height:100%;
              background: url(~@/modules/images/no_image.png) no-repeat;
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
            .van-icon{
              color:#825621;
              font-size:18px;
            }
          }
        }

      }
       .bottom-button {
        display: flex;
        justify-content: center;
        flex-shrink: 0;
        padding:10px 0;
        .van-button{
          width: 40%;
          color: white;
          height: 40px;
          line-height: 38px;
          background-color: @MAIN_THEME_COLOR;
          border-radius: 20px;
          &:first-child{
            color:#666666;
            background-color:white;
            margin-right: 16px;
          }
        }
      }
    }
  }
</style>

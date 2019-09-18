<template>
  <div class="share-container">
    <div class="share-top">
      <div class="share-top-text">
        <span>请先点击右上角"..."</span>
        <span>然后选择"发送给朋友"或"分享到朋友圈"</span>
      </div>
      <div class="share-top-image">
        <img src="~@/modules/images/share_arrow.png"/>
      </div>
    </div>
    <div class="share-middle">
      <img src="~@/modules/images/index_header.jpg" class="header">
      <div class="text-area">
        <div class="text">爱，永存</div>
      </div>
    </div>
    <div class="share-bottom">
      <div class="">

      </div>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
    export default {
      name: "Share",
      data(){
        return{
          extra:null
        }
      },
      methods:{
        initShare(){
          let data = {
            title: '彼岸纪念',
            success: () => { //你重置分享成功后的回调

            }
          }
          if (this.extra){
            data.extra = this.extra
          }
          this.wechatShare(data)
        }
      },
      created() {
        let value = localStorage.getItem(constant.KEY_EXTRA_DATA)
        localStorage.removeItem(constant.KEY_EXTRA_DATA)
        if (value){
          this.extra = JSON.parse(value)
        }
        this.initShare()
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .share-container{
    .share-top{
      display: flex;
      align-items: center;
      padding: 40px 20px;
      .share-top-text{
        display: flex;
        font-size: 14px;
        flex-direction: column;
      }
      .share-top-image{
        margin-left: auto;
        img{
          width: 70px;
          height: 70px;
        }
      }
    }
    .share-middle{
      display: flex;
      justify-content: center;
      position: relative;
      .header{
        height: 200px;
      }
      .text-area{
        position: absolute;
        display: flex;
        justify-content: center;
        top: 90px;
        width: 100%;
        .text{
          text-align: center;
          color: white;
          font-size: 22px;
          padding: 2px 20px;
          background: rgba(0,0,0,0.5);
        }
      }
    }
    .share-bottom{

    }
  }
</style>

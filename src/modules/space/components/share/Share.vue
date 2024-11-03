<template>
  <div class="share-container">
    <div class="share-top" v-if="!isIphone">
      <div class="share-title">方式一</div>
      <div class="share-body">
        <div class="share-top-text">
          <span>请先点击右上角"..."</span>
          <span>{{shareTip1}}</span>
        </div>
        <div class="share-top-image">
          <img src="~@/modules/images/share_arrow.png"/>
        </div>
      </div>

    </div>
    <div class="share-middle">
      <div class="share-title" v-if="!isIphone">方式二</div>
      <div class="share-middle-text">
        <span class="share-middle-tip">{{shareTip2}}</span>
        <button class="copy-link" :data-clipboard-text="copyContent" @click="copyLink">复制链接</button>
      </div>
    </div>
    <div class="share-bottom">
      <img src="~@/modules/images/logo_gray.png" class="header">
      <span class="text">爱，永存!</span>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {isIphone} from '@/config/utils'

  import qs from 'qs'
  import base64 from 'js-base64'
  import ClipboardJS from 'clipboard'

    export default {
      name: "Share",
      data(){
        return{
          extra:null,
          copyContent:''
        }
      },
      computed:{
        isIphone(){
          return isIphone()
        },
        isAddFriends(){
          let result = false
          if (this.extra && this.extra.origin_from === 'add_friends'){
            result = true
          }
          return result
        },
        shareTip1(){
          let result = '然后选择"发送给朋友"或"分享到朋友圈"'
          if (this.isAddFriends){
            result += '(仅用于亲属邀请，分享48小时过期）'
          }

          return result
        },
        shareTip2(){
          let result = ''

          if (this.isAddFriends){
            result = '请点击按钮复制纪念馆链接，然后直接发送给亲友。（此链接仅用于亲属邀请，48小时过期）'
          }else{
            result = '请点击按钮复制纪念馆链接，然后直接发送给朋友或者聊天群'
          }

          return result
        }
      },
      methods:{
        initShare(){
          //不是iOS的直接初始化分享
          if (!this.isIphone){
            let data = {
              title: '彼岸思念',
              success: () => { //你重置分享成功后的回调

              }
            }
            if (this.extra){
              if (this.extra.space_name){
                data.desc = `逝者已矣，生者如斯。来自 ${this.extra.space_name}`
                delete this.extra.space_name
              }
              data.extra = this.extra
              data.timestamp = new Date().getTime()
            }
            this.wechatShare(data)
          }

          let content = qs.stringify(this.extra,{indices:false})
          if (this.isAddFriends){
            content = content + '&timestamp=' + new Date().getTime()
          }
          content = base64.Base64.encode(content)
          content = content.replace(/\+/g, '-') // Convert '+' to '-'
            .replace(/\//g, '_')

          this.copyContent = `${config_server.domain}/home?copylink=${content}`
        },
        copyLink(){
          let clipboard = new ClipboardJS('.copy-link');
          clipboard.on('success', (e)=> {
            this.$notify({
              type:'info',
              message: '已复制到剪贴板',
              color: '#ffffff',
              background: '#825621'
            });
            // 释放内存
            clipboard.destroy()
          });
          clipboard.on('error', function (e) {
            console.log(e);
          });
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
      flex-direction: column;
      padding: 20px 20px;
      .share-title{
        font-weight: bold;
      }
      .share-body{
        display: flex;
        align-items: center;
        .share-top-text{
          display: flex;
          flex-direction: column;
          font-size: 14px;
          line-height: 28px;
        }
        .share-top-image{
          margin-left: auto;
          img{
            width: 70px;
            height: 70px;
          }
        }
      }

    }
    .share-middle{
      display: flex;
      flex-direction: column;
      padding: 20px 20px;
      .share-title{
        font-weight: bold;
        margin-bottom: 20px;
      }
      .share-middle-text{
        display: flex;
        font-size: 14px;
        flex-direction: column;
        .share-middle-tip{
          margin-bottom: 20px;
          line-height: 28px;
        }
      }
      .copy-link{
        padding: 10px;
        border:none;
        background: @MAIN_THEME_COLOR;
        color: white;
        &:active{
          background:@MAIN_THEME_COLOR;
          opacity: 0.8;
        }
      }
    }
    .share-bottom{
      display:flex;
      flex-direction:column;
      align-items: center;
      .header{
        width: 100px;
        height: 100px;
      }
      .text{
        font-size: 16px;
        color: #a9a9a9;
      }
    }
  }
</style>

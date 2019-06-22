<template>
  <div class="meeting-container">
    <div class="tip" v-if="!posterMaking">
      温馨提示：为刚去世的亲人创建电子讣告并发送给他人，对方点击后可进行在线祭奠。
    </div>
    <div class="poster-html" id="posterHtml">
      <div class="report-area">
        <div class="report-header">
          <div class="title">讣告</div>
        </div>
        <van-field
          v-model="deathNotice"
          type="textarea"
          placeholder="请填写讣告内容"
          :rows="rows"
          :autosize="{ maxHeight: maxH, minHeight: minH }">
        </van-field>
      </div>
      <div class="poster-area">
        <div class="poster-left-content">
          <img class="logo" src="~@/modules/images/logo.png">
          <div class="app-name-area">
            <div class="app-name">彼岸纪念</div>
            <div class="app-tip">识别二维码在线祭奠</div>
          </div>
        </div>
        <div class="poster-right-content" v-if="qrCodeUrl">
          <img class="qrcode" :src="qrCodeUrl">
        </div>
      </div>
    </div>
    <div id="myCanvas"></div>
    <div class="poster-btn" v-if="!posterMaking">
      <van-button @click.stop="makePoster" type="default">发到朋友圈</van-button>
    </div>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex';

  import html2canvas from 'html2canvas'
  import Canvas2Image from '@/config/canvas2image'

    export default {
      name: "Meeting",
      data(){
        return{
          spaceId:'',
          deathNotice:'',
          qrCodeUrl:'',
          rows:10,
          maxH:400,
          minH:200,
          posterMaking:false
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
      },
      methods:{
        getSpaceDetail(){

        },
        getWxQrCode(){
          let scene = `meeting_${this.spaceId}_${this.user.id}`
          $API.space.getWxQrCode({
            scene: scene
          }, rsp => {
            this.qrCodeUrl = rsp.url
          }, error => {

          })
        },
        makePoster(){
          this.posterMaking = true
          const domObj = document.getElementById("posterHtml");

          let width = document.documentElement.clientWidth;
          let height = document.documentElement.clientHeight;
          let scale = window.devicePixelRatio;
          let canvas = document.createElement("canvas");

          canvas.width = width * scale;
          canvas.height = height * scale;
          canvas.getContext('2d').scale(scale, scale);

          let opts = {
            canvas: canvas,
            width: width,
            height: height,
            scale,
            logging: true,
            useCORS: true,
            allowTaint: false,
            letterRendering: true,
          };

          html2canvas(domObj, opts).then(function(canvas) {
            let context = canvas.getContext("2d");
            // 关闭抗锯齿形
            context.mozImageSmoothingEnabled = false;
            context.webkitImageSmoothingEnabled = false;
            context.msImageSmoothingEnabled = false;
            context.imageSmoothingEnabled = false;

            let img = Canvas2Image.convertToImage(
              canvas,
              canvas.width,
              canvas.height
            );

            img.style.width = canvas.width / scale + 'px'
            img.style.height = canvas.height / scale + 'px'
            img.style.position = 'absolute'
            img.style.top = '0px'
            img.style.left = '0px'


            document.getElementById("myCanvas").appendChild(img);
          })
        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getSpaceDetail()
          this.getWxQrCode()
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .meeting-container{
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    background-color: #f6f6f6;
    .tip{
      font-size:14px;
      padding:10px;
      color:#666666;
    }
    .poster-html{
      width: 100%;
      .report-area{
        width: 100%;
        background:@BG_WHITE;
        margin-top:10px;
        .report-header{
          position: relative;
          height:40px;
          display:flex;
          align-items:center;
          justify-content:center;
          .title{
            font-size: 16px;
            font-weight: bold;
          }
        }
      }
      .poster-area{
        display: flex;
        align-items: center;
        width: 100%;
        justify-content: center;
        margin-top: 20px;
        .poster-left-content{
          display: flex;
          align-items: center;
          .logo{
            width: 40px;
            height: 40px;
          }
          .app-name-area{
            display: flex;
            flex-direction: column;
            margin: 0px 10px;
            .app-name{
              font-size: 16px;
              font-weight: bold;
              color: @FONT_SECOND_COLOR;
            }
            .app-tip{
              font-size: 14px;
              color: @FONT_THIRD_COLOR;
            }
          }
        }
        .poster-right-content{
          .qrcode{
            width: 60px;
            height: 60px;
          }
        }
      }
    }
    .poster-btn{
      width: 100%;
      display: flex;
      justify-content: center;
      margin-top: 20px;
      .van-button{
        width: 40%;
        height: 40px;
        line-height: 38px;
        margin:0px 10px;
      }
    }
  }

</style>

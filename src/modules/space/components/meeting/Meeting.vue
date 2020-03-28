<template>
  <div class="meeting-container">
    <template v-if="showPoster">
      <div class="poster-mask">
        <div class="tip">
          <i class="iconfont icon-tishi1"></i>请长按下方图片保存二维码图片到手机相册后，发送给微信亲友。
        </div>
      </div>
      <div class="poster-area">
        <i class="iconfont icon-guanbi close" @click="closePoster"></i>
        <img id="logo" src="~@/modules/images/logo.png" style="display: none;"/>
        <canvas class="canvas" id="myCanvas" v-if="!posterDone"></canvas>
        <img id="poster" :class="posterDone?'':'poster-hidden'" :width="posterW" :height="posterH">
      </div>

    </template>
    <template v-else>
      <div class="tip">
        <i class="iconfont icon-tishi1"></i>为刚去世的亲人创建电子讣告并发送给他人，对方点击后可进行在线祭奠。
      </div>
      <div class="report-area">
        <div class="report-header">
          <div class="title">讣告</div>
        </div>
        <van-field
          v-model="deathNotice"
          type="textarea"
          placeholder="请填写讣告内容"
          :rows="rows"
          :autosize="{ maxHeight: maxH, minHeight: minH }"
          @blur="noticeInputBlur">
        </van-field>
      </div>
      <div class="poster-btn">
        <van-button @click.stop="makePoster" type="default">发给亲友</van-button>
      </div>
    </template>

  </div>
</template>

<script>
  import {mapGetters} from 'vuex';
  import config_server from '@/config/config'
  import base64 from 'js-base64'

  const FONT = "px bold Pingfang SC,STHeiti,Lantinghei SC,Open Sans,Arial,Hiragino Sans GB,Microsoft YaHei,WenQuanYi Micro Hei,SimSun,sans-serif"

    export default {
      name: "Meeting",
      data(){
        return{
          spaceId:'',
          spaceDetail:null,
          deathNotice:'',
          qrCode:'',
          rows:10,
          maxH:400,
          minH:200,
          posterW:0,
          posterH:0,
          context:null,
          ratio:1,
          showPoster:false,
          logoDrawDone:false,
          qrCodeDrawDone:false,
          posterDone:false
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
      },
      watch:{
        logoDrawDone(newVal,oldVal){
          if (!newVal){
            return
          }
          if (this.qrCodeDrawDone){
            this.generateImage()
          }
        },
        qrCodeDrawDone(newVal,oldVal){
          if (!newVal){
            return
          }
          if (this.logoDrawDone){
            this.generateImage()
          }
        },
      },
      methods:{
        getSpaceDetail(cb){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.spaceDetail = rsp
            cb && cb()
          })
        },
        initDeathNotice(){
          let notice = ''
          if (this.spaceDetail && this.spaceDetail.spaceUsers && this.spaceDetail.spaceUsers.length > 0){
            if (this.spaceDetail.spaceUsers[0].deathNotice){
              notice = this.spaceDetail.spaceUsers[0].deathNotice
            }
          }
          if (!notice){
            this.deathNotice = `xxx 同志因 xx 不幸于 xxxx 年 xx 月 xx 日在 xx 市逝世，终年 xx 岁。葬礼遵其遗愿，一切从简，特此讣告。

xxx`
          }else{
            this.deathNotice = notice
          }
        },
        noticeInputBlur(){
          this.updateDeathNotice()
        },
        updateDeathNotice(){
          let userId = this.spaceDetail.spaceUsers[0].id
          $API.space.updateSpaceUserNotice({
            sid: this.spaceId,
            userId: userId,
            deathNotice: this.deathNotice,
          }, rsp=>{

          })
        },
        initPosterWH(){
          this.posterW = document.documentElement.clientWidth - 50
          this.posterH = document.documentElement.clientHeight - 150
        },
        makePoster(){
          this.showPoster = true
          this.initPosterWH()
          this.$nextTick(()=>{
            this.drawPoster()
          })
        },
        closePoster(){
          this.showPoster = false
          this.logoDrawDone = false
          this.qrCodeDrawDone = false
          this.posterDone = false
          this.context = null
        },
        drawPoster(){
          let that = this

          let canvas = document.getElementById('myCanvas')

          if (!that.context){
            that.context = canvas.getContext('2d')
          }
          that.ratio = that.getRatio(that.context) || 1; // 屏幕分辨率

          canvas.width = that.posterW * that.ratio;
          canvas.height = that.posterH * that.ratio;

          canvas.style.width = that.posterW + "px";
          canvas.style.height = that.posterH + "px";

          that.context.scale(that.ratio, that.ratio);

          this.$toast.loading({
            duration: 0,       // 持续展示 toast
            forbidClick: true, // 禁用背景点击
            loadingType: 'spinner',
            message: '生成图片中...'
          })
          that.drawBg()
          that.drawTitle()
          that.drawContent()
          that.drawLogo()
          that.drawTip()
          that.drawQrCode()
        },
        drawBg(){
          this.context.fillStyle = '#ffffff'
          this.context.fillRect(0, 0, this.posterW, this.posterH)
        },
        drawTitle(){
          let title = '讣告'
          let tx = (this.posterW - 20)/2 - 10
          let ty = 50
          let fontSize = 16
          if (this.ratio > 1){
            fontSize = 20
          }
          this.context.font = "bold " + fontSize + FONT
          this.context.fillStyle = '#000000'
          this.context.fillText(title, tx, ty);
        },
        drawContent(){
          if (this.deathNotice){
            let fontSize = 14
            if (this.ratio > 1){
              fontSize = 16
            }
            this.context.font = fontSize + FONT
            this.context.fillStyle = '#333333'

            let content = this.deathNotice
            let lines = content.split('\n')
            let prevY = 60
            for (let i = 0; i < lines.length; i++) {
              let line = lines[i]
              let x = 40/2
              let y = 30 + prevY
              let maxWidth = this.posterW - 40
              let lineHeight = 30

              prevY = this.drawMultiLine(this.context,line,x,y,maxWidth,lineHeight)
            }
          }
        },
        drawMultiLine(context, text, x, y, maxWidth, lineHeight) {
          let arrText = text.split('');
          let line = '';
          for (let n = 0; n < arrText.length; n++) {
            let mtLine = line + arrText[n];
            let metrics = context.measureText(mtLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              context.fillText(line, x, y);
              line = arrText[n];
              y += lineHeight;
            } else {
              line = mtLine;
            }
          }
          context.fillText(line, x, y);
          return y
        },
        drawLogo(){
          let lw = 35
          let lh = 35
          let lx = 30
          let ly = this.posterH - lh - 28

          let that = this

          let img = document.getElementById('logo')
          img.onload = ()=>{
            this.context.drawImage(img,lx,ly,lw, lh)
            that.logoDrawDone = true
          }
        },
        drawTip(){
          let name = '彼岸天堂纪念'
          let nx =70
          let ny = this.posterH - 50

          let fontSize = 16
          if (this.ratio > 1){
            fontSize = 16
          }
          this.context.font = fontSize + FONT

          this.context.fillStyle = '#000000'

          this.context.fillText(name, nx, ny);

          let tip = '识别二维码在线祭奠'
          let tx = 70
          let ty = this.posterH - 30

          fontSize = 12
          if (this.ratio > 1){
            fontSize = 14
          }

          this.context.font = fontSize + FONT
          this.context.fillStyle = '#666666'
          this.context.fillText(tip, tx, ty);
        },
        drawQrCode(){
          let qw = 50
          let qh = 50
          let qx = this.posterW - qw - 30
          let qy = this.posterH - qh - 20

          let that = this
          let img = new Image();
          let param = getRequestParam()
          //let scene = `meeting_${this.spaceId}_${this.user.id}`
          //let url = `${config_server.domain}/api/v1/wx/qrcode/create?scene=${scene}&with_image=1&plat=${param.plat}&build=${param.build}&token=${param.token}&platVersion=${param.platVersion}`
          let shareContent = `origin_from=meeting&space_id=${this.spaceId}&invite_user_id=${this.user.id}`
          shareContent = base64.Base64.encode(shareContent)
          let shareUrl = `${config_server.domain}/home?copylink=${shareContent}`
          let url = `${config_server.domain}/api/v1/qrcode?content=${shareUrl}&plat=${param.plat}&build=${param.build}&token=${param.token}&platVersion=${param.platVersion}`
          console.log(url)
          img.setAttribute("crossOrigin",'Anonymous');
          img.src = url
          img.onload = ()=>{
            this.context.drawImage(img,qx,qy,qw, qh)
            that.qrCodeDrawDone = true
          }
          img.onerror = ()=>{
            setTimeout(()=>{
              this.$toast('获取信息失败，请稍后重试')
            },500)
          }
        },
        generateImage(){
          setTimeout(()=>{
            this.posterDone = true
            this.$toast.clear()

            let canvas = document.getElementById('myCanvas')
            let image = document.getElementById('poster');
            image.src = canvas.toDataURL("image/png");
            console.log(image.src)
          })
        },
        getRatio(context) {
          let devicePixelRatio = window.devicePixelRatio || 1;
          let backingStorePixelRatio = context.webkitBackingStorePixelRatio ||
            context.mozBackingStorePixelRatio ||
            context.msBackingStorePixelRatio ||
            context.oBackingStorePixelRatio ||
            context.backingStorePixelRatio || 1;
          let ratio = devicePixelRatio / backingStorePixelRatio;
          return ratio;
        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getSpaceDetail(()=>{
            this.initDeathNotice()
          })
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
      .iconfont{
        margin-right: 4px;
      }
    }
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
        color: white;
        background-color: @MAIN_THEME_COLOR;
      }
    }
    .poster-mask{
      position: fixed;
      z-index: 1000;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background: rgba(0, 0, 0, 0.6);
      .tip{
        display: flex;
        padding: 15px;
        justify-content: center;
        font-size: 14px;
        color: @FONT_WHITE_COLOR;
        .iconfont{
          padding-top: 2px;
          margin-right: 4px;
        }
      }
    }
    .poster-area{
      position: fixed;
      z-index: 1001;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #FFFFFF;
      text-align: center;
      overflow: hidden;
      box-sizing: border-box;
      .canvas{
        margin: 0 auto;
      }
      .close{
        position: absolute;
        top: 10px;
        right: 10px;
        color: #a9a9a9;
      }
      .poster-hidden{
        display: none;
      }
    }
  }

</style>

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
        <canvas class="canvas" id="myCanvas" v-if="!posterDone"></canvas>
        <img id="poster" :class="posterDone?'':'poster-hidden'" :width="posterW" :height="posterH">
      </div>

    </template>
    <template v-else>
      <div class="tip">
        <i class="iconfont icon-tishi1"></i>为刚去世的亲人创建电子讣告并发送给他人，对方点击后可进行在线祭奠。
      </div>
      <div class="report-area" v-if="spaceUsers">
        <div class="report-header">
          <div class="title">讣告</div>
        </div>
        <div class="avatar-wrapper" v-if="avatarChecked">
          <img :src="avatarUrl"  v-if="avatarUrl"/>
          <div v-else class="avatar-fake"></div>
          <div class="loading">
            <van-loading  v-if="uploadAvatarLoading" vertical color="#FFFFFF">上传中...</van-loading>
          </div>

        </div>
        <van-field
          v-model="deathNotice"
          type="textarea"
          placeholder="请填写讣告内容"
          :rows="rows"
          :autosize="{ maxHeight: maxH, minHeight: minH }"
          @blur="noticeInputBlur">
        </van-field>
        <div class="avatar-operate">
          <van-checkbox class="show-avatar" v-model="avatarChecked" name="avatar" shape="square" checked-color="#825621">显示遗像</van-checkbox>
          <template v-if="avatarChecked">
            <van-button class="switch-btn" size="small" v-if="showSwitchBtn" @click="switchAvatar">切换遗像</van-button>
            <van-uploader :after-read="afterSelectPhoto">
              <van-button class="upload-btn" size="small">重新上传</van-button>
            </van-uploader>
          </template>
        </div>
      </div>
      <div class="poster-btn">
        <van-button @click.stop="makePoster" type="default">下一步</van-button>
      </div>
    </template>

  </div>
</template>

<script>
  import {mapGetters} from 'vuex';
  import config_server from '@/config/config'

  import {timesToDate,Link,gUuid} from '@/config/utils'

  import constant from '@/config/constant'

  import base64 from 'js-base64'

  const MAIN_COLOR = '#FFFFFF' //#000000
  const TIP_COLOR = '#FFFFFF' //#666666
  const FONT = "px bold Pingfang SC,STHeiti,Lantinghei SC,Open Sans,Arial,Hiragino Sans GB,Microsoft YaHei,WenQuanYi Micro Hei,SimSun,sans-serif"

    export default {
      name: "Meeting",
      data(){
        return{
          spaceId:'',
          spaceUsers:null,
          deathNotice:'',
          qrCode:'',
          rows:5,
          maxH:160,
          minH:100,
          posterW:0,
          posterH:0,
          context:null,
          ratio:1,
          showPoster:false,
          logoDrawDone:false,
          qrCodeDrawDone:false,
          avatarDrawDone:false,
          posterDone:false,
          avatarChecked:true,
          avatarUrl:'',
          uploadAvatarLoading:false
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
        showSwitchBtn(){
          let result = false
          if (this.spaceUsers.length > 1 && this.spaceUsers.filter(user=>user.avatarUrl).length > 1){
            result = true
          }
          return result
        }
      },
      watch:{
        logoDrawDone(newVal,oldVal){
          if (!newVal){
            return
          }
          if (this.avatarChecked){
            if (this.qrCodeDrawDone && this.avatarDrawDone){
              this.generateImage()
            }
          }else {
            if (this.qrCodeDrawDone){
              this.generateImage()
            }
          }
        },
        qrCodeDrawDone(newVal,oldVal){
          if (!newVal){
            return
          }
          if (this.avatarChecked){
            if (this.logoDrawDone && this.avatarDrawDone){
              this.generateImage()
            }
          }else {
            if (this.logoDrawDone){
              this.generateImage()
            }
          }

        },
        avatarDrawDone(newVal,oldVal){
          if (!newVal){
            return
          }
          if (this.logoDrawDone && this.qrCodeDrawDone){
            this.generateImage()
          }
        }
      },
      methods:{
        getSpaceDetail(cb){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.spaceUsers = rsp.spaceUsers
            this.avatarUrl = this.spaceUsers[0].avatarUrl
            cb && cb()
          })
        },
        initDeathNotice(){
          let notice = ''
          if (this.spaceUsers[0]){
            if (this.spaceUsers[0].deathNotice){
              notice = this.spaceUsers[0].deathNotice
            }
          }
          if (notice){
            this.deathNotice = notice
          }else{
            if (this.spaceUsers && this.spaceUsers.length === 1){
              let spaceUser = this.spaceUsers[0]
              let content = ''
              let dieDate = spaceUser.dieDay? timesToDate(spaceUser.dieDay,'yyyy 年 MM 月 dd 日') : 'xxxx 年 xx 月 xx 日'
              let age = 'xx'

              if (spaceUser.birthday && spaceUser.dieDay){
                age = new Date(spaceUser.dieDay).getFullYear() - new Date(spaceUser.birthday).getFullYear() + 1
              }

              content += `${spaceUser.name}`
              content += spaceUser.sex?'女士':'先生'
              content += '因 xx 不幸于 '
              content += dieDate
              content += `在 xx 市逝世，享年 ${age} 岁。葬礼遵其遗愿，一切从简，特此讣告。

xxx`

              this.deathNotice = content
            }else{
              this.deathNotice = `xxx 先生/女士因 xx 不幸于 xxxx 年 xx 月 xx 日在 xx 市逝世，享年 xx 岁。葬礼遵其遗愿，一切从简，特此讣告。

xxx`
            }
          }
        },
        noticeInputBlur(){
          this.updateDeathNotice()
        },
        updateDeathNotice(){
          let userId = this.spaceUsers[0].id
          $API.space.updateSpaceUserNotice({
            sid: this.spaceId,
            userId: userId,
            deathNotice: this.deathNotice,
          }, rsp=>{

          })
        },
        switchAvatar(){
          let index = this.spaceUsers.findIndex(item=>item.avatarUrl === this.avatarUrl)
          if (index === -1){
            index = 0
          }
          if (index > 0){
            this.avatarUrl = this.spaceUsers[index-1].avatarUrl
          }else {
            this.avatarUrl = this.spaceUsers[index+1].avatarUrl
          }
        },
        afterSelectPhoto(photo){
          let data = {}
          data.identifier = this.identifier = gUuid()
          data.content = photo.content
          data.name = photo.file.name
          data.size = photo.file.size
          data.type = photo.file.type
          data.lastModified = photo.file.lastModified
          this.$store.dispatch('spaceStore/setCropImageData',data)
          this.$nextTick(()=>{
            Link(`/cropper`)
          })
        },
        updateAvatarData(result){
          let that = this
          let info = result.info

          if (info.identifier !== this.identifier){
            return
          }

          let cropperData = result.cropperData
          that.avatarUrl = result.cropperData
          that.uploadAvatarLoading = false

          $API.space.filesQiniuUploadTicket({
            reqType: 'general_file',
            name: info.name,
            expand: info.name.replace(/.+\./, ''),
            size: info.size,
          }, resp => {
            $API.space.filesQiniuUpload({
              data:cropperData,
              token:resp.uptoken,
              key:resp.key
            },rsp=>{
              that.avatarUrl = rsp.url
              that.uploadAvatarLoading = false
            },error=>{
              this.$toast("上传失败，请稍后重试")
              that.uploadAvatarLoading = false
            })
          },error=>{
            this.$toast("上传失败，请稍后重试")
            that.uploadAvatarLoading = false
          })
        },
        initPosterWH(){
          this.posterW = document.documentElement.clientWidth - 50
          this.posterH = document.documentElement.clientHeight - 150
        },
        makePoster(){

          if (this.avatarChecked && !this.avatarUrl){
            this.$toast("请上传遗像或不使用遗像")
            return
          }

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
          this.avatarDrawDone = false
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
          that.drawBg().then(()=>{
            that.drawTitle()
            that.drawAvatar()
            that.drawContent()
            that.drawLogo()
            that.drawTip()
            that.drawQrCode()
          })
        },
        drawBg(){
          return new Promise((resolve,reject)=>{
            let img = new Image()
            img.setAttribute("crossOrigin",'Anonymous');
            img.src = 'https://static-app01.yugusoft.com/bian/fugao2_bg.png'

            img.onload = ()=>{
              this.context.drawImage(img,0,0,this.posterW, this.posterH)
              resolve()
            }
          })
          
        },
        drawTitle(){
          let title = '讣告'
          let tx = (this.posterW - 20)/2 - 10
          let ty = 50
          let fontSize = 18
          if (this.ratio > 1){
            fontSize = 20
          }
          this.context.font = "bold " + fontSize + FONT
          this.context.fillStyle = MAIN_COLOR
          this.context.fillText(title, tx, ty);
        },
        drawAvatar(){

          if (!this.avatarChecked){
            return
          }
          let lw = 80
          let lh = 102
          let lx = (this.posterW - lw)/2
          let ly = 60

          let that = this

          let img = new Image()
          img.setAttribute("crossOrigin",'Anonymous');
          img.src = this.avatarUrl

          img.onload = ()=>{
            this.context.drawImage(img,lx,ly,lw, lh)
            that.avatarDrawDone = true
          }
        },
        drawContent(){
          if (this.deathNotice){
            let fontSize = 14
            if (this.ratio > 1){
              fontSize = 16
            }
            this.context.font = fontSize + FONT
            this.context.fillStyle = MAIN_COLOR

            let content = this.deathNotice
            let lines = content.split('\n')
            let prevY = 60
            if (this.avatarChecked){
              prevY += 110
            }
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

          let img = new Image()
          img.setAttribute("crossOrigin",'Anonymous');
          img.src = 'https://static-app01.yugusoft.com/bian/logo.png'

          img.onload = ()=>{
            this.context.drawImage(img,lx,ly,lw, lh)
            that.logoDrawDone = true
          }
        },
        drawTip(){
          let name = '彼岸思念'
          let nx =70
          let ny = this.posterH - 50

          let fontSize = 16
          if (this.ratio > 1){
            fontSize = 16
          }
          this.context.font = fontSize + FONT

          this.context.fillStyle = MAIN_COLOR

          this.context.fillText(name, nx, ny);

          let tip = '识别二维码在线祭奠'
          let tx = 70
          let ty = this.posterH - 30

          fontSize = 11
          if (this.ratio > 1){
            fontSize = 12
          }

          this.context.font = fontSize + FONT
          this.context.fillStyle = TIP_COLOR
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

          url = url + "&v=" + new Date().getTime()
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
        eventHub.$on(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
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
    overflow-y: auto;
    padding-bottom: 32px;
    box-sizing: border-box;
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
      .report-header{
        position: relative;
        height:40px;
        display:flex;
        align-items:center;
        justify-content:center;
        .title{
          font-size: 18px;
          font-weight: bold;
        }
      }
      .avatar-wrapper{
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        img{
          width: 80px;
          height: 102px;
        }
        .avatar-fake{
          width: 80px;
          height: 102px;
          border: 2px solid @MAIN_THEME_COLOR;
        }
        .loading{
          position: absolute;
          margin-top: 60px;
          /deep/.van-loading__text{
            color: #FFFFFF;
          }
        }
      }
      .avatar-operate{
        display: flex;
        align-items: center;
        padding: 20px;
        .show-avatar{
          /deep/.van-checkbox__label{
            font-size: 13px;
            color: @FONT_THIRD_COLOR;
          }
        }
        .switch-btn,.upload-btn{
          margin: 0px 8px;
        }
      }
    }
    .poster-btn{
      width: 100%;
      display: flex;
      justify-content: center;
      margin-top: 20px;
      margin-bottom: 120px;
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
      // background-color: #FFFFFF;
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
        font-size: 20px;
        color: @MAIN_THEME_COLOR;
      }
      .poster-hidden{
        display: none;
      }
    }
  }

</style>

<template>
  <div class="bgm-container">
    <van-cell-group title="预置">
      <van-cell v-for="item in presetBgm" :key="item.key" :title="item.name" :label="item.author" size="large" @click.stop="selectPresetBgm(item)">
        <div v-if="showPresetSelected(item)">
          <i class="iconfont icon-duigou1"></i>
        </div>
      </van-cell>
    </van-cell-group>
    <van-cell-group title="自定义">
      <van-cell v-if="selfUpload && selfUpload.length > 0" :title="selfUpload[0].name" size="large" @click.stop="selectCustomBgm">
        <div v-if="showCustomSelected()">
          <i class="iconfont icon-duigou1"></i>
        </div>
      </van-cell>
      <template v-if="isShowUploader()">
        <van-uploader accept="audio/mpeg" :after-read="afterSelectAudio">
          <van-button icon="music-o" size="small">选择背景音乐</van-button>
        </van-uploader>
      </template>
      <van-button  class="paste-btn" icon="edit" size="small" @click="showPasteDialog">手动输入</van-button>
    </van-cell-group>
    <van-popup class="popup-area" v-model="isShowPasteDialog" round="false" @closed="pasteDialogClosed">
      <van-field class="popup-cell" v-model="pasteName" placeholder="请输入音乐名称" input-align="left"></van-field>
      <van-field class="popup-cell" v-model="pasteUrl" placeholder="请输入音乐地址" input-align="left"></van-field>
      <div class="bottom-button">
        <van-button @click.stop="cancelPaste">取消</van-button>
        <van-button class="confirm" type="default" @click.stop="confirmPaste">确定</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {checkUrlHttpOrHttps,isIphone} from '@/config/utils'
    export default {
      name: "Bgm",
      data(){
        return{
          spaceId:'',
          isShowPasteDialog:false,
          pasteName:'',
          pasteUrl:''
        }
      },
      methods:{
        isShowUploader(){
          return !isIphone()
        },
        getSpaceDetail(cb){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.initBgm(rsp)
            cb && cb()
          })
        },
        showPresetSelected(item){
          let result = false
          if (this.currentBgmKey){
            result = item.key === this.currentBgmKey
          }
          return result
        },
        selectPresetBgm(item){
          if (item.key === this.currentBgmKey){
            return
          }
          this.playBgm(0,{bgmKey:item.key})
          $API.space.updateSpaceBgm({
            sid:this.spaceId,
            key:item.key,
            selfUpload:this.selfUpload
          },rsp=>{
            eventHub.$emit(constant.EVENT_UPDATE_BGM_SUCCESS,{bgmKey:item.key,spaceId:this.spaceId})
          })
        },
        showCustomSelected(){
          return this.currentBgmKey === 'custom'
        },
        selectCustomBgm(){
          this.updateCustomBgm()
        },
        updateCustomBgm(cb){
          this.playBgm(0,{bgmKey:'custom'})
          $API.space.updateSpaceBgm({
            sid:this.spaceId,
            key:'custom',
            selfUpload:this.selfUpload
          },rsp=>{
            cb && cb()
            eventHub.$emit(constant.EVENT_UPDATE_BGM_SUCCESS,{bgmKey:'custom',selfUpload:this.selfUpload,spaceId:this.spaceId})
          })
        },
        afterSelectAudio(audio){
          if (audio.file.size > 5 * 1024 * 1024){
            this.$toast("文件过大，请选择合适长度的背景音乐")
            return
          }
          this.$toast.loading({
            duration: 0,       // 持续展示 toast
            forbidClick: true, // 禁用背景点击
            loadingType: 'spinner',
            message: '上传中...'
          })
          $API.space.filesQiniuUploadTicket({
            reqType: 'general_file',
            name: audio.file.name,
            expand: audio.file.name.replace(/.+\./, ''),
            size: audio.file.size,
          }, resp => {
            $API.space.filesQiniuUpload({
              data:audio.content,
              token:resp.uptoken,
              key:resp.key
            },rsp=>{
              this.$toast.clear()
              if (this.selfUpload.length > 0){
                this.selfUpload[0] = {name:audio.file.name,url:rsp.url}
              }else{
                this.selfUpload.push({name:audio.file.name,url:rsp.url})
              }
              this.updateCustomBgm()
            },error=>{
              this.$toast.clear()
              this.$toast("上传失败，请稍后重试")
            })
          },error=>{
            this.$toast.clear()
            this.$toast("上传失败，请稍后重试")
          })
        },
        pasteDialogClosed(){
          this.pasteName = ''
          this.pasteUrl = ''
        },
        showPasteDialog(){
          this.isShowPasteDialog = true
        },
        confirmPaste(){
          if (!this.pasteName.trim()){
            this.$toast('请输入音乐名称')
            return
          }
          let url = this.pasteUrl.trim()
          if (!url){
            this.$toast('请输入音乐地址')
            return
          }
          if (!checkUrlHttpOrHttps(url)){
            this.$toast('请输入正确的音乐地址')
            return
          }

          if (this.selfUpload.length > 0){
            this.selfUpload[0] = {name:this.pasteName,url}
          }else{
            this.selfUpload.push({name:this.pasteName,url})
          }
          this.updateCustomBgm(()=>{
            this.isShowPasteDialog = false
          })
        },
        cancelPaste(){
          this.isShowPasteDialog = false
        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getSpaceDetail()
        }
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .bgm-container{
    height: 100%;
    background: @BG_WHITE;
    .icon-duigou1{
      color: @MAIN_THEME_COLOR;
    }
    .van-uploader{
      padding: 20px 0px 20px 15px;
    }
    .paste-btn{
      margin: 15px;
    }
    .popup-area{
      .popup-cell{
        margin: 5px 0px;
      }
      .bottom-button {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 20px 0px 10px 0px;
        .van-button{
          width: 30%;
          height: 30px;
          line-height: 28px;
          margin:0px 10px;
          &.confirm{
            color: white;
            background-color: @MAIN_THEME_COLOR;
          }
        }
      }
    }

  }

</style>

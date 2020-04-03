<template>
  <div class="bgm-container">
    <van-cell-group title="预置">
      <van-cell v-for="item in presetBgm" :key="item.key" :title="item.name" :label="item.author" size="large" @click.stop="selectPresetBgm(item)">
        <div v-if="isPresetSelected(item)">
          <i class="iconfont icon-duigou1"></i>
        </div>
      </van-cell>
    </van-cell-group>
    <van-cell-group title="自定义(最多支持 10 首)">
      <template v-if="selfUpload && selfUpload.length > 0">
        <van-cell v-for="(bgm,index) in selfUpload" :key="index" :title="bgm.name" size="large" @click.stop="selectCustomBgm(bgm,index)" value-class="custom-bgm-cell">
          <div class="operate">
            <div v-if="isCustomSelected(bgm,index)">
              <i class="iconfont icon-duigou1"></i>
            </div>
            <div class="edit" @click.stop="editCustomBgm(bgm,index)">
              <i class="iconfont icon-bianji"></i>
            </div>
          </div>

        </van-cell>
      </template>

      <template v-if="isShowUploader()">
        <van-uploader accept="audio/mpeg" :after-read="afterSelectAudio">
          <van-button icon="music-o" size="small">本地上传</van-button>
        </van-uploader>
      </template>
      <van-button  class="paste-btn" icon="edit" size="small" @click="showPasteDialog">手动添加</van-button>
      <div class="tip" v-if="!isShowUploader()">
        <i class="iconfont icon-tishi1"></i>由于iOS系统限制，您可以直接手动编辑输入音乐链接或者使用Android手机、网页端进行音乐文件上传
      </div>
    </van-cell-group>
    <van-popup class="popup-area" v-model="isShowPasteDialog"  close-on-popstate @closed="pasteDialogClosed">
      <van-field class="popup-cell" v-model="pasteName" placeholder="请输入音乐名称" input-align="left"></van-field>
      <van-field class="popup-cell" v-model="pasteUrl" placeholder="请输入音乐地址" input-align="left"></van-field>
      <div class="bottom-button">
        <van-button @click.stop="cancelPaste">取消</van-button>
        <van-button class="confirm" type="default" @click.stop="confirmPaste">确定</van-button>
      </div>
    </van-popup>
    <van-action-sheet
      v-model="showAction"
      :actions="actions"
      close-on-popstate
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>
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
          pasteUrl:'',
          editCustomIndex:-1,
          bgmMaxCount:10,
          showAction:false,
          actions:[],
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
        isPresetSelected(item){
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
        isCustomSelected(bgm,index){
          return this.currentBgmKey === 'custom' && this.customIndex === index
        },
        selectCustomBgm(bgm,index){
          this.customIndex = index
          this.updateCustomBgm(()=>{
            this.playBgm(0,{bgmKey:'custom',index:this.customIndex})
          })
        },
        editCustomBgm(bgm,index){
          this.actions = [{
            id:'edit',
            name:'编辑',
          },{
            id:'delete',
            name:'删除',
          }]
          this.showAction = true
          this.editCustomIndex = index
        },
        updateCustomBgm(cb){
          $API.space.updateSpaceBgm({
            sid:this.spaceId,
            key:'custom',
            usedIndex:this.customIndex,
            selfUpload:this.selfUpload
          },rsp=>{
            cb && cb()
            eventHub.$emit(constant.EVENT_UPDATE_BGM_SUCCESS,{bgmKey:'custom',selfUpload:this.selfUpload,spaceId:this.spaceId,usedIndex:this.customIndex})
          })
        },
        afterSelectAudio(audio){
          if (audio.file.size > 30 * 1024 * 1024){
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
            name: audio.file.name.replace(/[\s\[\]]/g,''),
            expand: audio.file.name.replace(/.+\./, ''),
            size: audio.file.size,
          }, resp => {
            $API.space.filesQiniuUpload({
              data:audio.content,
              token:resp.uptoken,
              key:resp.key
            },rsp=>{
              this.$toast.clear()
              this.selfUpload.unshift({name:audio.file.name,url:rsp.url})
              this.customIndex = 0
              let len = this.selfUpload.length
              if (len > this.bgmMaxCount){
                this.selfUpload.splice(this.bgmMaxCount,len - this.bgmMaxCount)
              }
              this.updateCustomBgm(()=>{
                this.playBgm(0,{bgmKey:'custom',index:this.customIndex})
              })
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

          if (this.editCustomIndex >= 0){
            this.customIndex = this.editCustomIndex
            this.selfUpload[this.editCustomIndex] = {name:this.pasteName,url}
          }else{
            this.selfUpload.push({name:this.pasteName,url})
          }
          this.updateCustomBgm(()=>{
            this.editCustomIndex = -1
            this.isShowPasteDialog = false
            this.playBgm(0,{bgmKey:'custom',index:this.customIndex})
          })
        },
        cancelPaste(){
          this.isShowPasteDialog = false
        },
        onActionSelect(item){
          this.showAction = false
          this.actions = []
          let menu = item.id
          if (menu === 'edit'){
            let custom = this.selfUpload[this.editCustomIndex]
            if (custom.name){
              this.pasteName = custom.name
            }
            if (custom.url){
              this.pasteUrl = custom.url
            }

            this.showPasteDialog()
          }else if(menu === 'delete'){
            this.$dialog.confirm({
              message: '确认删除该自定义音乐吗？'
            }).then(() => {
              this.selfUpload.splice(this.editCustomIndex,1)
              if (this.editCustomIndex > 0){
                this.customIndex = this.editCustomIndex - 1
              }else {
                this.customIndex = 0
              }
              this.updateCustomBgm(()=>{
                this.editCustomIndex = -1
                this.selectPresetBgm(this.presetBgm[0])
              })
            })
          }
        },
        onActionClose(){
          this.showAction = false
          this.actions = []
        },
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
    overflow-y: auto;
    .custom-bgm-cell{
      flex-grow: 0;
      flex-basis: 60px;
      .operate{
        display: flex;
        align-items: center;
        justify-content: flex-end;
        .edit{
          margin-left: auto;
        }
      }
    }

    .icon-duigou1{
      color: @MAIN_THEME_COLOR;
    }
    .van-uploader{
      padding: 20px 0px 20px 15px;
    }
    .paste-btn{
      margin: 15px;
    }
    .tip{
      padding: 16px;
      font-size: 12px;
      color: @FONT_THIRD_COLOR;
      .iconfont{
        font-size: 14px;
        color: @FONT_THIRD_COLOR;
        margin-right: 4px;
      }
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

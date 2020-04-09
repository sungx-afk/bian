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
        <div class="uploader" v-if="showBigUploader()">
          <van-button icon="music-o" size="small" id="uploadFiles">本地上传</van-button>
        </div>

      </template>
      <van-button  class="paste-btn" icon="edit" size="small" @click="showPasteDialog" v-if="false">手动添加</van-button>
      <div class="tip" v-if="!isShowUploader()">
        <i class="iconfont icon-tishi1"></i>由于iOS系统限制，请您使用Android手机、网页端进行音乐文件上传
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
        showBigUploader(){
          return this.spaceId == '192195'
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
        uploader() {
          var that = this
          var uploadUrl = 'https://upload.qiniup.com'
          var indexCount = 0;
          var resume = false;
          var chunk_size;
          var blockSize;
          var putExtra = {
            fname: "",
            params: {},
            mimeType: null
          }
          var toast = that.$toast
          var chunkTokens = {}
          var uploader = new plupload.Uploader({
            runtimes: "html5,flash,html4",
            url: uploadUrl,
            browse_button: "uploadFiles", // 触发文件选择对话框的按钮，为那个元素id
            flash_swf_url: "/bian-mobile/static/plupload/js/Moxie.swf", // swf文件，当需要使用swf方式进行上传时需要配置该参数
            chunk_size: 4 * 1024 * 1024,
            max_retries: 3,
            multipart_params:{
            },
            init: {
              PostInit: () => {
                console.log("upload init");
              },
              FilesAdded: (up, files) => {
                up.stop()
                let promiseArray = []
                files.forEach(item => {
                  if (!!item.type) {
                    promiseArray.push(new Promise((resolve, reject) => {
                      $API.space.filesQiniuUploadTicket({
                        reqType: 'general_file',
                        name: item.name,
                        expand: item.name.replace(/.+\./, ''),
                        size: item.size
                      }, resp => {
                        item.uptoken = resp.uptoken;
                        resolve(resp.uptoken)
                      }, error => {
                        resolve();
                      })
                    }))
                  }
                });
                Promise.all(promiseArray).then(respArray => {
                  if(respArray.some(item => !!item)){
                    toast.loading({
                      duration: 0,       // 持续展示 toast
                      forbidClick: true, // 禁用背景点击
                      loadingType: 'spinner',
                      message: '上传中...'
                    })
                    up.start();
                  }
                })
              },
              UploadProgress: (up, file) => {
                console.log("UploadProgress:",file.percent)
                // that.updatePercent(file.id, file.percent);
              },
              FileUploaded: (up, file, info) => {
                console.log(info);
              },
              UploadComplete: (up, files) => {
                // Called when all files are either uploaded or failed
                console.log("[完成]");
              },
              Error: function(up, err) {
                console.log(err.response);
              }
            }
          });
          uploader.init();
          uploader.bind('Error',function(){

          })

          uploader.bind("BeforeUpload", (up, file)=> {
            let key = file.name;
            putExtra.params["x:name"] = key.split(".")[0];
            chunk_size = up.getOption("chunk_size");
            var directUpload = ()=> {
              resume = false;
              let multipart_params_obj = {};
              multipart_params_obj.token = file.uptoken;
              // filterParams 返回符合自定义变量格式的数组，每个值为也为一个数组，包含变量名及变量值
              let customVarList = qiniu.filterParams(putExtra.params);
              for (let i = 0; i < customVarList.length; i++) {
                let k = customVarList[i];
                multipart_params_obj[k[0]] = k[1];
              }
              multipart_params_obj.key = key;
              up.setOption({
                url: uploadUrl,
                multipart: true,
                required_features:'',
                multipart_params: multipart_params_obj
              });
            }

            var resumeUpload = ()=> {
              let token = file.uptoken
              chunkTokens[file.id] = token
              blockSize = chunk_size;
              initFileInfo(file);
              if(blockSize === 0){
                mkFileRequest(file)
                up.stop()
                return
              }
              resume = true;
              up.setOption({
                url: uploadUrl + "/mkblk/" + blockSize,
                multipart: false,
                required_features: "chunks",
                headers: {
                  Authorization: "UpToken " + token
                },
                multipart_params: {}
              });
            };

            // 判断是否采取分片上传
            if ((up.runtime === "html5" || up.runtime === "flash") && chunk_size) {
              if (file.size < chunk_size) {
                directUpload();
              } else {
                resumeUpload();
              }
            } else {
              console.log(
                "directUpload because file.size < chunk_size || is_android_weixin_or_qq()"
              );
              directUpload();
            }
          });

          uploader.bind("ChunkUploaded", (up, file, info)=> {
            let token = chunkTokens[file.id]
            var res = JSON.parse(info.response);
            var leftSize = info.total - info.offset;
            let chunkSize = uploader.getOption && uploader.getOption("chunk_size");
            if (leftSize < chunkSize) {
              up.setOption({
                url: uploadUrl + "/mkblk/" + leftSize
              });
            }
            up.setOption({
              headers: {
                Authorization: "UpToken " + token
              }
            });
            // 更新本地存储状态
            let localFileInfo = JSON.parse(localStorage.getItem(file.name))|| [];
            localFileInfo[indexCount] = {
              ctx: res.ctx,
              time: new Date().getTime(),
              offset: info.offset,
              percent: file.percent
            };
            indexCount++;
            localStorage.setItem(file.name, JSON.stringify(localFileInfo));
          });

          uploader.bind("FileUploaded", (up, file, info)=> {
            if (resume) {
              mkFileRequest(file)
            } else {
              const response = JSON.parse(info.response);
              uploadFinish(file,response)
            }
          });

          function uploadFinish(file,info) {
            const f = JSON.parse(info.file);
            that.selfUpload.unshift({name:f.name,url:f.url})
            that.customIndex = 0
            let len = that.selfUpload.length
            if (len > that.bgmMaxCount){
              that.selfUpload.splice(that.bgmMaxCount,len - that.bgmMaxCount)
            }
            that.updateCustomBgm(()=>{
              that.playBgm(0,{bgmKey:'custom',index:that.customIndex})
            })

            toast.clear()
            localStorage.removeItem(file.name)
          }
          function initFileInfo(file) {
            let localFileInfo = JSON.parse(localStorage.getItem(file.name))|| [];
            indexCount = 0;
            let length = localFileInfo.length
            if (length) {
              let clearStatus = false
              for (let i = 0; i < localFileInfo.length; i++) {
                indexCount++
                if (isExpired(localFileInfo[i].time)) {
                  clearStatus = true
                  localStorage.removeItem(file.name);
                  break;
                }
              }
              if(clearStatus){
                indexCount = 0;
                return
              }
              file.loaded = localFileInfo[length - 1].offset;
              let leftSize = file.size - file.loaded;
              if(leftSize < chunk_size){
                blockSize = leftSize
              }
              file.percent = localFileInfo[length - 1].percent;
            }else{
              indexCount = 0
            }
          }

          function updateChunkProgress(file, chunk_size, count) {
            var index = Math.ceil(file.loaded / chunk_size);
            if (index == count) {
              chunk_size = file.size - chunk_size * (index - 1);
            }
          }

          function mkFileRequest(file){
            // 调用sdk的url构建函数
            let requestUrl = qiniu.createMkFileUrl(
              uploadUrl,
              file.size,
              file.name,
              putExtra
            );

            let ctx = []
            let local = JSON.parse(localStorage.getItem(file.name))
            for(let i =0;i<local.length;i++){
              ctx.push(local[i].ctx)
            }
            // 设置上传的header信息
            let token = chunkTokens[file.id]
            let headers = qiniu.getHeadersForMkFile(token)
            $API.space.mkFileRequest({
                url:requestUrl,
                headers:headers,
                data:ctx.join(",")
              }, rsp=>{
                delete chunkTokens[file.id]
                uploadFinish(file,rsp)
              },
              error=>{
                toast.clear()
                toast("上传失败，请稍后重试")
              })
          }

          function isExpired(time){
            let expireAt = time + 3600 * 24* 1000;
            return new Date().getTime() > expireAt || true;
          }
        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getSpaceDetail()
        }
      },
      mounted() {
        this.$nextTick(() => {
          setTimeout(() => {
            this.uploader();
          }, 500)
        });
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
    .uploader{
      padding: 20px;
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

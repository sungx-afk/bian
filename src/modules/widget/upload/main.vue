<template>
  <transition name="slide-fade" @after-leave="afterLeave">
    <div v-show="show" class="upload">
      <div class="header">共{{ list.length }}个文件</div>
      <div class="body">
        <ul class="file-list">
          <item v-for="(item, index) in list" :key="index" :item="item" :index="index" :hideBtn="hideBtn"
                :delete="deleteItem"></item>
        </ul>
      </div>
      <div v-if="!hideBtn" class="footer">
        <div class="upload_files" id="uploadFiles">
          上传附件
        </div>
        <div class="confirm" @click="close">确定</div>
      </div>
    </div>
  </transition>
</template>

<script>

  import * as api from './api.js';
  import Item from './Item';

  export default {
    components: {
      Item,
    },
    methods: {
      afterLeave() {
        this.$el &&
        this.$el.parentNode &&
        this.$el.parentNode.removeChild(this.$el);
        this.$destroy();
        this.closeEnd();
      },
      close() {
        const list = this.list.filter(item => !item.error && !!item.uuid).map(item => {
          return {
            name: item.name,
            size: item.size,
            uuid: item.uuid,
            url: item.url,
            expand: item.expand
          }
        });
        this.callback && this.callback(list);
        this.show = false;
      },
      updatePercent(id, percent) {
        console.log(id,percent)
        const index = this.list.findIndex(item => {
          return (id == item.id)
        })
        if (index >= 0) {
          setTimeout(() => {
            this.list[index].progress = percent;
          }, 500)
        }
      },
      updateUuidUrl(id, uuid, url) {
        const index = this.list.findIndex(item => {
          return (id == item.id)
        })
        if (index >= 0) {
          this.list[index].uuid = uuid
          this.list[index].url = url
          this.list[index].progress = 100;
        }
      },
      updateUuidExpand(id, uuid, expand) {
        const index = this.list.findIndex(item => {
          return (id == item.id)
        })
        if (index >= 0) {
          this.list[index].uuid = uuid
          this.list[index].expand = expand
        }
      },
      deleteItem(index) {
        this.list.splice(index, 1);
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
        var chunkTokens = {}
        var uploader = new plupload.Uploader({
          runtimes: "html5,flash,html4",
          url: uploadUrl,
          browse_button: "uploadFiles", // 触发文件选择对话框的按钮，为那个元素id
          flash_swf_url: "/static/plupload/js/Moxie.swf", // swf文件，当需要使用swf方式进行上传时需要配置该参数
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
                  this.list.push({
                    id: item.id,
                    name: item.name,
                    size: item.size,
                    progress: 0,
                    uuid: null,
                    url: null,
                    error: false,
                    expand: item.name.replace(/.+\./, '')
                  });
                  promiseArray.push(new Promise((resolve, reject) => {
                    api.filesQiniuUploadTicket({
                      reqType: this.reqType,
                      name: item.name,
                      expand: item.name.replace(/.+\./, ''),
                      size: item.size,
                      resId: this.resId,
                      folderId: this.folderId,
                      projectId: this.projectId,
                    }, resp => {
                      item.uptoken = resp.ticket;
                      resolve(resp.ticket)
                    }, resp => {
                      resolve();
                    })
                  }))
                }
              });
              Promise.all(promiseArray).then(respArray => {
                if(respArray.some(item => !!item)){
                  up.start();
                }
              })
            },
            UploadProgress: (up, file) => {
              console.log("UploadProgress:",file.percent)
              that.updatePercent(file.id, file.percent);
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
          that.updateUuidUrl(file.id, f.uuid, f.url);
          that.updateUuidExpand(file.id, f.uuid, f.expand);
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
          debugger
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
          api.mkFileRequest({
            url:requestUrl,
            headers:headers,
            data:ctx.join(",")},
            rsp=>{
              delete chunkTokens[file.id]
              uploadFinish(file,rsp)
            }
          )
        }

        function isExpired(time){
          let expireAt = time + 3600 * 24* 1000;
          return new Date().getTime() > expireAt;
        }
      }
    },
    data() {
      return {
        list: [],

        reqType: 'general_file',
        folderId: null,
        projectId: null,
        resId: null,

        callback: null,

        show: false,
        hideBtn: false,//是否显示上传附件按钮（可能是指显示下附件）
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.show = true;
        if (!this.hideBtn) {//不需要上传功能，只显示附件
          setTimeout(() => {
            this.uploader();
          }, 500)
        }
      });
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .upload {
    .modal;
    display: flex;
    flex-direction: column;
    .header {
      border-bottom: 1px solid @BORDER_COLOR;
      height: 30px;
      line-height: 30px;
      font-size: 14px;
      color: @FONT_COLOR_THIRD;
      padding: 0 20px;
    }
    .body {
      flex-grow: 1;
      overflow-y: auto;
      .file-list {
        background-color: #fff;
      }
    }
    .footer {
      border-top: 1px solid #dfe3e5;
      height: 47px;
      line-height: 47px;
      text-align: center;
      font-size: 16px;
      color: @FONT_COLOR_THIRD;
      background-color: #fff;
      display: flex;
      flex-direction: row;
      .upload_files, .confirm {
        flex: 1;
        box-sizing: border-box;
        &:active {
          background-color: #ececec;
        }
      }
      .confirm {
        border-left: 1px solid #dfe3e5;
        color: @COMMON_BLUE;
      }
    }
  }
</style>

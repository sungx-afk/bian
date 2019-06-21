<template>
  <div class="issue-create-container">
    <div class="content-area">
      <div class="input-area">
        <van-field
          v-model="content"
          type="textarea"
          placeholder="请输入您想说的"
          rows="5"
          :autosize="{ maxHeight: 200, minHeight: 100 }">
        </van-field>
      </div>
      <div class="media-area">
        <div class="photo-wrapper" v-for="photo in selectPhotos" @click.stop="previewImage">
          <img class="delete-img" src="~@/modules/images/delete_icon.png" @click.stop="deleteImage" />
          <img class="photo" :src="item.path" />
        </div>
        <div class="add-btn" id="uploadFiles">
          <img class="add-btn-img" src="~@/modules/images/add_gray.png" />
        </div>
      </div>
    </div>

    <div class="tip">尊重逝者，请谨慎留言。</div>
    <div class="bottom-button">
      <van-button type="default" @click="clickConfirm" size="large">确定</van-button>
    </div>
  </div>
</template>

<script>
    export default {
      name: "IssueCreate",
      data(){
        return{
          spaceId:'',
          type:'',//PRIVATE、SPACE、MESSAGE
          selectPhotos:[],
          content:'',
          issueType:'text',
          uploadedFiles: [],
        }
      },
      methods:{
        afterRead(photo){

        },
        clickConfirm(){
          if (this.content.length === 0 && this.selectPhotos.length === 0){
            this.$toast('请填写内容');
            return
          }
          this.postIssueHandler()
        },
        postIssueHandler() {
          //上传到七牛
          //发送结果到服务器
          //返回
          debugger
          let allFiles = [];
          if (this.selectPhotos.length > 0) {
            for (let item of this.selectPhotos) {
              let path = item.path;
              let photoItem = {};
              photoItem.expand = path.replace(/.+\./, '');
              photoItem.name = path.replace(/.+\//, '');
              photoItem.url = path;
              allFiles.push(photoItem);
            }
          }
          this.$toast.loading({
            duration: 0,       // 持续展示 toast
            forbidClick: true, // 禁用背景点击
            loadingType: 'spinner',
            message: '发布中'
          });
          this.batchUploadFile(allFiles)
        },
        batchUploadFile(files) {
          let promises = [];
          let batchFiles = files.splice(0, 9);
          for (let i = 0; i < batchFiles.length; i++) {
            promises.push(this.startUpload(batchFiles[i], i));
          }
          Promise.all(promises)
            .then(() => {
              if (files.length > 0) {
                this.batchUploadFile(files);
              } else {
                this.doPostIssue();
              }
            })
            .catch((error) => {
              console.log('error: ' + error);
            });
        },
        startUpload(file, index) {
          let that = this;
          let promise = new Promise((resolve, reject) => {
            util.uploadToQiniu({
              file,
              token:api.getToken(),
              success:rsp=>{
                resolve(rsp)
              },
              fail:error=>{
                reject(error)
              }
            })
          }).then(function(res) {
            that.uploadedFiles.push(res);
          });
          return promise;
        },
        doPostIssue() {

          let data = {}

          data.type = this.messageType
          data.content = this.content
          // if (this.messageType == 'PUBLIC'){
          //   data.status = 'WAIT'
          // }else{
          //   data.status = 'PASS'
          // }

          data.status = 'PASS'

          if (this.uploadedFiles.length > 0) {
            let urlList = [];
            for (let i = 0; i < this.uploadedFiles.length; i++) {
              let obj = {};
              obj.url = this.uploadedFiles[i].url;
              urlList.push(obj);
            }
            if (this.issueType === 'photo') {
              data.photos = urlList;
            }
          }

          let that = this

          $API.space.postIssue({
              sid: this.spaceId,
              data: data
            }, rsp=> {
              //告诉上个页面刷新
              // onfire.fire(constant.EVENT_POST_ISSUE_SUCCESS, { type: that.messageType });
              // wx.hideLoading();
              // wx.navigateBack({});
            }, error=> {
              this.$toast('发布失败，请稍后重试');
            });
        },
        uploader() {
          var that = this
          var uploadUrl = 'https://f-bian.yugusoft.com'
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
                        reqType: 'general_file',
                        name: item.name,
                        expand: item.name.replace(/.+\./, ''),
                        size: item.size,
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
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
          }
          if (query.type){
            this.type = query.type
          }
        }
        this.uploader();
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .issue-create-container {
    width: 100%;
    height: 100%;
    background-color: white;
    overflow: scroll;
    .content-area{
      border-bottom:1px solid @BORDER_COLOR_2;
      .input-area{
        .input {
          width: 90%;
          position: relative;
          font-size: 15px;
          margin: 15px 5% 10px 5%;
          min-height: 100px;
        }
      }
      .media-area {
        display: flex;
        padding: 10px 15px;
        flex-wrap: wrap;

        .photo-wrapper {
          display: inline-block;
          position: relative;
          border: 1px solid @BORDER_COLOR_1;
          width: 75px;
          height: 75px;
          margin: 2px;

          .photo {
            width: 100%;
            height: 100%;
          }

          .delete-img {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 15px;
            height: 15px;
          }
        }

        .add-btn {
          width: 75px;
          height: 75px;
          margin: 2px;
          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid @BORDER_COLOR_1;

          .add-btn-img {
            width: 40px;
            height: 40px;
          }
        }
      }
    }
    .tip{
      font-size: 13px;
      color: @MAIN_THEME_COLOR;
      padding:10px 20px 0px 20px;
    }
    .bottom-button {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      .van-button--large{
        width: 90%;
        color: white;
        height: 40px;
        line-height: 38px;
        background-color: @MAIN_THEME_COLOR;
      }

    }
  }

</style>

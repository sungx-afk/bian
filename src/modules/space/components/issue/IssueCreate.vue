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
        <van-uploader
          v-model="selectPhotos"
          :max-count="50"
          :after-read="afterRead"
          multiple>
        </van-uploader>
      </div>
    </div>

    <div class="tip">尊重逝者，请谨慎留言。</div>
    <div class="bottom-button">
      <van-button type="default" @click="clickConfirm" size="large">确定</van-button>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
    export default {
      name: "IssueCreate",
      data(){
        return{
          spaceId:'',
          type:'',//PRIVATE、SPACE、MESSAGE
          selectPhotos:[],
          content:'',
          uploadedFiles: [],
        }
      },
      methods:{
        afterRead(photo){
          //
        },
        clickConfirm(){
          if (this.content.length === 0 && this.selectPhotos.length === 0){
            this.$toast('请填写内容');
            return
          }
          this.postIssueHandler()
        },
        postIssueHandler() {
          this.$toast.loading({
            duration: 0,       // 持续展示 toast
            forbidClick: true, // 禁用背景点击
            loadingType: 'spinner',
            message: '发布中'
          })
          let files = this.selectPhotos.map(item=>{
            let file = {}

            file.content = item.content
            file.name = item.file.name
            file.size = item.file.size

            return file
          })
          this.batchUploadFile(files)
        },
        batchUploadFile(files) {
          let promises = [];
          let batchFiles = files.splice(0, 20);
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
            that.uploadToQiniu(file,(res)=>{
              if (res.result === 0){
                resolve(res.url)
              }else {
                reject(res.msg)
              }
            })
          }).then(function(res) {
            that.uploadedFiles.push(res);
          });
          return promise;
        },
        uploadToQiniu(file,cb){
          $API.space.filesQiniuUploadTicket({
            reqType: 'general_file',
            name: file.name,
            expand: file.name.replace(/.+\./, ''),
            size: file.size,
          }, resp => {
            $API.space.filesQiniuUpload({
              data:file.content,
              token:resp.uptoken
            },rsp=>{
              cb && cb({result:0,url:rsp.url})
            },error=>{
              cb && cb({result:1,msg:error.msg})
            })
          })
        },
        doPostIssue() {

          let data = {}

          data.type = this.type
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
              obj.url = this.uploadedFiles[i];
              urlList.push(obj);
            }
            data.photos = urlList;
          }

          let that = this

          $API.space.postIssue({
            sid: that.spaceId,
            data: data
          }, rsp => {
            //告诉上个页面刷新
            eventHub.$emit(constant.EVENT_POST_ISSUE_SUCCESS, {type: that.type})
            that.$toast.clear()
            that.$router.go(-1)
          }, error => {
            this.$toast('发布失败，请稍后重试');
          });
        },
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

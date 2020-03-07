<template>
  <div class="report-container">
    <div class="category-wrapper">
      <div class="title">
        请选择举报原因
      </div>
      <div class="list-wrapper">
        <van-list
          :finished="true"
          finished-text="">
          <van-cell
            v-for="item in reasonList"
            :key="item.id">
            <div class="category">
              <div :class="{checked:item.checked}">{{item.name}}</div>
              <van-checkbox v-model="item.checked" :name="item.id" shape="square" checked-color="#825621" @change="checkboxChanged($event,item)"></van-checkbox>
            </div>
          </van-cell>
        </van-list>
      </div>
    </div>
    <div class="report-submit-wrapper">
      <div class="title">
        请上传举报凭证（可选）
      </div>
      <div class="report-photo">
        <van-uploader
          v-model="selectPhotos"
          :max-count="3"
          :after-read="afterSelectPhoto"
          multiple>
        </van-uploader>
        <div class="photo-tip">最多可上传 3 张截图</div>
      </div>
      <div class="report-description">
        <van-field
          v-model="desc"
          rows="3"
          autosize
          :border="true"
          type="textarea"
          maxlength="200"
          placeholder="补充说明（可选）"
          show-word-limit/>
      </div>
      <div class="footer">
        <van-button class="submit" size="large" @click.stop="submit" :disabled="disabledBtn">提交</van-button>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
      name: "Report",
      data(){
        return{
          subjectType:'',
          subjectId:'',
          subjectContent:'', //帖子时保存馆的id，comment时保存评论内容，space为空
          reasonList:[{
            id:'violation',
            name:'涉嫌违法违规',
            checked:false
          },{
            id:'porn',
            name:'色情/暴力/低俗',
            checked:false
          },{
            id:'defraud',
            name:'诈骗和虚假信息',
            checked:false
          },{
            id:'illegal',
            name:'非法言论',
            checked:false
          },{
            id:'private',
            name:'泄露隐私',
            checked:false
          },{
            id:'ads',
            name:'广告行为',
            checked:false
          },{
            id:'other',
            name:'其他',
            checked:false
          }],
          desc:'',
          selectPhotos:[],
          uploadedFiles:[]
        }
      },
      computed:{
        disabledBtn(){
          let result = true

          result = !this.reasonList.some(item=>item.checked)

          return result
        }
      },
      methods:{
        checkboxChanged(event,item){

        },
        afterSelectPhoto(files){

        },
        submit(){
          this.$toast.loading({
            duration: 0,       // 持续展示 toast
            forbidClick: true, // 禁用背景点击
            loadingType: 'spinner',
            message: '提交中...'
          })
          if (this.selectPhotos && this.selectPhotos.length > 0){
            let files = this.selectPhotos.map(item=>{
              let file = {}

              file.content = item.content
              file.name = item.file.name
              file.size = item.file.size

              return file
            })
            this.batchUploadFile(files)
          }else{
            this.doReport()
          }
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
                this.doReport();
              }
            })
            .catch((error) => {
              this.$toast.clear()
              this.$toast("上传出错，请稍后重试")
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
              token:resp.uptoken,
              key:resp.key
            },rsp=>{
              cb && cb({result:0,url:rsp.url})
            },error=>{
              cb && cb({result:1,msg:error.msg})
            })
          },error=>{
            cb && cb({result:1,msg:error.msg})
          })
        },
        doReport(){
          let params = {
            subjectType:this.subjectType,
            subjectId:this.subjectId,
          }
          if (this.uploadedFiles && this.uploadedFiles.length > 0){
            params.urls = this.uploadedFiles
          }
          if (this.desc.trim()){
            params.content = this.desc
          }
          if (this.subjectContent){
            params.subjectContent = this.subjectContent
          }
          params.reason = this.reasonList.filter(item=>item.checked).map(item=>item.id)

          $API.space.report(params,rsp=>{
            this.$toast.clear()
            this.$toast('操作成功')
            this.$router.back()
          },error=>{
            this.$toast.clear()
            this.$toast('操作失败，请稍后重试')
          })
        }
      },
      created() {
        let query = this.$route.query
        if (query){
          if (query.type){
            this.subjectType = query.type
          }
          if (query.subject_id){
            this.subjectId = query.subject_id
          }
          if (this.subjectType === 'post'){
            this.subjectContent = query.subject_content
          }else if(this.subjectType === 'comment'){
            let content = localStorage.getItem('report_comment_content')
            localStorage.removeItem('report_comment_content')
            this.subjectContent = content
          }
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .report-container{
    overflow-y: auto;
    height: 100%;
    .title{
      height: 24px;
      line-height: 24px;
      font-size: 16px;
      color: @FONT_THIRD_COLOR;
      text-align: left;
      padding: 16px 16px;
      background: @BG_GRAY;
    }
    .category-wrapper{
      display: flex;
      flex-direction: column;

      .list-wrapper{
        border-top:1px solid #eeeeee;
        .category{
          font-size: 16px;
          display: flex;
          align-items: center;
          .checked{
            color: @MAIN_THEME_COLOR;
          }
          .van-checkbox{
            margin-left: auto;
          }
        }
      }
    }
    .report-submit-wrapper{
      .report-photo{
        margin: 12px;
        .photo-tip{
          font-size: 12px;
          color: @FONT_FOUR_COLOR;
        }
      }
      .report-description{
        border: 1px solid @BORDER_COLOR_1;
        margin: 12px;
        box-sizing: border-box;
      }
      .footer{
        display: flex;
        justify-content: center;
        margin-top: 20px;
        margin-bottom: 60px;
        .van-button--large{
          width: 90%;
          color: white;
          height: 40px;
          line-height: 38px;
          background-color: @MAIN_THEME_COLOR;
        }
      }
    }

  }

</style>

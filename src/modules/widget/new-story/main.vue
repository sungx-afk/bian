<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="new-story-container" v-show="show">
      <div class="new-story-box">
        <div class="input-area">
          <van-field class="name-input"
            ref="name_input"
            v-model="name"
            size="large"
            required
            placeholder="请输入文章标题"
            maxlength="50">
          </van-field>
          <van-field
            v-model="content"
            required
            type="textarea"
            placeholder="请输入文章内容"
            rows="10"
            maxlength="5000"
            :autosize="{ maxHeight: 800, minHeight: 240 }">
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
      <div class="footer">
        <van-button type="default" @click="confirm" size="large">确定</van-button>
      </div>
    </div>
  </transition>
</template>

<script>

  import * as api from './api'

  export default {
    data(){
      return {
        show:false,
        callback:null,
        spaceId:'',
        type:'LIFE_EXPERIENCE',
        name:'',
        content:'',
        selectPhotos:[],
        uploadedFiles: [],
      }
    },
    methods: {
      afterLeave(){
        this.$el &&
        this.$el.parentNode &&
        this.$el.parentNode.removeChild(this.$el);
        this.$destroy();
        this.closeEnd();
      },
      close(){
        this.show = false;
      },
      afterRead(photo){
        //做特殊处理，微信图片没有后缀，也拿不到type，data格式中也没有类型，默认jpeg
        if (!photo.type && photo.content && photo.content.indexOf('data:;base64,') >= 0){
          photo.content = photo.content.replace(/^data:;base64,/, "data:image/jpeg;base64,");
        }
      },
      confirm(){
        if (this.content.length === 0 && this.selectPhotos.length === 0){
          this.$toast('请填写文章内容');
          return
        }
        if (this.name.length === 0){
          this.name = this.content.slice(0,10)
        }
        this.postContentHandler()
      },
      postContentHandler() {
        this.$toast.loading({
          duration: 0,       // 持续展示 toast
          forbidClick: true, // 禁用背景点击
          loadingType: 'spinner',
          message: '发布中...'
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
              this.doPostStory();
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
        api.filesQiniuUploadTicket({
          reqType: 'general_file',
          name: file.name,
          expand: file.name.replace(/.+\./, ''),
          size: file.size,
        }, resp => {
          api.filesQiniuUpload({
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
      doPostStory(){
        let that = this
        let data = {}

        data.type = this.type
        data.name = this.name
        data.content = this.content

        if (this.uploadedFiles.length > 0) {
          let urlList = [];
          for (let i = 0; i < this.uploadedFiles.length; i++) {
            let obj = {};
            obj.url = this.uploadedFiles[i];
            urlList.push(obj);
          }
          data.photos = urlList;
        }

        api.postStory({
          sid: this.spaceId,
          data: data
        }, rsp => {
          that.callback && that.callback()
          that.$toast.clear()
          that.close()
        }, error => {
          this.$toast('发布失败，请稍后重试');
        });
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.show = true;
        setTimeout(() => {
          this.$refs.name_input && this.$refs.name_input.focus()
        }, 200);
      });
    },
    created(){

    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  .new-story-container{
    width: 100%;
    height: 100%;
    overflow-y: auto;
    .modal();
    background-color: white;
    .new-story-box{
      border-bottom:1px solid @BORDER_COLOR_2;
      .input-area{
        .name-input{
          /deep/input{
            font-size: 16px;
            font-weight: bold;
          }
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
    .footer{
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

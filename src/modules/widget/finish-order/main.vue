<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="finish-order-box" v-show="show">
      <div class="item-box">
        <div class="list-wrapper">
          <van-field v-model="deliverSummary" label="交付说明:" placeholder="请填写交付说明" type="textarea" input-align="right"></van-field>
          <van-cell title="图片" :border="false"></van-cell>
          <van-cell>
            <div class="avatar-wrapper">
              <div class="avatar-preview" v-for="(avatar,index) in deliverImages" :key="index">
                <van-uploader :after-read="afterSelectPhoto" :name="index">
                  <img class="avatar"  :src="avatar.url" v-if="avatar.url"/>
                </van-uploader>
              </div>
            </div>
          </van-cell>

        </div>
        <div class="bottom-button">
          <van-button type="default" @click.tap="cancel">取消</van-button>
          <van-button type="default" @click.tap="confirm">确定</van-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {timesToDate,dateToTimes,gUuid} from '@/config/utils'
  export default {
    data(){
      return {
        show:false,
        callback:null,
        deliverSummary:"",
        deliverImages:[{url:''}],
        avatarType:0
      }
    },
    computed:{

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
      cancel(){
        this.close()
      },
      confirm(){
        this.callback && this.callback(this.select)
        this.close()
      },
      afterSelectPhoto(photo,detail){
        this.avatarUploaderIndex = detail.name
        let data = {}
        data.identifier = this.deliverImages[this.avatarUploaderIndex].identifier = gUuid()
        data.content = photo.content
        data.name = photo.file.name
        data.size = photo.file.size
        data.type = photo.file.type
        data.lastModified = photo.file.lastModified
        this.$store.dispatch('spaceStore/setCropImageData',data)
        this.$nextTick(()=>{
          Link(`/cropper?avatar_type=${this.avatarType}`)
        })
      },
      updateAvatarData(result){
        let that = this
        let info = result.info
        let index = that.avatarUploaderIndex
        if (info.identifier !== this.deliverImages[index].identifier){
          return
        }

        let cropperData = result.cropperData

        that.deliverImages[index] = result.cropperData
        that.loading = true
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
            that.deliverImages.splice(index,1,{url:rsp.url})
            that.loading = false
          },error=>{
            this.$toast("上传失败，请稍后重试")
            that.loading = false
          })
        },error=>{
          this.$toast("上传失败，请稍后重试")
          that.loading = false
        })
      },
    },
    mounted() {
      this.$nextTick(() => {
        this.show = true;
      });
    },
    created(){
    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  .finish-order-box{
    overflow-y: auto;
    .modal();
    .item-box{
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-y: hidden;
      .list-wrapper{
        flex-grow:1;
        height:0;
        overflow: auto;

      }
       .bottom-button {
        display: flex;
        justify-content: center;
        flex-shrink: 0;
        padding:10px 0;
        .van-button{
          width: 40%;
          color: white;
          height: 40px;
          line-height: 38px;
          background-color: @MAIN_THEME_COLOR;
          &:first-child{
            color:#666666;
            background-color:white;
            margin-right: 16px;
          }
        }
      }
    }
  }
</style>

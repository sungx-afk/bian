<template>
  <div class="image-cropper-container">
    <div class="operate">
      <span @click.stop="cancel" class="btn">取消</span>
      <van-uploader :after-read="select">
        <span>重新选择</span>
      </van-uploader>
      <span @click.stop="confirm" class="btn">确定</span>
    </div>
    <template v-if="info">
      <vue-cropper
        ref="cropper"
        :img="info.content"
        autoCrop
        autoCropWidth="200"
        autoCropHeight="200"
        fixed
      ></vue-cropper>
    </template>

  </div>
</template>

<script>
  import constant from '@/config/constant'

  import { VueCropper }  from 'vue-cropper'

  export default {
    name: "ImageCropper",
    components:{
      VueCropper,
    },
    data(){
      return{
        info:null,
      }
    },
    methods:{
      initImgData(){
        let value = localStorage.getItem(constant.KEY_CROPPER_IMAGE_DATA)
        if (value){
          this.info = JSON.parse(value)
        }
        localStorage.removeItem(constant.KEY_CROPPER_IMAGE_DATA)
      },
      cancel(){
        this.$router.go(-1)
      },
      select(photo){
        let info = {}
        info.content = photo.content
        info.name = photo.file.name
        info.size = photo.file.size
        info.type = photo.file.type
        info.lastModified = photo.file.lastModified

        this.info = info
      },
      confirm(){
        this.$refs.cropper.getCropData((data) => {
          eventHub.$emit(constant.EVENT_IMAGE_CROP_COMPLETE,{cropperData:data,info:this.info})
          this.$router.go(-1)
        })
      }
    },
    created() {
      this.initImgData()
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .image-cropper-container{
    height: 100%;
    position: relative;
    .operate{
      position: fixed;
      top: 0;
      right: 10px;
      padding: 10px 0px;
      z-index: 1;
      color: white;
      .btn{
        margin: 0 5px;
      }
    }
  }

</style>

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
        :autoCrop="option.autoCrop"
        :fixed="option.fixed"
        :fixedNumber="option.fixedNumber"
        :centerBox="option.centerBox"
        :mode="option.mode"
      ></vue-cropper>
    </template>

  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {mapGetters} from 'vuex'
  import { VueCropper }  from 'vue-cropper'

  export default {
    name: "ImageCropper",
    components:{
      VueCropper,
    },
    data(){
      return{
        info:null,
        option:null
      }
    },
    computed:{
      ...mapGetters({
        cropData: 'spaceStore/cropData',
      }),
    },
    methods:{
      initOptions(type){
        this.option = {
          mode:'cover',
          autoCrop: true,
          centerBox: true,
          fixed: true,
        }
        if (type == 1){
          this.option.fixedNumber = [244, 157]
        }else {
          this.option.fixedNumber = [122, 157]
        }
      },
      initImgData(){
        this.info = this.cropData
        //做特殊处理，微信图片没有后缀，也拿不到type，data格式中也没有类型，默认jpeg
        if (!this.info.type && this.info.content.indexOf('data:;base64,') >= 0){
          this.info.content = this.info.content.replace(/^data:;base64,/, "data:image/jpeg;base64,");
        }
      },
      goBack(){
        this.$store.dispatch('spaceStore/resetCropImageData')
        this.$router.go(-1)
      },
      cancel(){
        eventHub.$emit(constant.EVENT_IMAGE_CROP_CANCEL)
        this.goBack()
      },
      select(photo){
        let info = {}
        info.identifier = this.info.identifier
        info.content = photo.content
        info.name = photo.file.name
        info.size = photo.file.size
        info.type = photo.file.type
        info.lastModified = photo.file.lastModified

        //做特殊处理，微信图片没有后缀，也拿不到type，data格式中也没有类型，默认jpeg
        if (!info.type && info.content.indexOf('data:;base64,') >= 0){
          info.content = info.content.replace(/^data:;base64,/, "data:image/jpeg;base64,");
        }

        this.info = info
      },
      confirm(){
        this.$refs.cropper.getCropData((data) => {
          eventHub.$emit(constant.EVENT_IMAGE_CROP_COMPLETE,{cropperData:data,info:this.info})
          this.goBack()
        })
      }
    },
    created() {
      this.initOptions(this.$route.query.avatar_type)
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

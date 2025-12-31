<template>
  <div class="new-product-container">
    <div class="back-home">
      <div class="left-btn" @click="goHome">
        <span>⬅</span>
      </div>
    </div>
    <div class="info">
      <div class="info-container">
        <van-field v-model="product.name" label="商品名称:" placeholder="请填写商品名称" maxlength="20" input-align="right"></van-field>
        <van-field v-model="product.price" label="商品价格:" placeholder="请填写商品价格" type="number" input-align="right"></van-field>
        <van-cell title="图片" :border="false"></van-cell>
        <van-cell>
          <div class="avatar-wrapper">
            <div class="avatar-preview" v-for="(avatar,index) in product.images" :key="index">
              <van-uploader :after-read="afterSelectPhoto" :name="index">
                <img class="avatar"  :src="avatar.url" v-if="avatar.url"/>
              </van-uploader>
            </div>
          </div>
        </van-cell>
      </div>

    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="confirm">{{product.id?'修改':'创建'}}</van-button>
    </div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  import constant from '@/config/constant'
  import qs from 'qs'

  export default{
    data(){
      return {
        product:{
          id:"",
          name:"",
          price:0,
          images:[{url:''}],
        },
        avatarType:0
      }
    },
    components: {
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
      showBack(){
        let result = false;
        if(this.$route && this.$route.query.opt_from && this.$route.query.opt_from == 'notice'){
          result = true;
        }
        return result;
      }
    },
    methods:{
      afterSelectPhoto(photo,detail){
        this.avatarUploaderIndex = detail.name
        let data = {}
        data.identifier = this.product.images[this.avatarUploaderIndex].identifier = gUuid()
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
        if (info.identifier !== this.product.images[index].identifier){
          return
        }

        let cropperData = result.cropperData

        that.product.images[index] = result.cropperData
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
            that.product.images.splice(index,1,{url:rsp.url})
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
      confirm(){
        if (!this.product.name) {
          this.$toast('请填写商品名称');
          return;
        }

        if(this.product.id){
          $API.mortuary.modifyProduct(this.product, rsp => {
            this.$toast({
              message:'修改成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.$router.go(-1)
              }
            })
          }, error => {
            this.$toast('修改失败，请稍后重试')
          })
        }else{
          let params = JSON.parse(JSON.stringify(this.product))
          delete params.id;
          $API.mortuary.createProduct(params, rsp => {
            this.$toast({
              message:'创建成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.$router.go(-1)
              }
            })
          }, error => {
            this.$toast('创建失败，请稍后重试')
          })
        }


      },
      getProductDetail(id){
        $API.mortuary.getProductDetail({id}, rsp => {
          if(rsp.images && rsp.images.length > 0){
            let t_images = [];
            rsp.images.forEach(a => {
              t_images.push(JSON.parse(a))
            })
            rsp.images = t_images;
          }
          this.product = rsp;
        })
      },
      goHome(){
        if(this.showBack){
          Link('/list')
        }else{
          this.$router.go(-1)
        }
      }
    },
    created() {
      console.log(this.$route)
      if(this.$route.query.id){
        this.getProductDetail(this.$route.query.id);
      }
      eventHub.$on(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    },
    beforeDestroy() {
      eventHub.$off(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .new-product-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    padding-bottom: 32px;
    display: flex;
    flex-direction: column;
    background-color: #f6f6f6;
    .back-home{
      font-size: 16px;
      padding:12px 16px;
      background-color: #fff;
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .left-btn,.right-btn{
        display: flex;
        align-items: center;
      }
      .right-btn{
        font-size: 14px;
        color:#999;
      }
    }
    /deep/ .van-cell{
      font-size:16px;
    }
    .info{
      flex-grow:1;
      height:0;
      overflow:auto;
      padding:16px;
      box-sizing: border-box;
      .info-container{
        background-color: #fff;
        border-radius: 16px;
        overflow: hidden;
      }
    }
    .avatar-wrapper{
      display: flex;
      align-items: center;
      .avatar-preview{
        margin-right: 8px;
        .avatar{
          width: 62px;
          height: 80px;
          border-radius: 8px;
          &.avatar-type_1{
            width: 124px;
            height: 80px;
          }
        }
      }
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
        border-radius: 20px;
      }
    }

  }

</style>

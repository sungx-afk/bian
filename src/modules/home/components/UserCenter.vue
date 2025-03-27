<template>
  <div class="user-center-container" v-if="user">
    <div class="user-center-wrapper">
      <van-cell class="user-cell">
        <van-uploader :after-read="afterSelectPhoto">
          <div class="avatar-box">
            <img class="avatar" :src="avatarUrl">
          </div>
        </van-uploader>
        <div class="name-wrapper">
          <template v-if="isModifyName">
            <van-field class="name-input"
              ref="name_input"
              v-model="name"
              placeholder="请输入昵称"
              maxlength="10"
              @blur="nameChanged">
            </van-field>
          </template>
          <template v-else>
            <span class="name">{{ user.name }}</span>
            <i class="iconfont icon-bianji" @click="goModifyName"></i>
          </template>
        </div>
      </van-cell>
      <van-cell class="account-cell">
        <span>账号ID：</span><span>{{user.id}}</span>
      </van-cell>
      <van-cell class="charge-cell" v-if="supportPay">
        <span>账号余额：</span><span class="charge-remain">{{user.point }}</span><span>&nbsp;云币</span>
        <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
      </van-cell>
      <van-cell class="log-cell" v-if="supportPay" :is-link="true" @click.stop="goLogs">
        <span>充值和扣费记录</span>
      </van-cell>
    </div>
  </div>
</template>

<script>
import constant from '@/config/constant'
import {mapGetters, mapActions} from 'vuex';
import {Link,gUuid} from '@/config/utils'

export default {
  name: 'UserCenter',
  components: {
  },
  props: {},
  data () {
    return {
      name:'',
      avatarUrl:'',
      isModifyName:false
    }
  },
  computed: {
    ...mapGetters({
      user: 'userStore/user'
    }),
    supportPay(){
      return config_server.supportPay
    }
  },
  watch: {},
  methods: {
    ...mapActions({
      updateUserInfo: 'userStore/updateUserInfo',
    }),
    goLogs(){
      Link(`/store/logs`)
    },
    charge(){
      Link(`/store/charge`)
    },
    updateInfo(point){
      let user = this.user
      user.point += point
      this.updateUserInfo(user)
    },
    afterSelectPhoto(photo,detail){
      let data = {}
      data.identifier = gUuid()
      data.content = photo.content
      data.name = photo.file.name
      data.size = photo.file.size
      data.type = photo.file.type
      data.lastModified = photo.file.lastModified
      global.jumpData = data
      this.$nextTick(()=>{
        Link(`/cropper?avatar_type=normal`)
      })
    },
    updateAvatarData(result){
      let that = this
      let info = result.info
  
      let cropperData = result.cropperData

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
          that.avatarUrl = rsp.url
          $API.home.updateUserInfo({
            avatarUrl:this.avatarUrl
          },rsp=>{
            let user = that.user
            user.avatarUrl = that.avatarUrl
            that.updateUserInfo(user)
          },error=>{
            this.$toast("修改失败，请稍后重试")
          })
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
    goModifyName(){
      this.isModifyName = true
      setTimeout(() => {
        this.$refs.name_input && this.$refs.name_input.focus()
      }, 200);
    },
    nameChanged(){
      this.isModifyName = false
      $API.home.updateUserInfo({
        nickName:this.name
      },rsp=>{
        let user = this.user
        user.name = this.name
        this.updateUserInfo(user)
      },error=>{
        this.$toast("修改失败，请稍后重试")
      })
    },
    registerEvent(){
      eventHub.$on(constant.EVENT_PAY_SUCCESS,this.updateInfo)
      eventHub.$on(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    }
  },
  created () {
    if (this.user){
      this.name = this.user.name
      this.avatarUrl = this.user.avatarUrl
    }
    this.registerEvent()
  },
  mounted () {
  },
  beforeDestroy(){
    eventHub.$off(constant.EVENT_PAY_SUCCESS,this.updateInfo)
    eventHub.$off(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
  }
}
</script>

<style rel="stylesheet/less" lang="less" scoped>
   @import "~@/config/config.less";
  .user-center-container{
    background: @BG_GRAY;
    display: flex;
    flex-direction: column;
    height: 100%;
    .user-center-wrapper{
      background: @BG_WHITE;
     
      /deep/.van-cell__value{
        display: flex;
        align-items: center;
        .avatar-box{
          .avatar{
            width:50px;
            height:50px;
            border-radius:50%;
            flex-shrink:0;
          }
        }
        
        .name-wrapper{
          margin-left: 12px;
          .name{
            font-size: 14px;
            color: @FONT_THIRD_COLOR;
          }
          .iconfont{
            margin-left: 8px;
            font-size: 14px;
            color: @FONT_THIRD_COLOR;
          }
          .name-input{
            padding-left: 0;
          }
        }
        .charge-remain{
          font-weight: bold;
        }
        .charge-btn{
          margin-left: auto;
          color: @FONT_WHITE_COLOR;
          background: @SECOND_THEME_COLOR;
        }
      }
    }
  }
</style>

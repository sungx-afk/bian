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
        <div class="charge-remain-wrapper">账号余额：<span class="charge-remain">{{user.point }}</span>&nbsp;云币</div>
        <div class="charge-btn-wrapper">
          <van-button size="small" class="charge-btn" @click="charge">充值（1 元 = 10 云币）</van-button>
        </div>
      </van-cell>
      <van-cell class="log-cell" v-if="supportPay" :is-link="true" @click.stop="goLogs">
        <span>充值和扣费记录</span>
      </van-cell>
      <van-cell class="account-cell" v-if="showOrder" @click="goViewMyOrder" :is-link="true">
        <span>我的订单</span>
      </van-cell>
      <!-- 上架必填：App 内必须能访问隐私政策与订阅条款 -->
      <van-cell class="doc-cell" @click="goPrivacy" :is-link="true">
        <span>隐私政策</span>
      </van-cell>
      <van-cell class="doc-cell" @click="goTerms" :is-link="true">
        <span>服务条款（自动续期订阅）</span>
      </van-cell>
      <!-- 审核 5.1.1(v)：App 内必须提供注销账号入口 -->
      <van-cell class="delete-cell">
        <div class="delete-btn" @click="goDeleteAccount">注销账号</div>
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
      oldName:'',
      isModifyName:false
    }
  },
  computed: {
    ...mapGetters({
      user: 'userStore/user'
    }),
    supportPay(){
      return config_server.supportPay
    },
    showOrder(){
      let appid = window.app_id || config_server.wechatAppId
      if(appid && appid == 'wx502b2e237549374c'){
        return true
      }
      return false
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
    goPrivacy(){
      Link(`/privacy`)
    },
    goTerms(){
      Link(`/terms`)
    },
    // 注销账号：后端脱敏并标记删除，本地清 token 后回到首页
    goDeleteAccount(){
      this.$dialog.confirm({
        title: '注销账号',
        message: '注销后账号内的个人信息将被清除且无法恢复，已创建的纪念馆将保留。确认注销吗？'
      }).then(() => {
        $API.user.deleteAccount({}, rsp => {
          if (rsp && (rsp.result === 0 || rsp.result === '0')){
            this.clearLocalLogin()
            this.$toast && this.$toast('账号已注销')
            Link(`/home`)
          }else{
            this.$toast && this.$toast((rsp && rsp.msg) || '注销失败，请稍后重试')
          }
        }, error => {
          this.$toast && this.$toast('注销失败，请稍后重试')
        })
      }).catch(()=>{})
    },
    clearLocalLogin(){
      let key = getLocalTokenKey()
      let param = localStorage.getItem(key)
      if (param){
        try{
          param = JSON.parse(param)
          param.token = ''
          localStorage.setItem(key, JSON.stringify(param))
        }catch(e){}
      }
      localStorage.removeItem('bian-query')
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
      this.oldName = this.name
      this.isModifyName = true
      setTimeout(() => {
        this.$refs.name_input && this.$refs.name_input.focus()
      }, 200);
    },
    nameChanged(){
      this.isModifyName = false
      //和原来一致就返回
      if (this.oldName == this.name){
        this.oldName = ''
        return
      }
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
    },
    goViewMyOrder(){
      Link('/mortuary/order_list?scope=my')
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
      }
      .charge-cell{
        /deep/.van-cell__value{
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .charge-remain-wrapper{
          flex-shrink: 0;
        }
        .charge-btn-wrapper{
          flex-shrink: 0;
          .charge-btn{
            color: @FONT_WHITE_COLOR;
            background: @SECOND_THEME_COLOR;
          }
        }
      }
      .doc-cell{
        margin-top: 12px;
      }
      .delete-cell{
        margin-top: 12px;
        .delete-btn{
          width: 100%;
          text-align: center;
          color: #d43c33;
          font-size: 14px;
        }
      }
    }
  }
</style>

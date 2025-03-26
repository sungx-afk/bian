<template>
  <div class="space-create-container">
    <div class="info">
      <van-cell class="type-cell" v-if="!id">
        <van-radio-group v-model="currentNumberType" class="type-radio-group" @change="numberTypeChanged">
          <van-radio v-for="item in numberTypeList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
        </van-radio-group>
      </van-cell>
      <van-field v-model="name" label="纪念馆名:" placeholder="请填写纪念馆名" maxlength="20" input-align="right"></van-field>
      <van-cell title="纪念馆样式:" is-link :value="theme && theme.name" @click="goTheme"></van-cell>
      <van-field
        ref="input"
        label="墓志铭:"
        v-model="epitaph"
        type="textarea"
        placeholder="请输入墓志铭"
        maxlength="120"
        rows="2"
        :autosize="{ maxHeight: 150, minHeight: 50 }">
      </van-field>
      <van-cell title="遗 像:" :border="false">
        <van-radio-group v-model="avatarType" class="avatar-type-radio-group" @change="avatarTypeChanged" v-if="currentNumberType === 1">
          <van-radio v-for="item in avatarTypeList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
        </van-radio-group>
      </van-cell>
      <van-cell>
        <div class="avatar-wrapper">
          <div class="avatar-preview" v-for="(avatar,index) in avatarUrls" :key="index">
            <van-uploader :after-read="afterSelectPhoto" :name="index">
              <img class="avatar" :class="['avatar-type_' + avatarType]" :src="avatar.url" v-if="avatar.url"/>
            </van-uploader>
          </div>
        </div>

      </van-cell>

      <div class="users-area" v-for="(user,index) in users" :key="index">
        <user-info :user="user"></user-info>
      </div>
    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="create">{{id?'修改':'创建'}}</van-button>
    </div>
    <div class="agreement" v-if="!id">
      <van-checkbox custom-class="agreement-icon" checked-color="#825621" shape="square" v-model="isAgreementChecked"></van-checkbox>
      <span class="text">我已详细阅读并同意</span>
      <span class="text" style="margin-left: 0px;color: #825621" @click.stop="readAgreement">《服务协议》</span>
    </div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  import constant from '@/config/constant'

  import UserInfo from './userinfo/UserInfo'
  import qs from 'qs'

  export default{
    data(){
      return {
        id:'',
        type:0,// 0 亲属 1，朋友
        users:[{
          name: '',
          birthday:'',         //诞辰
          birthAddress: '',    //出生地
          dieDay: '',         //忌日
          dieAddress: '',     //安葬地点
          sex: 0,
          avatarUrl: '',      //遗像地址
          notifyStatus: 1
        }],
        numberTypeList:[
          { name: '单人', value: 0},
          { name: '双人', value: 1 }
        ],
        avatarTypeList:[
          { name: '单人照', value: 0},
          { name: '合影', value: 1}
        ],
        avatarType:0,
        avatarUrls:[],
        avatarUploaderIndex:0,
        name:'',
        theme:null,
        epitaph:'', //墓志铭
        currentNumberType:0,
        isAgreementChecked: true,  //是否选择了鱼骨协议
      }
    },
    components: {
      UserInfo
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
        detail:'spaceStore/spaceDetail'
      }),
      isIPhoneX(){
        return false
      },
    },
    methods:{
      initSpaceData(){
        if (this.id){
          this.name = this.detail.name
          this.epitaph = this.detail.epitaph
          this.users = this.detail.spaceUsers
          if (this.detail.themeId === 'custom'){
            this.theme = this.detail.customThemeId
          }else {
            this.theme = this.getPresetTheme(this.detail.themeId)
          }
          this.avatarType = this.detail.combineImage
          this.avatarUrls = this.users.filter(item=>item.avatarUrl).map(item=>{
            let o = {
              url:item.avatarUrl
            }
            return o
          })

          if (this.avatarType == 0 && this.avatarUrls.length < this.users.length){
            let delta = this.users.length - this.avatarUrls.length
            for (let i = 0; i < delta; i++) {
              this.avatarUrls.push({url:''})
            }
          }else if (this.avatarType == 1 && this.avatarUrls.length === 0){
            this.avatarUrls.push({url:''})
          }

          this.currentNumberType = this.users.length > 1?1:0
        }else {
          this.avatarUrls = [{url:''}]
        }
      },
      numberTypeChanged(value){
        this.currentNumberType = value
        if (this.currentNumberType == 0 && this.users.length > 1){
          this.users.splice(1,1)
          if (this.avatarUrls.length > 1){
            this.avatarUrls.splice(1,1)
          }
        }else if(this.currentNumberType == 1 && this.users.length <= 1){
          this.users.push({
            name: '',
            birthday:'',
            birthAddress: '',
            dieDay: '',
            dieAddress: '',
            sex: 0,
            nation: '',
            avatarUrl: '',
          })
          if (this.avatarType == 0 && this.avatarUrls.length === 1){
            this.avatarUrls.push({url:''})
          }
        }
      },
      goTheme(){
        let url = `/space/theme`
        let query = {}
        if (this.theme){
          query.theme_id = this.theme.uuid
        }
        if (this.id){
          query.space_id = this.id
        }
        if (Object.keys(query).length > 0){
          url = url + '?' + qs.stringify(query, {indices: false})
        }
        Link(url)
      },
      updateTheme(theme){
        this.theme = theme
      },
      avatarTypeChanged(value){
        this.avatarType = value
        if (this.avatarType == 1 && this.avatarUrls.length > 1){
          this.avatarUrls.splice(1,1)
        }else if(this.avatarType == 0 && this.avatarUrls.length === 1){
          this.avatarUrls.push({url:''})
        }
      },
      afterSelectPhoto(photo,detail){
        this.avatarUploaderIndex = detail.name
        let data = {}
        data.identifier = this.avatarUrls[this.avatarUploaderIndex].identifier = gUuid()
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
        if (info.identifier !== this.avatarUrls[index].identifier){
          return
        }

        let cropperData = result.cropperData

        that.avatarUrls[index] = result.cropperData
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
            that.avatarUrls.splice(index,1,{url:rsp.url})
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
      create() {
        //判断所有的dead
        let clearLocalStorage = false
        let secretCode = '*#62334*#'
        let empty = false
        this.users.forEach(item=>{
          if (!item.name){
            empty = true
            return false
          }else if(item.name === secretCode){
            clearLocalStorage = true
          }
        })
        if (clearLocalStorage){
          window.localStorage.removeItem('bian-requestParam');
          this.$toast('清空本地缓存成功')
          return
        }
        if (empty) {
          this.$toast('请填写逝者姓名');
          return;
        }

        if (!this.isAgreementChecked) {
          this.$toast('请先阅读服务协议');
          return;
        }

        let invalidAvatar = false
        this.avatarUrls.forEach(item=>{
          if (item.url && (item.url.indexOf("http://") === -1 && item.url.indexOf("https://") === -1)){
            invalidAvatar = true
            return false
          }
        })
        if (invalidAvatar) {
          this.$toast('遗像未正确上传，请重新选择');
          return;
        }

        //遗像
        for (let i = 0; i < this.avatarUrls.length; i++) {
          this.users[i].avatarUrl = this.avatarUrls[i].url
        }

        let spaceName = this.name
        if (!spaceName){
          this.users.forEach((item,index)=>{
            spaceName += item.name
            if (index !== this.users.length - 1){
              spaceName += '和'
            }
          })
          spaceName += '的纪念馆'
        }

        this.$toast.loading({
          duration: 0,       // 持续展示 toast
          forbidClick: true, // 禁用背景点击
          loadingType: 'spinner',
          message: '提交中...'
        })
        if (this.id){
          let p1 = new Promise((resolve, reject) => {
            let params = {
              sid:this.id,
              name: spaceName,
              epitaph:this.epitaph,
              combineImage:this.avatarType
            }
            if (this.theme){
              params.themeId = this.theme.uuid
              if (this.theme.uuid === 'custom'){
                params.customTheme = JSON.stringify(this.theme)
              }
            }
            $API.space.modifySpace(params, rsp=>{
              resolve && resolve(rsp)
            },error=>{
              reject && reject(error)
            })
          })
          let promises = [p1]
          this.users.forEach(user=>{
            promises.push(new Promise((resolve, reject) => {
              $API.space.updateSpaceUser({
                sid:this.id,
                user
              }, rsp=>{
                resolve && resolve(rsp)
              },error=>{
                reject && reject(error)
              })
            }))
          })
          Promise.all(promises)
            .then(() => {
              eventHub.$emit(constant.EVENT_CREATE_SPACE_SUCCESS)
              this.$toast.clear()
              this.$toast({
                message:'修改成功',
                type:'success',
                duration:1500,
                onClose:()=>{
                  this.$router.go(-1)
                }
              })
            })
            .catch((error) => {
              this.$toast('修改失败，请稍后重试')
            });
        }else{
          let params = {
            type:this.type,
            name: spaceName,
            users: this.users,
            epitaph:this.epitaph,
            combineImage:this.avatarType
          }
          if (this.theme){
            params.themeId = this.theme.uuid
            if (this.theme.uuid === 'custom'){
              params.customTheme = JSON.stringify(this.theme)
            }
          }
          $API.space.createSpace(params, rsp => {
            eventHub.$emit(constant.EVENT_CREATE_SPACE_SUCCESS)
            this.$toast.clear()
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
      readAgreement(){
        Link('/agreement')
      }
    },
    created() {
      let query = this.$route.query
      if (query){
        if (query.type){
          this.type = query.type
        }
        if (query.space_id){
          this.id = query.space_id
        }
        this.initSpaceData()
      }
      eventHub.$on(constant.EVENT_SELECT_THEME,this.updateTheme)
      eventHub.$on(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    },
    beforeDestroy() {
      eventHub.$off(constant.EVENT_SELECT_THEME,this.updateTheme)
      eventHub.$off(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .space-create-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 32px;
    .info {
      .type-cell{
        background-color: white;
        .type-radio-group{
          display: flex;
          width: 50%;
          height: 40px;
          justify-content: space-around;
          margin-left: 25%;
        }
      }
      .avatar-type-radio-group{
        display: flex;
        justify-content: flex-end;
        .van-radio{
          margin-left: 8px;
        }
      }
      .van-uploader{
        // padding: 8px 0px;
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
      /deep/.van-field__label{
        color:#323233;
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
      }
    }

    .agreement {
      display: flex;
      flex-direction: row;
      justify-content: center;
      height: 30px;
      align-items: center;
      margin-top: 20px;

      .text {
        height: 30px;
        line-height: 30px;
        margin-left: 5px;
        text-align: center;
        font-size: 13px;
        color: #202020;
      }
    }
  }

</style>

<template>
  <div class="users-info" v-if="user">
    <van-field v-model="user.name" label="逝者姓名:" placeholder="请输入逝者姓名" maxlength="25" input-align="right"></van-field>
    <van-cell title="性 别:">
      <van-radio-group v-model="user.sex" class="sex-radio-group">
        <van-radio v-for="item in sexList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
      </van-radio-group>
    </van-cell>
    <van-cell title="出生日期:" is-link :value="user.birthday?dateText(user.birthday):'未填写'" @click.stop="selectBirthday"></van-cell>
    <van-cell title="逝世日期:" is-link :value="user.dieDay?dateText(user.dieDay):'未填写'" @click.stop="selectDieDay"></van-cell>
    <van-field v-model="user.birthAddress" label="出生地点:" placeholder="未填写" maxlength="100" input-align="right"></van-field>
    <van-field v-model="user.dieAddress" label="安葬地点:" placeholder="未填写" maxlength="100" input-align="right"></van-field>

    <van-cell title="遗 像:" is-link>
      <van-uploader :after-read="afterSelectPhoto">
        <div style="width: 250px;">
          <span v-if="user.avatarUrl">已选择</span>
          <span v-else>请选择</span>
        </div>
      </van-uploader>
    </van-cell>
    <div class="avatar-preview" v-if="user.avatarUrl">
      <van-uploader :after-read="afterSelectPhoto">
        <div v-if="loading" class="loading-wrapper">
          <van-loading class="loading" vertical>上传中...</van-loading>
        </div>
        <img :src="user.avatarUrl" />
      </van-uploader>
    </div>
    <van-popup v-model="showBirthdayPicker" position="bottom" @closed="birthdayPickerClosed">
      <van-datetime-picker
        v-model="birthdayPickerDate"
        type="date"
        :min-date="minPickerDate"
        :max-date="maxPickerDate"
        @cancel="birthdayPickerCancel"
        @confirm="birthdayPickerConfirm">
      </van-datetime-picker>
    </van-popup>
    <van-popup v-model="showDieDayPicker" position="bottom" @closed="dieDayPickerClosed">
      <van-datetime-picker
        v-model="dieDayPickerDate"
        type="date"
        :min-date="minPickerDate"
        :max-date="maxPickerDate"
        @cancel="dieDayPickerCancel"
        @confirm="dieDayPickerConfirm">
      </van-datetime-picker>
    </van-popup>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {timesToDate,Link,gUuid} from '@/config/utils'

    export default {
      name: "UserInfo",
      props:{
        user:{
          type:Object,
          default:null,
          twoWay:true
        }
      },
      data(){
        return{
          showBirthdayPicker:false,
          birthdayPickerDate:'',
          showDieDayPicker:false,
          dieDayPickerDate:'',
          minPickerDate:'',
          maxPickerDate:'',
          sexList: [
            { name: '男', value: 0 },
            { name: '女', value: 1 }
          ],
          loading:false,
          identifier:''
        }
      },
      methods:{
        dateText(timestamp){
          return timesToDate(timestamp,'yyyy年MM月dd日')
        },
        initMinMaxDate(){
          let now = new Date()
          this.maxPickerDate = now
          this.minPickerDate = new Date(1900,0,1)
        },
        selectBirthday(){
          this.initMinMaxDate()
          if (this.user.birthday){
            this.birthdayPickerDate = new Date(this.user.birthday)
          }else{
            this.birthdayPickerDate = new Date(1900,0,1)
          }
          this.showBirthdayPicker = true
        },
        selectDieDay(){
          this.initMinMaxDate()
          if (this.user.dieDay){
            this.dieDayPickerDate = new Date(this.user.dieDay)
          }else{
            this.dieDayPickerDate = new Date()
          }
          this.showDieDayPicker = true
        },
        birthdayPickerClosed(){
          this.showBirthdayPicker = false
        },
        dieDayPickerClosed(){
          this.showDieDayPicker = false
        },
        birthdayPickerCancel(){
          this.showBirthdayPicker = false
        },
        dieDayPickerCancel(){
          this.showDieDayPicker = false
        },
        birthdayPickerConfirm(date){
          this.user.birthday = date.getTime()
          this.showBirthdayPicker = false
        },
        dieDayPickerConfirm(date){
          this.user.dieDay = date.getTime()
          this.showDieDayPicker = false
        },
        afterSelectPhoto(photo){
          let data = {}
          data.identifier = this.identifier
          data.content = photo.content
          data.name = photo.file.name
          data.size = photo.file.size
          data.type = photo.file.type
          data.lastModified = photo.file.lastModified
          this.$store.dispatch('spaceStore/setCropImageData',data)
          this.$nextTick(()=>{
            Link(`/cropper`)
          })
        },
        updateAvatarData(result){
          let that = this
          let info = result.info

          if (info.identifier !== this.identifier){
            return
          }

          let cropperData = result.cropperData
          that.user.avatarUrl = result.cropperData
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
              that.user.avatarUrl = rsp.url
              that.loading = false
            },error=>{
              this.$toast("上传失败，请稍后重试")
              that.loading = false
            })
          },error=>{
            this.$toast("上传失败，请稍后重试")
            that.loading = false
          })
        }
      },
      created() {
        let identifier = gUuid()
        this.identifier = identifier
        eventHub.$on(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_IMAGE_CROP_COMPLETE,this.updateAvatarData)
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .users-info{
    margin-bottom:10px;
    .van-cell{
      .van-uploader{
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }
    }
    .avatar-preview{
      display: flex;
      justify-content: center;
      padding: 10px 0px;
      img{
        width: 122px;
        height: 157px;
      }
      .loading-wrapper{
        position: absolute;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        .loading{
          justify-content: center;
        }
      }
    }
    .sex-radio-group{
      display: flex;
      justify-content: flex-end;
    }
  }


</style>

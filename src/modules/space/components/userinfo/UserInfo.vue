<template>
  <div class="users-info" v-if="user">
    <van-field v-model="user.name" label="逝者姓名:" placeholder="请输入逝者姓名" maxlength="25" input-align="right"></van-field>
    <van-cell title="性 别:">
      <van-radio-group v-model="user.sex" class="sex-radio-group">
        <van-radio v-for="item in sexList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
      </van-radio-group>
    </van-cell>
    <van-cell class="date-wrapper" title="生 卒:" is-link :value="userDate" @click.stop="goSelectDate"></van-cell>
    <van-field v-model="user.birthAddress" label="出生地点:" placeholder="未填写" maxlength="100" input-align="right"></van-field>
    <van-field v-model="user.dieAddress" label="安葬地点:" placeholder="未填写" maxlength="100" input-align="right"></van-field>

    <template v-if="showAvatar">
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
    </template>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {timesToDate,Link,gUuid} from '@/config/utils'
  import SelectDate from '@/modules/widget/select-date'

    export default {
      name: "UserInfo",
      props:{
        user:{
          type:Object,
          default:null,
          twoWay:true
        },
        showAvatar:{
          type:Boolean,
          default:false
        }
      },
      data(){
        return{
          sexList: [
            { name: '男', value: 0 },
            { name: '女', value: 1 }
          ],
          loading:false,
          identifier:''
        }
      },
      computed:{
        userDate(){
          let birthday = '出生日期'
          let dieDay = '逝世日期'
          let split = ' - '
          if (this.user.birthdayStr){
            birthday = this.user.birthdayStr
          }else{
            if (this.user.birthday){
              birthday = this.dateText(this.user.birthday)
            }
          }
          if (this.user.dieDayStr){
             dieDay = this.user.dieDayStr
          }else{
            if (this.user.dieDay){
              dieDay = this.dateText(this.user.dieDay)
            }
          }
          let calType = ''
          if (this.calType === 0){
            calType = '公历:'
          }else if (this.calType === 1){
            calType = '阴历:'
          }
          return `${calType}${birthday}${split}${dieDay}`
        }
      },
      methods:{
        dateText(timestamp){
          return timesToDate(timestamp,'yyyy年MM月dd日')
        },
        goSelectDate(){
          SelectDate({
            calType:this.user.calType,
            birthday:this.user.birthday,
            birthdayStr:this.user.birthdayStr,
            dieDay:this.user.dieDay,
            dieDayStr:this.user.dieDayStr,
            notifyChecked:this.user.notifyStatus === 1,
            callback:(data)=>{
              this.user.calType = data.calType
              if (data.birthday !== undefined && data.birthday !== null){
                this.user.birthday = data.birthday
                this.user.birthdayStr = data.birthdayStr
              }
              if (data.dieDay !== undefined && data.dieDay !== null){
                this.user.dieDay = data.dieDay
                this.user.dieDayStr = data.dieDayStr
              } 
            }
          })
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
      &.date-wrapper{
        .van-cell__title{
          flex-shrink: 0;
          flex-grow: 0;
          flex-basis: 40px;
        }
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
      .van-radio{
        margin-left: 8px;
      }
    }
  }


</style>

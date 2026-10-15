<template>
  <div class="users-info" v-if="user">
    <van-field v-model="user.name" :label="$t('逝者姓名:')" :placeholder="$t('请输入逝者姓名')" maxlength="25"></van-field>
    <van-cell :title="$t('性 别:')">
      <van-radio-group v-model="user.sex" class="sex-radio-group">
        <van-radio v-for="item in sexList" :key="item.value" :name="item.value" checked-color="#825621">{{ $t(item.name) }}</van-radio>
      </van-radio-group>
    </van-cell>
    <van-cell class="date-wrapper" :title="$t('生 卒:')" is-link :value="userDate" @click.stop="goSelectDate"></van-cell>
    <van-field v-model="user.birthAddress" :label="$t('出生地:')" :placeholder="$t('未填写')" maxlength="100"></van-field>
    <van-field v-if="false" v-model="user.dieAddress" :label="$t('安葬地:')" :placeholder="$t('未填写')" maxlength="100" input-align="right"></van-field>
    <van-cell v-if="showDelete">
      <div class="delete-btn" @click="deleteUser">{{ $t('删除') }}</div>
    </van-cell>
    <template v-if="showAvatar">
      <van-cell :title="$t('遗 像:')" is-link>
        <van-uploader :after-read="afterSelectPhoto">
          <div style="width: 250px;">
            <span v-if="user.avatarUrl">{{ $t('已选择') }}</span>
            <span v-else>{{ $t('请选择') }}</span>
          </div>
        </van-uploader>
      </van-cell>
      <div class="avatar-preview" v-if="user.avatarUrl">
        <van-uploader :after-read="afterSelectPhoto">
          <div v-if="loading" class="loading-wrapper">
            <van-loading class="loading" vertical>{{ $t('上传中...') }}</van-loading>
          </div>
          <img :src="user.avatarUrl" />
        </van-uploader>
      </div>
    </template>
  </div>
</template>

<script>
import { formatMemorialDate } from '@/i18n/dates'
  import { t } from '@/i18n'

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
        },
        showDelete:{
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
          let birthday = t('出生日期')
          let dieDay = t('逝世日期')
          let split = ' - '
          if (this.user.birthdayStr){
            birthday = formatMemorialDate(this.user.birthdayStr)
          }else{
            if (this.user.birthday){
              birthday = this.dateText(this.user.birthday)
            }
          }
          if (this.user.dieDayStr){
             dieDay = formatMemorialDate(this.user.dieDayStr)
          }else{
            if (this.user.dieDay){
              dieDay = this.dateText(this.user.dieDay)
            }
          }
          let calType = ''
          if (this.user.calType === 0){
            calType = t('公历:')
          }else if (this.user.calType === 1){
            calType = t('阴历:')
          }
          return `${calType}${birthday}${split}${dieDay}`
        }
      },
      methods:{
        dateText(timestamp){
          return formatMemorialDate(timesToDate(timestamp,'yyyy年MM月dd日'))
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
              this.$toast(t('上传失败，请稍后重试'))
              that.loading = false
            })
          },error=>{
            this.$toast(t('上传失败，请稍后重试'))
            that.loading = false
          })
        },
        deleteUser(){
          this.$emit('delete-user',this.user)
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
    /* 表单改为 label 在上的纵向布局（vant 内部元素需 /deep/ 穿透 scoped） */
    .van-cell{
      display: block;
      position: relative;
    }
    /deep/.van-cell__title{
      width: 100% !important;
      flex: none;
      margin-bottom: 6px;
    }
    /deep/.van-cell__value{
      text-align: left;
    }
    /* is-link 箭头绝对定位到行右侧，避免被挤到下一行 */
    /deep/.van-cell__right-icon{
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      margin: 0;
    }
    /* 日期行：长值单行省略，防止撑高 */
    /deep/.date-wrapper{
      .van-cell__value{
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
    /deep/.van-field__label{
      width: 100% !important;
    }
    .van-cell{
      .van-uploader{
        width: 100%;
        display: flex;
        justify-content: flex-start;
      }
      .delete-btn{
        text-align: center;
        color: @MAIN_THEME_COLOR;
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
      justify-content: flex-start;
      .van-radio{
        margin-right: 24px;
      }
    }
  }


</style>

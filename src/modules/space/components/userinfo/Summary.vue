<template>
  <div class="summary-container">
    <template v-if="space && space.spaceUsers && space.spaceUsers.length > 0">
      <van-collapse v-model="activeUserId" accordion>
        <van-collapse-item v-for="user in space.spaceUsers" :key="user.id" :name="user.id" size="large">
          <div slot="title" class="title-wrapper">
            <div class="name">{{user.name}}</div>
            <div class="iconfont icon-bianji" v-if="isSpaceCreator" @click.stop="goEditUser(user)"></div>
          </div>
          <div class="content-wrapper">
            <div class="base-info">
              <div class="date-info">
                <span>出生：{{birthdayText(user)}}</span>
                <span style="margin-left: 15px;">逝世：{{dieDayText(user)}}</span>
              </div>
              <div class="address-info">
                出生地点：{{user.birthAddress || '未填写'}}
              </div>
              <div class="address-info">
                安葬地点：{{user.dieAddress || '未填写'}}
              </div>
            </div>
            <div class="summary-area">
              <template v-if="user.summary && user.summary.length > 0">
                <div class="title">生平介绍:</div>
                <div class="summary">
                  <van-field
                    v-model="user.summary"
                    autosize
                    readonly
                    type="textarea"
                  />
                </div>
              </template>
              <template v-else>
                暂无生平介绍
              </template>
            </div>
          </div>
        </van-collapse-item>
      </van-collapse>
    </template>
    <van-action-sheet
      v-model="showAction"
      :actions="actions"
      close-on-popstate
      close-on-click-action
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {timesToDate,Link} from '@/config/utils'
  import constant from '@/config/constant'
  import ModifyText from '@/modules/widget/modify-text'

    export default {
      name: "Summary",
      data(){
        return{
          spaceId:'',
          activeUserId:'',
          showAction:false,
          actions:[]
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user',
          space:'spaceStore/spaceDetail'
        }),
        isSpaceCreator(){
          let result = false
          let currentUserId = this.user.id
          if (this.space && currentUserId === this.space.creatorId){
            result = true
          }
          return result
        }
      },
      methods:{
        ...mapActions({
          getSpaceDetail:'spaceStore/getSpaceDetail',
          updateSpaceUser:'spaceStore/updateSpaceUser'
        }),
        birthdayText(user){
          let result = '未填写'
          if (user.birthdayStr){
            result = user.birthdayStr
          }else if (user.birthday){
            result = timesToDate(user.birthday,'yyyy年MM月dd日')
          }
          return result
        },
        dieDayText(user){
          let result = '未填写'
          if (user.dieDayStr){
            result = user.dieDayStr
          }else if (user.dieDay){
            result = timesToDate(user.dieDay,'yyyy年MM月dd日')
          }
          return result
        },
        goEditUser(user){
          this.actions = [{
            name: '逝者基本信息',
            id:'base',
            data:user
          },{
            name: '逝者生平',
            id:'summary',
            data:user
          },]
          this.showAction = true
        },
        modifySummary(user,summary){
          user.summary = summary
          this.updateSpaceUser({sid:this.space.id,user}).then(()=>{

          }).catch(()=>{
            this.$toast('修改失败，请稍后重试')
          })
        },
        onActionSelect(item){
          this.showAction = false
          let menu = item.id
          let user = item.data
          if (menu === 'base'){
            localStorage.setItem(constant.KEY_EDIT_USER_INFO,JSON.stringify(user))
            Link(`/user_edit?space_id=${this.space.id}&avatar_type=${this.space.combineImage}`)
          }else if (menu === 'summary'){
            ModifyText({
              content:user.summary,
              multiline:true,
              placeholder:'请输入生平简介',
              callback:data=>{
                this.modifySummary(user,data)
              }
            })
          }
        },
        onActionClose(){
          this.showAction = false
          this.actions = []
        },
        getStoryList(){ 
          return new Promise((resovle,reject)=>{
            let params = {
              start:0,
              limit:1,
              type:'LIFE_EXPERIENCE'
            }
            $API.space.getSpaceStoryList(this.space.id,params,rsp=>{
              resovle(rsp.total)
            })
          },error=>{

          })
        }
      },
      created() {
        this.getStoryList().then((total)=>{
          //如果有文章，就默认不打开介绍
          if (total > 0){
            return
          }
          if (this.space && this.space.spaceUsers){
            this.activeUserId = ''
            if (this.space.spaceUsers.length){
              this.activeUserId = this.space.spaceUsers[0].id
            }
          }
        })
      },
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .summary-container{
    // height: 100%;
    overflow-y: auto;
    background: @BG_WHITE;
    // padding-bottom: 100px;
    &.safe-navigator{
      padding-top: 40px;
    }
    .title-wrapper{
      display: flex;
      align-items: center;
      .name{
        color: @FONT_FIRST_COLOR;
        font-size: 18px;
        font-weight: bold;
      }
      .iconfont{
        margin-left: 8px;
      }
    }
    .content-wrapper{
      font-size: 14px;
      color: @FONT_THIRD_COLOR;
      overflow-y: auto;
      .base-info{
        .date-info{
          padding: 5px 0px;
        }
        .address-info{
          padding: 5px 0px;
        }
      }
      .summary-area{
        margin-top: 10px;
        .title{
          margin-bottom: 10px;
        }
        .summary{
          .van-field{
            padding: 10px 0px;
          }
        }
      }
    }
  }
</style>

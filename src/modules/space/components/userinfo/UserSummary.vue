<template>
  <div class="user-summary-container">
    <template v-if="space && space.spaceUsers && space.spaceUsers.length > 0">
      <van-collapse v-model="activeUserId">
        <van-collapse-item v-for="user in space.spaceUsers" :key="user.id" :name="user.id" size="large">
          <div slot="title" class="title-wrapper">
            <div class="name">{{user.name}}</div>
            <div class="iconfont icon-bianji" @click.stop="goEditUser(user)"></div>
          </div>
          <div class="content-wrapper">
            <div class="base-info">
              <div class="date-info">
                <span>出生：{{user.birthday | timesToDate('yyyy年MM月dd日') || '未填写'}}</span>
                <span style="margin-left: 15px;">逝世：{{user.dieDay | timesToDate('yyyy年MM月dd日') || '未填写'}}</span>
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
                    type="textarea"
                    readonly
                    :autosize="{ maxHeight: 300, minHeight: 50 }">
                  </van-field>
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
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>
  </div>
</template>

<script>
  import {Link} from '@/config/utils'
  import constant from '@/config/constant'
  import ModifyText from '@/modules/widget/modify-text'

    export default {
      name: "UserSummary",
      data(){
        return{
          spaceId:'',
          space:null,
          activeUserId:null,
          showAction:false,
          actions:[]
        }
      },
      computed:{

      },
      methods:{
        getDetail(){
          if (!this.spaceId){
            return
          }
          $API.space.getSpaceDetail({
            sid: this.spaceId,
          }, (rsp)=>{
            this.space = rsp
            if (this.space.spaceUsers){
              this.activeUserId = [this.space.spaceUsers[0].id]
            }
          })
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
          $API.space.updateSpaceUser({
            sid:this.space.id,
            user:user
          }, rsp=>{
            //找到对应编辑的人，更新简介
            this.updateSpaceUser(user)
          }, error=>{
            this.$toast('修改失败，请稍后重试')
          })
        },
        updateSpaceUser(user){
          let spaceUsers = this.space.spaceUsers
          let index = spaceUsers.findIndex(item=>{
            return item.id === user.id
          })
          if (index > -1){
            this.space.spaceUsers.splice(index,1,user)
          }
        },
        onActionSelect(item){
          this.showAction = false
          let menu = item.id
          let user = item.data
          if (menu === 'base'){
            localStorage.setItem(constant.KEY_EDIT_USER_INFO,JSON.stringify(user))
            Link(`/user_edit?space_id=${this.space.id}`)
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
      },
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
            this.getDetail(() => {

            })
          }
        }
        eventHub.$on(constant.EVENT_UPDATE_SPACE_USER_SUCCESS,this.updateSpaceUser)
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_UPDATE_SPACE_USER_SUCCESS,this.updateSpaceUser)
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .user-summary-container{
    height: 100%;
    background: @BG_WHITE;
    .title-wrapper{
      display: flex;
      align-items: center;
      .name{
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

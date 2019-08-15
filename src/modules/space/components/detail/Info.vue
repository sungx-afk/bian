<template>
  <div class="main-container" v-if="space">
    <div class="space-area">
      <div class="space-top">
        <div class="space-name" @click.stop="goRenameSpace">
          {{space.name}}
        </div>
        <div class="operate" v-if="canOperate">
          <i class="setting iconfont icon-shezhi1" @click.stop="goSpaceManage"></i>
        </div>
      </div>
      <div class="create-info">
        该馆由 {{space.creator.name}} 于 {{space.createDate | timesToDate('yyyy年MM月dd日')}}创建，有{{space.visitedTimes}}人次到访
      </div>
    </div>
    <div class="avatar-area">
      <div v-for="user in space.spaceUsers" :key="user.id">
        <img v-if="user.avatarUrl" class="image" :src="user.avatarUrl" />
        <div class="tombstone" v-else>
          <img class="tombstone-image" src="~@/modules/images/tombstone.png" />
          <div class="tombstone-text">{{user.name}}</div>
        </div>
      </div>
    </div>
    <div class="lifetime-area">
      <div class="lifetime-content" v-for="user in space.spaceUsers" :key="user.id">
        <div class="lifetime-top">
          <div class="name">{{user.name}}</div>
          <i class="edit iconfont icon-bianji" v-if="canOperate" @click.stop="editMenu(user)"></i>
        </div>
        <div class="lifetime-bottom">
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
      </div>
    </div>
    <template v-if="showMeeting">
      <div class="memorial-meeting" @click.stop="goMemorialMeeting">
        <div class="meeting">追悼会</div>
        <template v-if="canOperate">
          <div class="operate" @click.stop="closeMemorialMeeting">
            <i class="close-image iconfont icon-close"></i>
          </div>
        </template>
      </div>
    </template>
    <div class="split-space"></div>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'

  import constant from '@/config/constant'

  import ModifyText from '@/modules/widget/modify-text'

    export default {
      name: "Main",
      props:{
        space:{
          type:Object,
          default:null
        },
      },
      data(){
        return{
          showMeeting:false,
          actions:[],
          showAction:false,
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user',
        }),
        isSpaceCreator(){
          let result = false
          let currentUserId = this.user.id
          if (this.space && currentUserId === this.space.creatorId){
            result = true
          }
          return result
        },
        canOperate(){
          return this.isSpaceCreator
        }
      },
      watch:{

      },
      methods:{
        initShowMeeting(){
          if (this.space){
            let show = false
            if (!this.isSpaceCreator){
              return show
            }
            show = true
            let value = localStorage.getItem(constant.KEY_MEMORIAL_MEETING_SHOW+this.space.id)
            if (value === 'false'){
              show = false
            }
            this.showMeeting = show
          }
        },
        goRenameSpace(){
          if (!this.canOperate){
            return
          }
          let that = this
          ModifyText({
            placeholder:'请输入新馆名',
            callback:data=>{
              that.modifySpaceName(data)
            }
          })
        },
        modifySpaceName(name){
          let that = this
          $API.space.renameSpace({
              sid:that.space.id,
              name:name
            }, rsp=>{
              that.space.name = name
            }, error=>{

            })
        },
        goSpaceManage(){
          Link(`/space/manage/${this.space.id}`)
        },
        editMenu(user){
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
          this.$emit('action-changed',{actions:this.actions,showAction:this.showAction})
        },
        onActionSelect(item){
          this.showAction = false
          this.$emit('action-changed',{showAction:this.showAction})

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
          this.$emit('action-changed',{showAction:this.showAction})
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
        goMemorialMeeting(){
          Link(`/space/meeting/${this.space.id}`)
        },
        closeMemorialMeeting(){
          this.showMeeting = false
          if (this.space){
            localStorage.setItem(constant.KEY_MEMORIAL_MEETING_SHOW+this.space.id,'false')
          }
        },
        registerEvent(){
          eventHub.$on(constant.EVENT_UPDATE_SPACE_USER_SUCCESS,this.updateSpaceUser)
        }
      },
      created() {
        this.registerEvent()
        this.initShowMeeting()
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_UPDATE_SPACE_USER_SUCCESS,this.updateSpaceUser)
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .main-container{
    height: 100%;
    overflow-y: scroll;
    .space-area{
      display: flex;
      flex-direction:column;
      background: @BG_WHITE;
      padding: 10px 15px;
      margin-bottom: 10px;
      .space-top{
        display: flex;
        align-items:center;
        .space-name{
          font-size: 20px;
          font-weight: bold;
        }
        .operate{
          display: flex;
          margin-left: auto;
          .setting{
            &.iconfont{
              font-size: 20px;
              font-weight: bold;
              color: @MAIN_THEME_COLOR;
            }
          }
        }
      }
      .create-info{
        font-size: 12px;
        color: @FONT_FOUR_COLOR;
        margin-top: 5px;
      }
    }
    .avatar-area{
      display: flex;
      justify-content:center;
      background:@BG_WHITE;
      margin:2px 0px 10px;
      padding:10px 0px;
      .image{
        width: 122px;
        height: 157px;
        margin:0 5px;
      }
      .tombstone{
        width: 140px;
        height: 140px;
        margin:0 5px;
        position: relative;
        .tombstone-image{
          width: 100%;
          height: 100%;
        }
        .tombstone-text{
          position:absolute;
          top:50px;
          left:60px;
          font-size: 14px;
          writing-mode: vertical-lr;
        }
      }
    }
    .lifetime-area{
      .lifetime-content{
        display:flex;
        flex-direction:column;
        background:@BG_WHITE;
        border-bottom:1px solid @BORDER_COLOR_1;
        &:last-child{
          border-bottom:none;
        }
        .lifetime-top{
          display:flex;
          align-items: center;
          height: 40px;
          margin:0 15px;
          border-bottom:1px solid #eeeeee;
          .name{
            font-size:14px;
            font-weight:bold;
          }
          .edit{
            margin-left: auto;
          }
        }
        .lifetime-bottom{
          padding: 15px;
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
    }
    .memorial-meeting{
      display: flex;
      align-items: center;
      height:60px;
      background:@BG_WHITE;
      margin-top:10px;
      padding:0 15px;

      .meeting{
        font-size: 14px;
      }
      .operate{
        margin-left: auto;
        display:flex;
        align-items:center;
        .close-image{

        }
      }
    }
    .split-space{
      height: 10px;
      background: #f4f4f4;
    }
  }

</style>

<template>
  <div class="info-theme-container" :style="{'background-image':`url(${theme.url})`}">
    <div class="base-info-wrapper">
      <div class="combine-avatar" v-if="space.combineImage === 1" :class="{hide:configHide('avatar')}">
        <img class="avatar" v-if="combineAvatarUrl" :src="combineAvatarUrl" />
        <div class="placeholder" v-else>

        </div>
      </div>
      <div class="user-wrapper">
        <div class="user" v-for="user in space.spaceUsers" :key="user.id">
          <div class="avatar-wrapper" :class="{hide:configHide('avatar')}" v-if="space.combineImage === 0">
            <img class="avatar" v-if="user.avatarUrl" :src="user.avatarUrl" />
            <div class="placeholder" v-else>

            </div>
          </div>
        </div>
      </div>
      <div class="epitaph-wrapper" v-if="space.showEpitaph && space.epitaph && !configHide('epitaph')" :style="{color:theme.epitaphColor}">
        {{space && space.epitaph}}
      </div>
    </div>

    <div class="summary-section" v-if="space.spaceUsers && space.spaceUsers.length > 0 && !configHide('summary')">
      <div class="summary-card" v-for="user in space.spaceUsers" :key="user.id">
        <div class="summary-card-header">
          <div class="summary-card-name">
            {{user.name}}
            <span class="iconfont icon-bianji summary-card-edit" v-if="isSpaceCreator" @click.stop="goEditUser(user)"></span>
          </div>
          <div class="summary-card-date" v-if="user.birthday || user.dieDay">
            <span v-if="user.birthday">{{user.birthday | timesToDate('yyyy')}}</span>
            <span v-if="user.birthday && user.dieDay"> - </span>
            <span v-if="user.dieDay">{{user.dieDay | timesToDate('yyyy')}}</span>
          </div>
        </div>
        <div class="summary-card-body">
          <div class="summary-row">
            <span class="summary-label">出生地</span>
            <span class="summary-value">{{user.birthAddress || '未填写'}}</span>
          </div>
          <div class="summary-row" v-if="false">
            <span class="summary-label">安葬地</span>
            <span class="summary-value">{{user.dieAddress || '未填写'}}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-text" v-if="user.summary && user.summary.length > 0">{{user.summary}}</div>
          <div class="summary-empty" v-else>暂无生平介绍</div>
        </div>
      </div>
    </div>

    <div class="story-list-section" v-if="!configHide('summary')">
      <template v-if="storyNoData">
        <div class="story-empty">暂无生平文章</div>
      </template>
      <template v-else>
        <div class="story-item" v-for="item in storyList" :key="item.id" @click="goStoryDetail(item)">
          <div class="story-item-row">
            <div class="story-item-name">{{item.name}}</div>
            <span class="story-item-arrow">›</span>
          </div>
          <div class="story-item-meta">
            <span class="story-item-creator">{{item.creator && item.creator.name}}</span>
            <span class="story-item-date">{{item.createDate | timesToDate('yyyy-MM-dd HH:mm')}}</span>
          </div>
        </div>
      </template>
    </div>

    <div class="operate-wrapper" v-if="false">
      <div class="share" @click="goShare">
        <img src="~@/modules/images/share.svg" />
      </div>
      <div class="audio anim" :class="{'playing':playState === 'play'}" @click="toggleBgmBtn" >
        <img src="~@/modules/images/music.svg" />
      </div>
      <div class="summary" @click="goSummary">
        <img src="~@/modules/images/shengping.svg" />
      </div>
      <div class="more" @click="goMoreOperate">
        <img src="~@/modules/images/more.svg" />
      </div>
      <div class="back-home" @click="goBack">
        <img src="~@/modules/images/back.svg" />
      </div>
    </div>
    <div class="operate-wrapper" v-if="isSpaceCreator">
      <div class="more" @click="goMoreOperateV2">
        <img src="~@/modules/images/more.svg" />
      </div>
    </div>
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link} from '@/config/utils'
  import constant from '@/config/constant'
  import ModifyText from '@/modules/widget/modify-text'
  import NewStory from '@/modules/widget/new-story'

    export default {
      name: "InfoTheme",
      props:{
        space:{
          type:Object,
          default:null
        },
        playState:{
          type:String,
          default:''
        }
      },
      data(){
        return{
          actions:[],
          showAction:false,
          storyList:[],
          storyLoading:false,
          storyFinished:false,
          storyNoData:false,
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user',
        }),
        theme(){
          if (this.space.themeId === 'custom'){
            return this.space.customThemeId
          }else{
            return this.getPresetTheme(this.space.themeId)
          }
        },
        isSpaceCreator(){
          let result = false
          let currentUserId = this.user.id
          if (this.space && currentUserId === this.space.creatorId){
            result = true
          }
          return result
        },
        isSpaceFriend(){
          let result = false

          if (this.space && this.space.config && this.space.config.friendIds && this.space.config.friendIds.length > 0){
            let index = this.space.config.friendIds.findIndex(item=>item === this.user.id)
            if (index > -1){
              result = true
            }
          }

          return result
        },
        canShareFriend(){
          let result = false
          //如果是亲属馆，同时是创建人或者亲属成员
          if (this.space.type === 0 && (this.isSpaceCreator || this.isSpaceFriend)){
            result = true
          }

          return result
        },
        combineAvatarUrl(){
          let url = ''

          for (let i = 0; i < this.space.spaceUsers.length; i++) {
            let user = this.space.spaceUsers[i]
            if (user && user.avatarUrl){
              url = user.avatarUrl
              break
            }
          }

          return url
        },
        showExitSpace(){
          //是创建者，不能退出纪念馆
          if (this.isSpaceCreator){
            return false
          }
          let result = false
          //亲属馆才有退出一说
          if (this.space && this.space.type === 0){
            let index = this.space.config.friendIds.findIndex(item => item === this.user.id)
            if (index > -1) { //找到了，那就说明是亲友
              result = true
            }
          }
          return result
        }
      },
      methods:{
        ...mapActions({
          updateSpaceUser:'spaceStore/updateSpaceUser'
        }),
        configHide(type){
          let result = false
          if (this.space && this.space.themeId === 'custom' && this.space.customThemeId){
            let theme = this.space.customThemeId
            if (theme){
              result = theme.config.findIndex(item=>item===type) === -1
            }
          }

          return result
        },
        goEditUser(user){
          this.actions = [{
            name: '逝者基本信息',
            id: 'base',
            data: user
          },{
            name: '逝者生平',
            id: 'summary',
            data: user
          }]
          this.showAction = true
          this.$emit('action-changed', {actions: this.actions, showAction: this.showAction})
        },
        modifySummary(user, summary){
          user.summary = summary
          this.updateSpaceUser({sid: this.space.id, user}).then(() => {

          }).catch(() => {
            this.$toast('修改失败，请稍后重试')
          })
        },
        getStoryList(){
          let params = {
            start: 0,
            limit: 20,
            type: 'LIFE_EXPERIENCE'
          }
          $API.space.getSpaceStoryList(this.space.id, params, rsp => {
            this.storyLoading = false
            this.storyList = rsp.result || []
            this.storyFinished = true
            this.storyNoData = this.storyList.length === 0
          }, error => {
            this.storyLoading = false
            this.storyFinished = true
          })
        },
        onStoryDeleted(storyId){
          //文章被删除后，先本地过滤，再重新拉取，避免列表残留
          if (storyId !== undefined && storyId !== null && this.storyList){
            this.storyList = this.storyList.filter(item => item.id !== storyId)
            this.storyNoData = this.storyList.length === 0
          }
          if (this.space && this.space.id){
            this.getStoryList()
          }
        },
        goNewStory(){
          NewStory({
            spaceId: this.space.id,
            callback: () => {
              this.getStoryList()
            }
          })
        },
        goStoryDetail(item){
          Link(`/space/story/${item.id}`)
        },
        goMoreOperate(){
          let user = this.user
          this.actions = []
          // if (this.canShareFriend){
          //   this.actions.push({
          //     name: '发送给亲属',
          //     id:'add_friends',
          //   })
          // }

          // this.actions.push({
          //   name: '发送给朋友',
          //   id:'space_detail',
          // })
          if (this.isSpaceCreator){
            this.actions.push({
              name: '发起云追悼会（讣告）',
              id:'meeting',
              data:user
            })
            this.actions.push({
              name: '纪念馆样式',
              id:'style',
              data:user
            })
            this.actions.push({
              name: '修改纪念馆',
              id:'modify_space',
              data:user
            })
            this.actions.push({
              name: '设置',
              id:'setting',
              data:user
            })
          }
          if (this.showExitSpace){
            this.actions.push({
              name: '退出纪念馆',
              id:'exit'
            })
          }
          if (!this.isSpaceCreator){
            this.actions.push({
              name: '举报',
              id:'report',
              data:user
            })
          }

          this.showAction = true
          this.$emit('action-changed',{actions:this.actions,showAction:this.showAction})
        },
        goMoreOperateV2(){
          let user = this.user
          this.actions = []

          if (this.isSpaceCreator){
            this.actions.push({
              name: '新增生平文章',
              id:'new_story',
              data:user
            })
          }

          this.actions.push({
            name: '纪念馆样式',
            id:'style',
            data:user
          })
          this.actions.push({
            name: '修改纪念馆',
            id:'modify_space',
            data:user
          })

          this.showAction = true
          this.$emit('action-changed',{actions:this.actions,showAction:this.showAction})
        },
        onActionSelect(item) {
          this.showAction = false
          this.$emit('action-changed', {showAction: this.showAction})

          let menu = item.id
          let user = item.data

          switch (menu) {
            case 'meeting':
              Link(`/space/meeting/${this.space.id}`)
              break
            case 'new_story':
              this.goNewStory()
              break
            case 'setting':
              Link(`/space/manage/${this.space.id}?active=setting`)
              break
            case 'add_friends':
            case 'space_detail':
              this.shareSpace(menu)
              break
            case 'modify_space':
              Link(`/space/create?space_id=${this.space.id}`)
              break
            case 'style':
              Link(`/space/theme?theme_id=${this.space.themeId}&space_id=${this.space.id}`)
              break
            case 'report':
              Link(`/report?type=space&subject_id=${this.space.id}`)
              break
            case 'exit':
              this.exitSpace()
              break
            case 'base':
              localStorage.setItem(constant.KEY_EDIT_USER_INFO, JSON.stringify(user))
              Link(`/user_edit?space_id=${this.space.id}&avatar_type=${this.space.combineImage}`)
              break
            case 'summary':
              ModifyText({
                content: user.summary,
                multiline: true,
                placeholder: '请输入生平简介',
                callback: data => {
                  this.modifySummary(user, data)
                }
              })
              break
          }
        },
        onActionClose(){
          this.showAction = false
          this.$emit('action-changed',{showAction:this.showAction})
        },
        shareSpace(from){
          let extra = {}

          extra.origin_from = from
          extra.invite_user_id = this.user.id
          extra.space_id = this.space.id
          extra.space_name = this.space.name

          extra = JSON.stringify(extra)

          localStorage.setItem(constant.KEY_EXTRA_DATA,extra)
          Link(`/share`)
        },
        exitSpace(){
          this.$dialog.confirm({
            message: `确认退出该纪念馆吗?`
          }).then(() => {
            $API.space.exitSpace({sid:this.space.id,userId:this.user.id},rsp=>{
              eventHub.$emit(constant.EVENT_EXIT_SPACE_SUCCESS,this.space.id)
              this.$router.go(-1)
            })
          }).catch(() => {

          })
        },
        goSummary(){
          Link(`/space/summary?space_id=${this.space.id}`)
        },
        goBack(){
          this.$router.back()
        },
        toggleBgmBtn(){
          this.$emit('bgm-click')
        },
        updateTheme(theme){

          let params = {
            sid:this.space.id,
            themeId:theme.uuid
          }
          if (theme.uuid === 'custom'){
            this.space.customThemeId = theme
            params.customTheme = JSON.stringify(theme)
          }
          this.space.themeId = theme.uuid

          $API.space.updateSpaceTheme(params,rsp=>{

          },error=>{

          })
        },
        goShare(){
          this.actions = []
          if (this.canShareFriend){
            this.actions.push({
              name: '发送给亲属',
              id:'add_friends',
            })
          }

          this.actions.push({
            name: '发送给朋友',
            id:'space_detail',
          })

          if (this.actions.length > 1){
            this.showAction = true
            this.$emit('action-changed',{actions:this.actions,showAction:this.showAction})
          }else{
            this.shareSpace('space_detail')
          }
        }
      },
      created() {
        eventHub.$on(constant.EVENT_SELECT_THEME,this.updateTheme)
        eventHub.$on(constant.EVENT_SPACE_STORY_DELETED,this.onStoryDeleted)
        if (this.space && this.space.id){
          this.getStoryList()
        }
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_SELECT_THEME,this.updateTheme)
        eventHub.$off(constant.EVENT_SPACE_STORY_DELETED,this.onStoryDeleted)
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .info-theme-container{
    height: 100%;
    overflow-y: scroll;
    background-size: cover;
    background-repeat: no-repeat;
    .base-info-wrapper{
      margin-top: 20%;
      .combine-avatar{
        display: flex;
        justify-content: center;
        .avatar{
          width: 244px;
          height: 157px;
          margin:0 5px;
        }
        .placeholder{
          border: 2px solid @MAIN_THEME_COLOR;
          width: 244px;
          height: 157px;
          margin:0 5px;
        }
      }
      .user-wrapper{
        display: flex;
        justify-content:center;
        padding:10px 0px;

        .user{
          .avatar-wrapper{
            .avatar{
              width: 122px;
              height: 157px;
              margin:0 5px;
            }
            .placeholder{
              border: 2px solid @MAIN_THEME_COLOR;
              width: 122px;
              height: 157px;
              margin:0 5px;
            }
          }
          .hide{
            opacity: 0 !important;
          }
        }
      }
      .epitaph-wrapper{
        text-align: center;
        margin: 0px 60px;
        max-height: 140px;
        overflow: auto;
        font-size: 14px;
        color: @FONT_WHITE_COLOR;
        text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -1px 0 0, #000 0 -1px 0;
        &.hide{
          opacity: 0 !important;
        }
      }
    }
    .summary-section{
      margin: 28px 0px 28px;
      .summary-section-title{
        position: relative;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 16px;
        text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -1px 0 0, #000 0 -1px 0;
        &::before, &::after{
          content: '';
          display: inline-block;
          width: 28px;
          height: 1px;
          background: rgba(255,255,255,0.6);
          vertical-align: middle;
          margin: 0 10px;
        }
      }
      .summary-card{
        background: #fff;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 14px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
        color: @FONT_FIRST_COLOR;
        .summary-card-header{
          text-align: center;
          padding-bottom: 10px;
          margin-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .summary-card-name{
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          .summary-card-edit{
            font-size: 14px;
            color: @MAIN_THEME_COLOR;
            margin-left: 6px;
            padding: 2px 4px;
          }
        }
        .summary-card-date{
          font-size: 13px;
          color: @FONT_THIRD_COLOR;
          letter-spacing: 0.5px;
        }
        .summary-card-body{
          font-size: 14px;
          line-height: 1.7;
          color: @FONT_SECOND_COLOR;
          .summary-row{
            display: flex;
            align-items: flex-start;
            padding: 3px 0;
            .summary-label{
              flex: 0 0 64px;
              color: @FONT_THIRD_COLOR;
            }
            .summary-value{
              flex: 1;
              word-break: break-all;
            }
          }
          .summary-divider{
            height: 1px;
            background: #eee;
            margin: 10px 0;
          }
          .summary-text{
            white-space: pre-wrap;
            word-break: break-all;
            color: @FONT_SECOND_COLOR;
          }
          .summary-empty{
            color: @FONT_THIRD_COLOR;
            font-style: italic;
          }
        }
      }
    }
    .story-list-section{
      margin: 0 0px 80px;
      .story-section-title{
        position: relative;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 16px;
        text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -1px 0 0, #000 0 -1px 0;
        &::before, &::after{
          content: '';
          display: inline-block;
          width: 28px;
          height: 1px;
          background: rgba(255,255,255,0.6);
          vertical-align: middle;
          margin: 0 10px;
        }
      }
      .story-empty{
        background: #fff;
        border-radius: 10px;
        padding: 24px 16px;
        text-align: center;
        color: @FONT_THIRD_COLOR;
        font-size: 14px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
      }
      .story-item{
        background: #fff;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
        .story-item-row{
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .story-item-name{
          font-size: 15px;
          font-weight: bold;
          color: @FONT_FIRST_COLOR;
          flex: 1;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          margin-right: 8px;
        }
        .story-item-meta{
          margin-top: 6px;
          font-size: 12px;
          color: @FONT_THIRD_COLOR;
          display: flex;
          align-items: center;
          line-height: 1.5;
          .story-item-creator{
            margin-right: 10px;
          }
        }
        .story-item-arrow{
          flex: 0 0 auto;
          color: @FONT_THIRD_COLOR;
          font-size: 20px;
          line-height: 1;
        }
      }
    }
    .operate-wrapper{
      position: absolute;
      bottom: 50px;
      right: 8px;
      width: 44px;
      height: 140px;
      .audio,.summary,.more,.back-home,.share{
        position: absolute;
        width: 36px;
        height: 36px;
        img{
          width: 100%;
          height: 100%;
        }
      }
      .audio{
        bottom:160px;
        &.anim{
          animation: rotate 3s linear infinite;
          animation-play-state:paused;
          @keyframes rotate{from{transform: rotate(0deg);transform-origin:50% 50%;}
            to{transform: rotate(359deg);transform-origin:50% 50%;}
          }
        }
        &.playing{
          animation-play-state:running;
        }
      }
      .more{
        bottom: 0px;
      }
      .summary{
        bottom: 110px;
      }
      .back-home{
        bottom:10px;
      }
      .share{
        bottom: 210px;
      }
    }
  }
</style>

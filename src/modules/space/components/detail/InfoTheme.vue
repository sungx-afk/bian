<template>
  <!-- 主题背景图暂时去掉（原:background-image:url(theme.url)），需要时恢复这一行即可
  <div class="info-theme-container" :style="{'background-image':`url(${theme.url})`}"> -->
  <div class="info-theme-container">
    <!-- 返回按钮 -->
    <div class="back-btn" @click.stop="goBack" aria-label="返回">
      <i class="chevron"></i>
    </div>

    <!-- 顶部：遗像与基本信息（墨色底，庄重素雅） -->
    <div class="hero">
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
        <span class="epitaph-label">墓志铭：</span>{{space && space.epitaph}}
      </div>
      </div>
    </div>

    <div class="summary-section" v-if="space.spaceUsers && space.spaceUsers.length > 0 && !configHide('summary')">
      <div class="summary-card" v-for="user in space.spaceUsers" :key="user.id">
        <div class="summary-card-header">
          <div class="summary-card-name">
            {{user.name}}
            <!-- 直接进基本信息编辑，不再弹底部菜单 -->
            <span class="iconfont icon-bianji summary-card-edit" v-if="isSpaceCreator" @click.stop="goEditUserBase(user)"></span>
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
          <div class="summary-text-row">
            <div class="summary-text" v-if="user.summary && user.summary.length > 0">{{user.summary}}</div>
            <div class="summary-empty" v-else>暂无生平介绍</div>
            <!-- 直接编辑生平简介 -->
            <span class="iconfont icon-bianji summary-inline-edit" v-if="isSpaceCreator" @click.stop="editSummary(user)" aria-label="编辑生平"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="story-list-section" v-if="!configHide('summary')">
      <!-- 生平文章：创建者可直接新增/编辑，不再走底部菜单 -->
      <div class="story-head" v-if="isSpaceCreator">
        <span class="story-head-title">生平文章</span>
        <!-- 生平文章可以有多篇，这里是「添加」 -->
        <span class="story-head-add" @click.stop="goNewStory" aria-label="添加生平文章"><i></i></span>
      </div>
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
        // 直接进逝者基本信息编辑页
        goEditUserBase(user){
          localStorage.setItem(constant.KEY_EDIT_USER_INFO, JSON.stringify(user))
          Link(`/user_edit?space_id=${this.space.id}&avatar_type=${this.space.combineImage}`)
        },
        // 直接编辑生平简介
        editSummary(user){
          ModifyText({
            content: user.summary,
            multiline: true,
            placeholder: '请输入生平简介',
            callback: data => {
              this.modifySummary(user, data)
            }
          })
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
            this.actions.push({
              name: '墓志铭',
              id:'epitaph',
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
            case 'epitaph':
              Link(`/space/epitaph/${this.space.id}`)
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
    background-color: #f6f5f1;   // 暖纸色

    // 返回按钮：固定左上，44px 触控区
    .back-btn{
      position: absolute;
      top: 14px;
      left: 14px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      cursor: pointer;
      transition: background 0.2s;
      .chevron{
        width: 12px;
        height: 12px;
        border-left: 2px solid #fff;
        border-bottom: 2px solid #fff;
        transform: rotate(45deg);
        margin-left: 5px;
      }
      &:active{
        background: rgba(255, 255, 255, 0.26);
      }
    }

    // 顶部墨色区：庄重素雅，头像后一圈暖金微光
    .hero{
      position: relative;
      background: linear-gradient(180deg, @MAIN_THEME_COLOR 0%, #5b3c17 100%);
      padding: 56px 16px 26px;
      &::before{
        content: '';
        position: absolute;
        top: 60px;
        left: 50%;
        width: 240px;
        height: 240px;
        transform: translateX(-50%);
        background: radial-gradient(circle, fade(@SECOND_THEME_COLOR, 35%) 0%, fade(@SECOND_THEME_COLOR, 0%) 70%);
        pointer-events: none;
      }
      .base-info-wrapper{
        position: relative;
        max-width: 560px;
        margin: 0 auto;
      }
    }

    .base-info-wrapper{
      margin-top: 0;
      .combine-avatar{
        display: flex;
        justify-content: center;
        .avatar{
          width: 244px;
          height: 157px;
          margin:0 5px;
          border: 2px solid @SECOND_THEME_COLOR;
          border-radius: 6px;
          background: #14171f;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
        }
        .placeholder{
          border: 2px solid @SECOND_THEME_COLOR;
          border-radius: 6px;
          background: #14171f;
          width: 244px;
          height: 157px;
          margin:0 5px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
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
              border: 2px solid @SECOND_THEME_COLOR;
              border-radius: 6px;
              background: #14171f;
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
            }
            .placeholder{
              border: 2px solid @SECOND_THEME_COLOR;
              border-radius: 6px;
              background: #14171f;
              width: 122px;
              height: 157px;
              margin:0 5px;
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
            }
          }
          .hide{
            opacity: 0 !important;
          }
        }
      }
      .epitaph-wrapper{
        text-align: center;
        margin: 18px 30px 0;
        .epitaph-label{
          color: @SECOND_THEME_COLOR;
          font-size: 13px;
          letter-spacing: 1px;
        }
        max-height: 140px;
        overflow: auto;
        font-size: 14px;
        line-height: 1.8;
        color: rgba(255, 255, 255, 0.88);
        letter-spacing: 1px;
        &.hide{
          opacity: 0 !important;
        }
      }
    }
    .summary-section{
      margin: 20px auto 24px;
      max-width: 560px;
      padding: 0 12px;
      box-sizing: border-box;
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
        padding: 14px 16px;
        margin-bottom: 14px;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(31, 35, 48, 0.08);
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
          .summary-text-row{
            display: flex;
            align-items: flex-start;
            .summary-text,
            .summary-empty{
              flex: 1;
            }
            .summary-inline-edit{
              flex: 0 0 auto;
              margin: 2px 0 0 8px;
              font-size: 14px;
              color: @MAIN_THEME_COLOR;
              cursor: pointer;
            }
          }
        }
      }
    }
    .story-list-section{
      margin: 0 auto 80px;
      max-width: 560px;
      padding: 0 12px;
      box-sizing: border-box;
      .story-head{
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 4px 10px;
        .story-head-title{
          font-size: 15px;
          font-weight: bold;
          color: @FONT_FIRST_COLOR;
        }
        // 「添加」按钮：生平文章可以有多篇
        .story-head-add{
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: @MAIN_THEME_COLOR;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 0.2s;
          i{
            position: relative;
            display: block;
            width: 12px;
            height: 12px;
            &::before,
            &::after{
              content: '';
              position: absolute;
              background: #fff;
            }
            &::before{ left: 5px; top: 0; width: 2px; height: 12px; }
            &::after{ left: 0; top: 5px; width: 12px; height: 2px; }
          }
          &:active{
            opacity: 0.8;
          }
        }
      }
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
        padding: 24px 16px;
        text-align: center;
        color: @FONT_THIRD_COLOR;
        font-size: 14px;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(31, 35, 48, 0.08);
      }
      .story-item{
        background: #fff;
        border-radius: 12px;
        padding: 13px 14px 13px 16px;
        margin-bottom: 10px;
        box-shadow: 0 2px 12px rgba(31, 35, 48, 0.08);
        border-left: 3px solid @SECOND_THEME_COLOR;   // 暖金竖条，和品牌呼应
        transition: box-shadow 0.2s, transform 0.2s;
        cursor: pointer;
        &:active{
          transform: scale(0.99);
        }
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
        background: @MAIN_THEME_COLOR;
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        img{
          width: 20px;
          height: 20px;
          margin: 8px;
        }
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

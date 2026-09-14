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

          <div class="name-wrapper" :class="{hide:configHide('info'),combine:space.combineImage === 1}">
            <div class="name" :style="{color:theme.color}">{{user.name}}</div>
            <div class="date" :style="{color:theme.dateColor}">
              <span>{{user.birthday | timesToDate('yyyy')}}</span>
              -
              <span>{{user.dieDay | timesToDate('yyyy')}}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="epitaph-wrapper" v-if="space.epitaph && !configHide('epitaph')" :style="{color:theme.epitaphColor}">
        {{space && space.epitaph}}
      </div>
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
  </div>
</template>

<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'
  import constant from '@/config/constant'

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
        onActionSelect(item) {
          this.showAction = false
          this.$emit('action-changed', {showAction: this.showAction})

          let menu = item.id
          let user = item.data

          switch (menu) {
            case 'meeting':
              Link(`/space/meeting/${this.space.id}`)
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
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_SELECT_THEME,this.updateTheme)
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
          .name-wrapper{
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
            &.combine{
              padding: 0px 20px;
            }
            .name{
              font-size: 18px;
              font-weight: bold;
              color: @FONT_WHITE_COLOR;
              text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -1px 0 0, #000 0 -1px 0;
            }
            .date{
              font-size: 15px;
              color: @FONT_WHITE_COLOR;
              margin-top: 8px;
              text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -0.5px 0 0, #000 0 -1px 0;
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
        bottom: 60px;
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

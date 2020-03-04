<template>
  <div class="info-theme-container" :style="{'background-image':`url(${theme.url})`}">
    <div class="base-info-wrapper">
      <div class="user-wrapper">
        <div class="user" v-for="user in space.spaceUsers" :key="user.id">
          <img class="avatar" v-if="user.avatarUrl" :src="user.avatarUrl" />
          <div class="placeholder" v-else>

          </div>
          <div class="name-wrapper">
            <div class="name" :style="{color:theme.color}">{{user.name}}</div>
            <div class="date" :style="{color:theme.dateColor}">
              <span>{{user.birthday | timesToDate('yyyy')}}</span>
              -
              <span>{{user.dieDay | timesToDate('yyyy')}}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="epitaph-wrapper" :style="{color:theme.epitaphColor}">
        {{space && space.epitaph}}
      </div>
    </div>
    <div class="operate-wrapper">
      <div class="audio anim" :class="{'playing':playState === 'play'}" @click="toggleBgmBtn" >
        <img src="~@/modules/images/music.svg" />
      </div>
      <div class="summary" @click="goSummary">
        <img src="~@/modules/images/shengping.svg" />
      </div>
      <div class="more" @click="goMoreOperate">
        <img src="~@/modules/images/more.svg" />
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
          return this.getOneTheme(this.space.themeId)
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
      },
      methods:{
        goMoreOperate(){
          let user = this.user
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
          if (this.isSpaceCreator){
            this.actions.push({
              name: '发起云追悼会',
              id:'meeting',
              data:user
            })
            // this.actions.push({
            //   name: '编辑生平',
            //   id:'modify_summary',
            //   data:user
            // })
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
              Link(`/space/manage/${this.space.id}`)
              break
            case 'add_friends':
            case 'space_detail':
              this.shareSpace(menu)
              break
            case 'modify_space':

              break
            case 'modify_summary':
              break
            case 'report':
              Link(`/report/category`)
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
          extra = JSON.stringify(extra)

          localStorage.setItem(constant.KEY_EXTRA_DATA,extra)
          Link(`/share`)
        },
        goSummary(){
          Link(`/space/summary?space_id=${this.space.id}`)
        },
        toggleBgmBtn(){
          this.$emit('bgm-click')
        }
      },
      created() {

      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .info-theme-container{
    height: 100%;
    overflow-y: scroll;
    background-size: 100%,100%;
    .base-info-wrapper{
      margin-top: 100px;
      .user-wrapper{
        display: flex;
        justify-content:center;
        padding:10px 0px;
        .user{
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
          .name-wrapper{
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
            .name{
              font-size: 17px;
              font-weight: bold;
            }
            .date{
              font-size: 14px;
              color: @FONT_THIRD_COLOR;
              margin-top: 8px;
            }
          }
        }
      }
      .epitaph-wrapper{
        text-align: center;
        padding: 0px 40px;
        max-height: 180px;
        overflow: scroll;
        font-size: 15px;
        color: @FONT_SECOND_COLOR;
      }
    }
    .operate-wrapper{
      position: absolute;
      bottom: 50px;
      right: 12px;
      width: 48px;
      height: 140px;
      .audio,.summary,.more{
        position: absolute;
        right: 14px;
        width: 32px;
        height: 32px;
        img{
          width: 100%;
          height: 100%;
        }
      }
      .audio{
        bottom:100px;
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
        bottom: 20px;
      }
      .summary{
        bottom: 60px;
      }
    }
  }
</style>

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
      <div class="beiwen-wrapper" :style="{color:theme.beiwenColor}">
        {{space && space.beiwen}}
      </div>
    </div>
    <div class="operate-wrapper">
      <slot></slot>
      <div class="summary iconfont icon-zhankai" @click="goSummary"></div>
      <div class="more iconfont icon-zhankai" @click="goMoreOperate"></div>
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
        }
      },
      created() {
        this.space.beiwen = "当我年轻的时候，我的想象力从没有受到过限制，我梦想改变这个世界。"
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
      .beiwen-wrapper{
        text-align: left;
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
      .audio{
        bottom: 100px;
      }
      .more{
        font-size: 24px;
        position: absolute;
        bottom: 20px;
        right: 14px;
        color: @MAIN_THEME_COLOR;
        font-weight: bold;
      }
      .summary{
        font-size: 24px;
        position: absolute;
        bottom: 60px;
        right: 14px;
        color: @MAIN_THEME_COLOR;
        font-weight: bold;
      }
    }
  }
</style>

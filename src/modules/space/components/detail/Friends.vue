<template>
  <div class="friends-container">
    <van-cell is-link class="members-cell" @click="goMemberManage" center>
      <div class="members-area" v-if="space">
        <div class="members-title">
          <template v-if="space.config.friends.length > 0">
            亲属成员 {{space.config.friends.length}} 个
          </template>
          <template v-else>还未添加亲属成员</template>
        </div>
        <div class="members-body">
          <img class="member-avatar" v-for="item in space.config.friends" :key="item.id" :src="item.avatarUrl" />
        </div>
      </div>
    </van-cell>
    <issue-list :space="space" :type="type"></issue-list>
  </div>
</template>

<script>
  import IssueList from '../issue/IssueList'
  import {Link} from '@/config/utils'

  import constant from '@/config/constant'

    export default {
      name: "Friends",
      props:{
        space:{
          type:Object,
          default:null
        },
        type:{
          type:String,
          default:''
        }
      },
      components:{
        IssueList
      },
      methods:{
        goMemberManage(){
          Link(`/space/friends/${this.space.id}`)
        },
        updateFriends(uid){
          let index = this.space.config.friends.findIndex(some=>some.id === uid)
          if (index > -1){
            this.space.config.friends.splice(index,1)
          }
        }
      },
      created() {
        eventHub.$on(constant.EVENT_DELETE_FRIENDS_SUCCESS,this.updateFriends)
      },
      beforeDestroy() {
        eventHub.$off(constant.EVENT_DELETE_FRIENDS_SUCCESS,this.updateFriends)
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .friends-container{
    height: 100%;
    overflow-y: auto;
    .members-cell{
      height: 80px;
      .members-area{
        display:flex;
        flex-direction:column;
        .members-title{
          display: flex;
          font-size: 13px;
          color: @FONT_THIRD_COLOR;
          padding:5px 10px;
        }
        .members-body{
          padding: 0 5px;
          display:flex;
          align-items:center;
          .member-avatar{
            width:20px;
            height:20px;
            border-radius:10px;
            margin:0 5px;
          }
        }
      }
    }
  }
</style>

<template>
  <div class="message-container">
    <van-cell is-link custom-class="members-cell" @click="goMemberManage" center>
      <div class="members-area" v-if="space">
        <div class="members-title">
          亲属成员{{space.config.friends.length}}个
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
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .message-container{
    height: 100%;
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
</style>

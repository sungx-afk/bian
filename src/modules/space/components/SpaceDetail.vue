<template>
  <div class="container">
    <div class="container-content" :class="{'iphonex-height':isIPhoneX}">
      <template v-if="tabActive == 0">
        <!--首页-->
        <info v-if="detail" :space="detail" :showMeeting="true" :operate="true"></info>
      </template>
      <template v-if="tabActive == 1">
        <!--留言-->
        <message v-if="detail" :space="detail" type="PUBLIC"></message>
      </template>
      <template v-if="tabActive == 2">
        <!--亲属空间-->
        <friends v-if="detail" :space="detail" type="SPACE"></friends>
      </template>
      <template v-if="tabActive == 3">
        <!--私语-->
        <private v-if="detail" :space="detail" type="PRIVATE"></private>
      </template>
    </div>
    <template v-if="!inputFocus">
      <van-tabbar v-model="tabActive" active-color="#825621" @change="onTabChange">
        <van-tabbar-item v-for="tabBar in tabBarList" :key="tabBar.id" custom-class="tabbar-item">{{tabBar.name}}</van-tabbar-item>
      </van-tabbar>
    </template>
    <div class='send-comment-area' v-if="postComment && false">
      <div class='comment-input-container'>
        <input class='comment-input' value='commentContent' type='text' focus='inputFocus' bindblur='bindCommentBlurEvent' cursor-spacing='80px' placeholder='说点什么吧...'></input>
      </div>
      <div class='send-btn-area'>
        <button class='send-btn' @click.stop='sendCommentDelay'>发送</button>
      </div>
    </div>
    <van-action-sheet
      v-model="showAction"
      :actions="actions"
      @select="onActionSheetSelect"
    ></van-action-sheet>
  </div>
</template>
<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'

  import Info from './detail/Info'
  import Message from './detail/Message'
  import Friends from './detail/Friends'
  import Private from './detail/Private'

  export default{
    data(){
      return {
        spaceId:'',
        detail:'',
        tabBarList:[{
          id:'main',
          name:'首页'
        },{
          id:'message',
          name:'留言'
        },{
          id:'relatives',
          name:'亲属空间'
        },{
          id:'secret',
          name:'私语'
        }],
        messageType:'PUBLIC', //PUBLIC, PRIVATE, SPACE;
        tabActive:0,
        menuList:[],
        currentImageIndex:0,
        isShowMoreMenu:false,
        showMemorialMeeting:false,
        noIssueData:false,
        noMoreData:false,
        loadingMore:false,
        currentIssue:null,
        currentComment:null,//用来实现回复评论
        postComment: false,
        inputFocus: false,
        commentContent:'',
        showAction:false,
        actions:[],
      }
    },
    components: {
      Info,
      Message,
      Friends,
      Private
    },
    computed:{
      isIPhoneX(){
        return false
      },
      isSpaceCreator(){
        return true
      },
      isSpaceMember(){
        return false
      }
    },
    methods:{
      onTabChange(e){
        if (e.detail === 2){ //亲属空间加判断
          if (!this.isSpaceMember && !this.isSpaceCreator){
            this.$toast("您当前还不是该馆亲属成员")
            return
          }
        }
        let messageType = 'PUBLIC'
        if (this.tabActive == 2){//留言
          messageType = 'SPACE'
        }else if(this.tabActive == 3){ //私语
          messageType = 'PRIVATE'
        }
        this.messageType = messageType
      },
      getDetail(cb){
        if (!this.spaceId){
          return
        }
        $API.space.getSpaceDetail({
          sid: this.spaceId,
        }, (rsp)=>{
            let flag = this.checkCanIn(rsp)
            if(flag === -1){
              this.$toast({
                message:'纪念馆已禁止访客进入，请联系馆主进行操作',
                onClose:()=>{
                  this.$router.go(-1)
                }
              })
              return
            }else if(flag === -2){
              this.$toast({
                message:'您无法浏览该馆',
                onClose:()=>{
                  this.$router.go(-1)
                }
              })
              return
            }
            this.detail = rsp
            cb && cb()
          }, error=>{

          })
      },
      checkCanIn(space){
        let result = 0
        //如果是开启了仅亲属进入，同时当前用户又不在亲属空间返回-1
        //如果没有开启仅亲属进入，判断当前用户是否在黑名单用户，如果是返回-2
        let currentUserId = 1000738
        if (currentUserId === space.creatorId){ //创建者永远能进入
          result = 0
        }else if (space.config.viewScope == 'member'){
          let index = space.config.friendIds.findIndex(id=>id === currentUserId)
          if (index === -1){ //如果没有找到，说明不在好友列表
            result = -1
          }else{
            let index = space.config.blackListIds.findIndex(id=>id === currentUserId)
            if (index > -1){ //找到了，则说明在黑名单里
              result = -2
            }
          }
        }else{
          let index = space.config.blackListIds.findIndex(id=>id === currentUserId)
          if (index > -1){ //找到了，则说明在黑名单里
            result = -2
          }
        }
        return result
      },
      initShowMemorialMeeting(){

      },
      registerEvent(){

      },
      onActionSheetSelect(e){
        this.showAction = false
        let menu = e.detail.id
        let user = e.detail.data

        if (menu === 'base'){

        }else if (menu === 'summary'){

        }
      },
    },
    created() {
      if(this.$route.params.id){
        this.spaceId = this.$route.params.id
        console.log(this.spaceId)
        this.getDetail(()=>{
          if (this.detail){
            this.initShowMemorialMeeting()
          }
        })
        this.registerEvent()
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .container {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    overflow-y: auto;
    .container-content{
      height: ~'calc(100% - 50px)';
      &.iphonex-height{
        height: ~'calc(100% - 80px)';
      }
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
      .issue-container{
        height: 100%;
        .loading{
          display: flex;
          align-items:center;
          justify-content: center;
          background: @BG_WHITE;
          font-size:12px;
          color:#a9a9a9;
          .text{
            margin-left: 5px;
          }
        }
      }
      .add-issue-btn{
        position:fixed;
        bottom:60px;
        right:20px;
        .add-issue-image{
          width: 50px;
          height: 50px;
        }
        &.x-bottom{
          bottom:90px;
        }
      }
      .private-tip{
        font-size:14px;
        padding:10px;
        background:white;
        color: @MAIN_THEME_COLOR;
      }
    }
    .send-comment-area{
      position:fixed;
      width:100%;
      height:60px;
      left:0px;
      bottom:0px;
      background-color:white;
      display:flex;
      align-items:center;
      border-top:solid 1px @BORDER_COLOR_1;
      .comment-input-container{
        width:70%;
        height:30px;
        border:solid 1px @BORDER_COLOR_1;
        border-radius:4px;
        background-color:white;
        margin: 0 10px;
        padding-left:10px;
        padding-top:6px;
        .comment-input{
          margin-bottom: 50px;
          font-size: 14px;
        }
      }
      .send-btn-area{
        width: 65px;
        height:100%;
        display:flex;
        align-items:center;
        .send-btn{
          color: white;
          height:30px;
          line-height:30px;
          font-size: 14px;
          background-color: @MAIN_THEME_COLOR;
        }
      }
    }
  }

</style>

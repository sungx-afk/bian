<template>
  <div class="story-detail-container" v-if="detail">
    <div class="header">
      <div class="header-top">
        <div class="name">{{ detail.name }}</div>
        <div class="operate-wrapper" v-if="canOperate" @click.stop="goMoreMenu">
          <i class="iconfont icon-gengduo"></i>
        </div>
      </div>
      <div class="header-bottom">
        <div class="creator">{{ detail.creator.name }}</div>
        <div class="create-date">{{ detail.createDate | timeAgo }}</div>
      </div>
    </div>
    <div class="content">
      <div class='story-content' v-if='detail.content'>
        <div class='content-text'>{{detail.content}}</div>
      </div>
      <div class="photo-area" v-if="detail.photos.length > 0">
        <div class='photo-view'>
          <div class='photo' v-for="(photo,index) in detail.photos" :key='photo.url'  @click.stop='imagePressed(index)'>
            <img class='photo-image' :src='photo.thumbnailUrl || photo.url' />
          </div>
        </div>
      </div>
    </div>
    <div class='comment-area'>
      <!-- 评论操作按钮区 -->
      <div class='operate-area' v-if="canComment">
        <i class="comment-reply iconfont icon-pinglun1" @click.stop='goComment'></i>
      </div>
      <div class='inter-area' v-if='commentList && commentList.length > 0'>
        <!-- 评论列表 -->
        <div class='comment-wrapper' v-for="comment in commentList" :key='comment.id' v-if="comment.deleted === 0">
          <div class='comment' @click.stop="commentPressed(comment)">
            <span class='comment-name'>{{comment.creator && comment.creator.name}}
              <span v-if="comment.reply" style="color: #808080;">回复</span>
              <span class="creator-name" v-if="comment.reply">{{comment.reply.creator && comment.reply.creator.name}}</span>
            </span>:
            <span class='comment-content'>{{comment.content}}</span>
          </div>
        </div>
      </div>
    </div>
    <div class='send-comment-area' :class="{'safe-bottom':isIPhoneX}" v-if="postComment">
      <div class='comment-input-container'>
        <van-field class='comment-input' ref="comment" @blur="commentBlur" v-model="commentContent"
                   :placeholder="commentPlaceholder" maxlength="1000"></van-field>
      </div>
      <div class='send-btn-area'>
        <van-button class='send-btn' size="small" type="default" @click.stop='sendCommentDelay'>发送</van-button>
      </div>
    </div>
    <van-popup
      v-model="isShowMoreMenu"
      close-on-popstate>
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';
import constant from '@/config/constant'

import Vue from 'vue';
import { ImagePreview } from 'vant';
Vue.use(ImagePreview);

export default {
  name: 'StoryDetail',
  components: {
  },
  props: {},
  data () {
    return {
      uuid:'',
      detail:null,
      isShowMoreMenu:false,
      menuList:[],
      commentList:[],
      commentTotal:0,
      postComment:false,
      commentContent:'',
      commentPlaceholder:'',
      currentComment:null
    }
  },
  computed: {
    ...mapGetters({
      user: 'userStore/user',
      space:'spaceStore/spaceDetail'
    }),
    isSpaceCreator() {
      let result = false
      let currentUserId = this.user.id
      if (this.space && currentUserId === this.space.creatorId) {
        result = true
      }
      return result
    },
    canDeleteStory(){
      return this.isSpaceCreator || this.detail && this.detail.creatorId == this.user.id
    },
    canOperate(){
      return this.canDeleteStory
    },
    canComment() {
      let result = true
      let currentUserId = this.user.id
      if (this.space && currentUserId !== this.space.creatorId && this.space.config.commentScope == 'member') {
        let index = this.space.config.friendIds.findIndex(item => item === currentUserId)
        if (index === -1) { //如果没有找到，说明不在好友列表
          result = false
        }
      }
      return result
    },
  },
  watch: {},
  methods: {
    getStoryDetail(){
      return new Promise((resolve,reject)=>{
        $API.space.getSpaceStoryDetail({sid:this.space.id,cid:this.uuid},rsp=>{
          this.detail = rsp
          resolve()
        },error=>{
          reject(error)
        })
      })
    },
    getCommentList(start = 0){
      if (this.commentLoading){
        return
      }
      this.commentLoading = true
      let params = {
        subject_id:this.uuid,
        start,
        limit:200
      }
      $API.space.getComments(params,rsp=>{
        this.commentLoading = false
        if (0 === start){
          // this.commentTotal = rsp.total
          this.commentList = rsp
        }else{
          this.commentList = this.commentList.concat(rsp)
        }
      },error=>{
        this.commentLoading = false
      })
    },
    loadMoreComment(){
      if (!this.commentLoading && this.commentList.length < this.commentTotal){
        this.getCommentList(this.commentList.length)
      }
    },
    goMoreMenu(){
      this.menuList = []
      if (this.canDeleteStory){
        this.menuList.push({
          id:'delete_story',
          name:'删除文章'
        })
      }
      this.isShowMoreMenu = true
    },
    moreMenuPressed(menu){
      this.isShowMoreMenu = false
      switch (menu.id) {
        case 'delete_story':
          this.deleteStory()
          break
        case 'delete_comment':
          this.doDeleteComment(menu.data)
          break
        case 'reply_comment':
          this.replyComment(menu.data)
          break
      }
    },
    deleteStory(){
      this.$dialog.confirm({
        message: `确认删除该文章吗?`
      }).then(() => {
        $API.space.deleteSpaceStory({sid:this.space.id,cid:this.uuid},rsp=>{
          eventHub.$emit(constant.EVENT_SPACE_STORY_DELETED)
          this.$router.go(-1)
        })
      }).catch(() => {

      })
    },
    imagePressed(index){
      let plat = getPlat()
      if (plat === 'web'){
        window.open(this.detail.photos[index].url)
      }else{
        let images = this.detail.photos.map(item=>{
          return item.url
        })
        ImagePreview({
          images: images,
          startPosition: index,
          onClose() {
            // do something
          }
        });
      }
    },
    checkMyComment(comment) {
      return comment.creatorId === this.user.id
    },
    commentBlur() {
      this.commentTimer = setTimeout(() => {
        this.postComment = false
        this.commentTimer = null
      }, 200)
    },
    clearCommentTimer(){
      if (this.commentTimer){
        clearTimeout(this.commentTimer)
      }
    },
    goComment(){
      this.clearCommentTimer()
      this.commentPlaceholder = '说点什么吧...'
      this.postComment = true
      this.$nextTick(() => {
        this.$refs.comment.focus()
      })
    },
    commentPressed(comment){
      if (this.checkMyComment(comment)) {
        if (this.postComment) {
          return
        }
        this.menuList = [{
          id: 'delete_comment',
          name: '删除评论',
          data: comment
        }]
        this.isShowMoreMenu = true
      } else {
        //如果是馆主，就回复和删除，如果能回复，就回复
        if (this.isSpaceCreator){
          this.menuList = [
            {
              id: 'reply_comment',
              name: '回复评论',
              data: comment
            },{
              id: 'delete_comment',
              name: '删除评论',
              data: comment
            }]
        }else {
          this.menuList = []
          if (this.canComment){
            this.menuList.push({
              id: 'reply_comment',
              name: '回复评论',
              data: data
            })
          }
        }
        if (this.menuList.length > 0){
          this.isShowMoreMenu = true
        }
      }
    },
    doDeleteComment(comment) {
      let that = this
      let sid = that.space.id
      let cid = comment.id
      $API.space.deleteComment({
        sid,
        cid
      }, rsp => {
        let index = this.commentList.findIndex(some=>some.id == comment.id)
        if (index > -1){
          this.commentList.splice(index,1)
        }
      }, error => {

      })
    },
    replyComment(comment){
      this.clearCommentTimer()
      this.currentComment = comment
      this.commentPlaceholder = '回复 '
      if (this.currentComment.creator && this.currentComment.creator.name){
        this.commentPlaceholder += this.currentComment.creator.name
      }
      this.postComment = true
      this.$nextTick(() => {
        this.$refs.comment.focus()
      })
    },
    sendCommentDelay() {
      setTimeout(() => {
        this.sendComment()
      }, 200)
    },
    sendComment() {
      let that = this
      let content = that.commentContent

      if (!content) {
        return
      }

      let data = {}
      if (that.currentComment) {
        let reply = {}
        reply.commentId = that.currentComment.id
        data.reply = reply
      }

      data.type = 'COMMENT' //发表评论
      data.content = content
      data.status = 'PASS'

      $API.space.sendComment({
        sid:this.uuid,
        data: data
      }, comment => {
        this.commentList.unshift(comment)
      }, error => {
        console.log(error)
      })
    },
  },
  created () {
    if (this.$route.params.id){
      this.uuid = this.$route.params.id
    }
    this.getStoryDetail().then(()=>{
      this.getCommentList()
    })
  },
  mounted () {
  },
  beforeDestroy(){
  }
}
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .story-detail-container{
    height: 100%;
    width: 100%;
    padding: 15px;
    box-sizing: border-box;
    overflow-y: auto;
    .header{
      .header-top{
        display: flex;
        align-items: center;
        .name{
          font-size: 16px;
          font-weight: bold;
          width: 0;
          flex-grow: 1;
          margin-right: 12px;
        }
        .operate-wrapper{
          margin-left: auto;
        }
      }
      .header-bottom{
        display: flex;
        align-items: center;
        height: 24px;
        .creator{
          font-size: 12px;
          color: @FONT_FOUR_COLOR;
          margin-right: 8px;
        }
        .create-date{
          font-size: 12px;
          color: @FONT_FOUR_COLOR;
        }
      }
    }
    .content{
      margin-top: 20px;
      .story-content{
        color:@FONT_SECOND_COLOR;
        font-size:16px;
        height:100%;
        margin: 5px 0px;
        word-wrap:break-word;
        .content-text{
          user-select: auto;
          -webkit-user-select:auto;
          -khtml-user-select:auto;
          -moz-user-select:auto;
          -ms-user-select:auto;
        }
      }
      .photo-area{
        margin-top: 12px;
        .photo-view{
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          .photo{
            width: 30%;
            height: 0; //保持和宽度一样
            padding-bottom: 30%;
            margin-right: 8px;
            margin-bottom: 8px;
            position: relative;
            .photo-image{
              width: 100%;
              height: 100%;
              position: absolute;
              top: 0;
              left: 0;
            }
          }
        }
      }
    }
    /* 评论区 */
    .comment-area {
      width: 100%;
      margin-top:5px;
      display:flex;
      flex-direction:column;
      .operate-area {
        height:44px;
        display:flex;
        position: relative;
        align-items:center;
        .date {
          color:@FONT_FOUR_COLOR;
          font-size:12px;
        }
        .comment-reply {
          // padding:10px;
          // margin-left:auto;
        }
        .comment-more {
          padding:10px;
        }
      }
      .inter-area{
        padding:10px;
        background-color:@BG_GRAY;
        .comment-wrapper {
          padding-top:5px;
          .comment {
            font-size: 14px;
            width: 100%;
            .comment-name {
              color: @FONT_THIRD_COLOR;
            }
            .creator-name{
              color: @FONT_THIRD_COLOR;
            }
            .comment-content {
              margin-left: 2px;
              color: #808080;
            }
          }
          .comment-more{
            font-size:12px;
            color:#30a5ff;
            margin-top:5px;
          }
        }
      }
    }
    .send-comment-area {
      z-index: 2;
      position: fixed;
      width: 100%;
      height: 70px;
      left: 0px;
      bottom: 0px;
      background-color: white;
      display: flex;
      align-items: center;
      border-top: solid 1px @BORDER_COLOR_1;
      &.safe-bottom{
        bottom:34px;
      }
      .comment-input-container {
        width: 75%;
        height: 45px;
        border: solid 1px @BORDER_COLOR_1;
        border-radius: 4px;
        background-color: white;
        margin: 0 10px;

        .comment-input {
          font-size: 14px;
        }
      }

      .send-btn-area {
        width: 65px;
        height: 100%;
        display: flex;
        align-items: center;

        .send-btn {
          color: white;
          height: 30px;
          line-height: 30px;
          font-size: 14px;
          background-color: @MAIN_THEME_COLOR;
        }
      }
    }
  }
</style>

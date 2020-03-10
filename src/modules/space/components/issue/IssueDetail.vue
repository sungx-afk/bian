<template>
  <div class="issue-detail-container">
    <template v-if="issue && space">
      <item :item.sync="issue" :type.sync="issue.type"
            :canComment="canComment"
            v-on:click-menu="clickOperateMenu"
            v-on:click-image="clickIssueImage"
            v-on:comment="comment"
            v-on:comment-reply="commentReply">
      </item>
    </template>
    <div class='send-comment-area' v-if="postComment">
      <div class='comment-input-container'>
        <van-field class='comment-input' ref="comment" @blur="commentBlur" v-model="commentContent" :placeholder="commentPlaceholder" maxlength="1000"></van-field>
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
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'
  import Item from './IssueItem';

  import Vue from 'vue';
  import { ImagePreview } from 'vant';
  Vue.use(ImagePreview);

    export default {
      name: "IssueDetail",
      components:{
        Item
      },
      data(){
        return{
          spaceId:'',
          issueId:'',
          issue:null,
          space:null,
          menuList:[],
          isShowMoreMenu:false,
          postComment:false,
          commentPlaceholder:'',
          commentContent:'',
          currentComment:null,
          commentTimer:null
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user',
        }),
        canOperate(){
          let result = false
          let currentUserId = this.user.id
          if (this.space && this.space.creatorId === currentUserId){
            result = true
          }else if(this.issue && this.issue.creatorId === currentUserId){
            result = true
          }
          return result
        },
        isSpaceCreator() {
          let result = false
          let currentUserId = this.user.id
          if (this.space && currentUserId === this.space.creatorId) {
            result = true
          }
          return result
        },
        canComment(){
          let result = true
          let currentUserId = this.user.id
          if (this.space && currentUserId !== this.space.creatorId && this.space.config.commentScope == 'member' ){
            let index = this.space.config.friendIds.findIndex(item=>item === currentUserId)
            if (index === -1){ //如果没有找到，说明不在好友列表
              result = false
            }
          }
          return result
        }
      },
      methods:{
        getSpaceDetail(){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.space = rsp
          })
        },
        getIssueDetail(){
          let that = this
          let sid = this.spaceId
          let cid = this.issueId
          $API.space.getIssueDetail({
            sid,
            cid
          }, rsp => {
            that.issue = rsp
            that.getCommentList()
          }, error => {

          })
        },
        getCommentList(start = 0){
          $API.space.getComments({
            subject_id:this.issueId,
            start,
            limit:50
          }, rsp => {
            this.issue.recently = rsp
          }, error => {

          })
        },
        clickOperateMenu(){
          if (this.postComment){
            return
          }
          if (this.canOperate){
            let name = '删除该' + this.messageTypeText()
            this.menuList = [
              {
                id:'delete_issue',
                name:name,
              }]
          }else {
            let name = '举报该' + this.messageTypeText()
            this.menuList = [
              {
                id:'report_issue',
                name:name,
              }]
          }

          this.isShowMoreMenu = true
        },
        clickIssueImage(index){
          if (this.postComment){
            return
          }
          let plat = getPlat()
          if (plat === 'web'){
            window.open(this.issue.photos[index].url)
          }else{
            let images = this.issue.photos.map(item=>{
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
        moreMenuPressed(menu){
          this.isShowMoreMenu = false
          switch (menu.id) {
            case 'delete_issue':
              this.deleteIssue()
              break
            case 'report_issue':
              this.reportIssue()
              break
            case 'delete_comment':
              this.doDeleteComment(menu.data)
              break
            case 'report_comment':
              this.reportComment(menu.data)
              break
            case 'reply_comment':
              this.replyComment(menu.data)
              break
          }
        },
        deleteIssue(){
          let that = this
          this.$dialog.confirm({
            message: `确认删除该${this.messageTypeText()}?`
          }).then(() => {
            $API.space.deleteIssue({
              sid: that.spaceId,
              cid: that.issueId
            }, rsp=>{
              //TODO
              this.$router.go(-1)
            }, error=>{

            })
          }).catch(() => {

          })
        },
        commentBlur(){
          this.commentTimer = setTimeout(()=>{
            this.postComment = false
            this.commentTimer = null
          },200)
        },
        clearCommentTimer(){
          if (this.commentTimer){
            clearTimeout(this.commentTimer)
          }
        },
        comment(issue){
          this.clearCommentTimer()
          this.commentPlaceholder = '说点什么吧...'
          this.postComment = true
          this.$nextTick(()=>{
            this.$refs.comment.focus()
          })
        },
        commentReply(data){
          if (this.checkMyComment(data.comment)){
            if (this.postComment){
              return
            }
            this.deleteComment(data.comment)
          }else {
            //如果是馆主，就回复和删除，如果不是，就回复和举报
            //如果不能评论，则弹提示
            if (this.isSpaceCreator){
              this.menuList = [
                {
                  id: 'reply_comment',
                  name: '回复该评论',
                  data: data
                },{
                  id: 'delete_comment',
                  name: '删除该评论',
                  data: data.comment
                }]
            }else {
              this.menuList = []
              if (this.canComment){
                this.menuList.push({
                  id: 'reply_comment',
                  name: '回复该评论',
                  data: data
                })
              }
              this.menuList.push({
                id: 'report_comment',
                name: '举报该评论',
                data: data
              })
            }
            this.isShowMoreMenu = true
          }
        },
        sendCommentDelay(){
          setTimeout(()=>{
            this.sendComment()
          },200)
        },
        sendComment() {
          let that = this
          let content = that.commentContent

          if (!content){
            return
          }

          let data = {}
          if (that.currentComment){
            let reply = {}
            reply.commentId = that.currentComment.id
            data.reply = reply
          }

          data.type = 'COMMENT' //发表评论
          data.content = content
          data.status = 'PASS'

          $API.space.sendComment({
            sid: that.issue.id,
            data: data
            }, rsp=> {
              that.updateComment(rsp)
              that.clearLastData()
            }, error=>{
              console.log(error)
            })
        },
        updateComment(comment){
          //如果是评论，直接放到recently中
          let that = this
          that.issue.recently.unshift(comment)
        },
        checkMyComment(comment){
          let result = false
          let currentUserId = this.user.id
          if (comment.creatorId === currentUserId){
            result = true
          }
          return result
        },
        deleteComment(comment){
          let name = '删除该评论'
          this.menuList = [
            {
              id:'delete_comment',
              name:name,
              data:comment
            }]
          this.isShowMoreMenu = true
        },
        doDeleteComment(comment){
          let that = this
          let sid = that.spaceId
          let cid = comment.id
          $API.space.deleteComment({
              sid,
              cid
            }, rsp=>{
              let index = that.issue.recently.findIndex(item=>item.id === cid)
              if (index > -1){
                that.issue.recently.splice(index,1)
              }
            }, error=>{

          })
        },
        replyComment(data){
          this.clearCommentTimer()
          this.currentComment = data.comment
          this.commentPlaceholder = '回复 '
          if (this.currentComment.creator && this.currentComment.creator.name){
            this.commentPlaceholder += this.currentComment.creator.name
          }
          this.postComment = true
          this.$nextTick(()=>{
            this.$refs.comment.focus()
          })
        },
        clearLastData() {
          this.postComment = false
          this.currentComment = null
          this.commentContent = ''
        },
        reportIssue(){
          Link(`/report?type=post&subject_id=${this.issueId}&subject_content=${this.spaceId}`)
        },
        reportComment(data){
          localStorage.setItem('report_comment_content',data.comment.content)
          Link(`/report?type=comment&subject_id=${data.comment.id}`)
        },
        messageTypeText() {
          let result = '动态'
          if (this.issue.type == 'PUBLIC'){
            result = '留言'
          }else if(this.issue.type == 'PRIVATE'){
            result = '私语'
          }
          return result
        }
      },
      created() {
        if(this.$route.params.id){
          this.issueId = this.$route.params.id
          let query = this.$route.query
          if(query){
            if (query.space_id){
              this.spaceId = query.space_id
            }
          }
          this.getIssueDetail()
          this.getSpaceDetail()
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .issue-detail-container{
    padding: 0px 15px;
    .send-comment-area{
      position:fixed;
      width:100%;
      height:70px;
      left:0px;
      bottom:0px;
      background-color:white;
      display:flex;
      align-items:center;
      border-top:solid 1px @BORDER_COLOR_1;
      .comment-input-container{
        width:75%;
        height:45px;
        border:solid 1px @BORDER_COLOR_1;
        border-radius:4px;
        background-color:white;
        margin: 0 10px;
        .comment-input{
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

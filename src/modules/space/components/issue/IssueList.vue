<template>
  <div class="issue-list-container" :style="{'height':calcHeight}">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <van-list
        v-model="loading"
        :finished="finished"
        finished-text="没有更多数据了"
        @load="onLoadMoreData">
        <van-cell
          v-for="item in list"
          :key="item.id">
          <item :item.sync="item" :type.sync="type" :canOperate="item.canOperate" :canComment="canComment"
                v-on:click-menu="clickOperateMenu"
                v-on:click-item="clickIssueItem"
                v-on:click-image="clickIssueImage"
                v-on:comment="comment"
                v-on:comment-reply="commentReply">
          </item>
        </van-cell>
      </van-list>
    </template>
    <template v-if="!postComment && canComment">
      <div class="add-issue-btn" @click.stop="goAddIssue">
        <img class="add-issue-image" src="~@/modules/images/float_add_btn.png"/>
      </div>
    </template>
    <div class='send-comment-area' :class="{'safe-bottom':isIPhoneX}" v-if="postComment">
      <div class='comment-input-container'>
        <van-field class='comment-input' ref="comment" @blur="commentBlur" v-model="commentContent"
                   :placeholder="commentPlaceholder" maxlength="1000"></van-field>
      </div>
      <div class='send-btn-area'>
        <van-button class='send-btn' size="small" type="default" @click.stop='sendCommentDelay'>发送</van-button>
      </div>
    </div>
    <van-popup v-model="isShowMoreMenu">
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>

</template>

<script>

  import {mapGetters,mapActions} from 'vuex';
  import {Link} from '@/config/utils'

  import Item from './IssueItem'
  import NoData from '@/modules/widget/space/NoData'

  import Vue from 'vue'
  import {ImagePreview} from 'vant';

  Vue.use(ImagePreview);

  import constant from '@/config/constant'

  const LIMIT = 20

  export default {
    name: "IssueList",
    props: {
      space: {
        type: Object,
        default: null
      },
      type: {
        type: String,
        default: ''
      },
    },
    components: {
      Item,
      NoData
    },
    computed: {
      ...mapGetters({
        user: 'userStore/user',
      }),
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
      isSpaceCreator() {
        let result = false
        let currentUserId = this.user.id
        if (this.space && currentUserId === this.space.creatorId) {
          result = true
        }
        return result
      },
      isSpaceMember() {
        let result = false
        if (!this.isSpaceCreator && this.space) {
          let currentUserId = this.user.id
          let index = this.space.config.friendIds.findIndex(item => item === currentUserId)
          if (index > -1) {
            result = true
          }
        }
        return result
      },
      calcHeight() {
        let result = ''
        if (this.type === 'SPACE') {
          result = 'calc(100% - 80px)'
        } else if (this.type === 'PRIVATE') {
          result = 'calc(100% - 20px)'
        } else {
          result = '100%'
        }

        return result
      }
    },
    data() {
      return {
        list: [],
        loading: false,
        finished: false,
        noData: false,
        isShowMoreMenu: false,
        menuList: [],
        postComment: false,
        commentPlaceholder:'',
        commentContent: '',
        currentIssue: null,
        currentComment: null,
        commentTimer:null
      }
    },
    watch:{
      postComment(){
        this.setDetailShowTab(!this.postComment)
      },
    },
    methods: {
      ...mapActions({
        setDetailShowTab: 'spaceStore/setDetailShowTab',
      }),
      fetchIssueList(start) {
        let that = this
        if (start === undefined) {
          start = this.list.length
        }
        let limit = LIMIT
        if (start > 0) {
          this.loading = true
        }
        $API.space.fetchIssueList({
          sid: that.space.id,
          start,
          limit,
          type: that.type
        }, rsp => {
          that.loading = false
          rsp = rsp.map(item => {
            let o = item
            o.canOperate = that.canOperateIssue(item)
            return o
          })
          if (0 === start) {
            that.list = rsp
          } else {
            that.list = that.list.concat(rsp)
          }
          that.noData = false
          if (that.list.length === 0) {
            that.noData = true
            that.finished = true
          } else if (rsp.length < limit) {
            that.finished = true
          }
        }, error => {
          that.loading = false
          that.finished = true
          that.$toast("获取列表失败，请稍后重试")
        })
      },
      onLoadMoreData() {
        if (this.finished) {
          return
        }
        let start = this.list.length
        this.fetchIssueList(start)
      },
      updateList(data) {
        if (this.type === data.type) {
          this.fetchIssueList(0)
        }
      },
      canOperateIssue(issue) {
        let result = false
        let currentUserId = this.user.id
        if (currentUserId === this.space.creatorId) {
          result = true
        } else if (currentUserId === issue.creatorId) {
          result = true
        }

        return result
      },
      clickOperateMenu(item) {
        if (this.postComment) {
          return
        }
        let name = '删除' + this.messageTypeText()
        this.menuList = [
          {
            id: 'delete',
            name: name,
            data: item
          }]
        this.isShowMoreMenu = true
      },
      moreMenuPressed(menu) {
        this.isShowMoreMenu = false
        switch (menu.id) {
          case 'delete':
            this.deleteIssue(menu.data)
            break
          case 'delete_comment':
            this.doDeleteComment(menu.data)
            break
        }
      },
      clickIssueItem(item) {
        if (this.postComment) {
          return
        }
        Link(`/issue/detail/${item.id}?space_id=${this.space.id}`)
      },
      clickIssueImage(index, issue) {
        if (this.postComment) {
          return
        }
        let images = issue.photos.map(item => {
          return item.url
        })
        ImagePreview({
          images: images,
          startPosition: index,
          onClose() {
            // do something
          }
        });
      },
      goAddIssue() {
        Link(`/issue/create?space_id=${this.space.id}&type=${this.type}`)
      },
      deleteIssue(item) {
        let that = this
        this.$dialog.confirm({
          message: `确认删除该${this.messageTypeText()}?`
        }).then(() => {
          $API.space.deleteIssue({
            sid: that.space.id,
            cid: item.id
          }, rsp => {
            let index = that.list.findIndex(some => some.id === item.id)
            if (index > -1) {
              that.list.splice(index, 1)
              if (that.list.length === 0){
                that.noData = true
              }
            }
          }, error => {

          })
        }).catch(() => {

        })
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
      comment(issue) {
        this.clearCommentTimer()
        this.currentIssue = issue
        this.commentPlaceholder = '说点什么吧...'
        this.postComment = true
        this.$nextTick(() => {
          this.$refs.comment.focus()
        })
      },
      commentReply(data) {
        if (this.checkMyComment(data.comment)) {
          if (this.postComment) {
            return
          }
          this.deleteComment(data.comment)
        } else {
          //如果不能评论，则弹提示
          if (!this.canComment) {
            this.$toast("该馆已禁止访客留言或评论")
            return
          }
          this.clearCommentTimer()
          this.currentIssue = data.issue
          this.currentComment = data.comment
          this.commentPlaceholder = '回复 '
          if (this.currentComment.creator && this.currentComment.creator.name){
            this.commentPlaceholder += this.currentComment.creator.name
          }
          this.postComment = true
          this.$nextTick(() => {
            this.$refs.comment.focus()
          })
        }
      },
      sendCommentDelay() {
        setTimeout(() => {
          this.sendComment()
        }, 200)
      },
      sendComment() {
        let that = this
        let currentIssue = that.currentIssue
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
          sid: currentIssue.id,
          data: data
        }, rsp => {
          that.updateComment(rsp)
          that.clearLastData()
        }, error => {
          console.log(error)
        })
      },
      updateComment(comment) {
        //如果是评论，直接放到recently中
        let that = this
        let index = that.list.findIndex(item => {
          return item.id === that.currentIssue.id
        })
        if (index > -1) {
          that.list[index].recently.unshift(comment)
        }
      },
      checkMyComment(comment) {
        let result = false
        let currentUserId = this.user.id
        if (comment.creatorId === currentUserId) {
          result = true
        }
        return result
      },
      deleteComment(comment) {
        let name = '删除该评论'
        this.menuList = [
          {
            id: 'delete_comment',
            name: name,
            data: comment
          }]
        this.isShowMoreMenu = true
      },
      doDeleteComment(comment) {
        let that = this
        let sid = that.space.id
        let cid = comment.id
        $API.space.deleteComment({
          sid,
          cid
        }, rsp => {
          let issueId = comment.subjectId
          let issueIndex = that.list.findIndex(item => item.id === issueId)
          if (issueIndex > -1) {
            let issue = that.list[issueIndex]
            let commentIndex = issue.recently.findIndex(item => item.id === cid)
            if (commentIndex > -1) {
              issue.recently.splice(commentIndex, 1)
            }
          }
        }, error => {

        })
      },
      clearLastData() {
        this.postComment = false
        this.currentComment = null
        this.commentContent = ''
      },
      messageTypeText() {
        let result = '动态'
        if (this.type == 'PUBLIC') {
          result = '留言'
        } else if (this.type == 'PRIVATE') {
          result = '私语'
        }
        return result
      }
    },

    created() {
      eventHub.$on(constant.EVENT_POST_ISSUE_SUCCESS, this.updateList)
    },
    beforeDestroy() {
      this.setDetailShowTab(true)
      eventHub.$off(constant.EVENT_POST_ISSUE_SUCCESS, this.updateList)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .issue-list-container {
    .add-issue-btn {
      position: fixed;
      bottom: 60px;
      right: 20px;

      .add-issue-image {
        width: 50px;
        height: 50px;
      }

      &.x-bottom {
        bottom: 90px;
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
    .van-cell:not(:last-child)::after{
      border-bottom: 1px solid @BORDER_COLOR_1;
    }
  }

</style>

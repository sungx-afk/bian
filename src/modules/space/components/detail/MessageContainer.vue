<template>
  <div class="space-content-container">
    <div class="space-content-body" :class="{'iphonex-height':isIPhoneX}">
      <page-header :title="pageTitle"></page-header>
      <template v-if="detail">
        <template v-if="0 === checkCanIn(detail)">
          <van-tabs v-model="activeTab" sticky color="#825621">
            <van-tab title="留言" name="message">
              <message v-if="detail" :space="detail" type="PUBLIC"></message>
            </van-tab>
            <van-tab v-if="showFriendsTab" title="亲属空间" name="friends">
              <friends v-if="detail" :space="detail" type="SPACE"></friends>
            </van-tab>
            <van-tab title="私语" name="private">
              <private v-if="detail" :space="detail" type="PRIVATE"></private>
            </van-tab>
            <van-tab title="生平" name="info" v-if="false">
              <user-summary v-if="detail"></user-summary>
            </van-tab>
          </van-tabs>
        </template>
        <template v-else>
          <div class="tip-wrapper" @click="goBack">
            <i class="iconfont icon-warn"></i>
            <div class="content">{{tipContent}}</div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
  import {mapGetters, mapActions} from 'vuex';
  import {isIphone} from '@/config/utils';
  import constant from '@/config/constant'

  import Message from './Message'
  import Friends from './Friends'
  import Private from './Private'
  import UserSummary from '../userinfo/UserSummary'
  import PageHeader from '@/modules/widget/PageHeader'

  export default {
    name: 'MessageContainer',
    data() {
      return {
        spaceId: '',
        detail: null,
        activeTab: 'message',
        pendingTab: '',
        tipContent: ''
      }
    },
    computed: {
      ...mapGetters({
        user: 'userStore/user'
      }),
      isIPhoneX() {
        return isIphone() && window.screen.height >= 812
      },
      isSpaceCreator() {
        if (!this.detail || !this.user) return false
        return this.user.id === this.detail.creatorId
      },
      isSpaceMember() {
        if (this.isSpaceCreator || !this.detail) return false
        let index = this.detail.config.friendIds.findIndex(id => id === this.user.id)
        return index > -1
      },
      showFriendsTab() {
        return this.detail && this.detail.type === 0
      },
      pageTitle() {
        if (this.activeTab === 'private') return '私语'
        if (this.activeTab === 'friends') return '亲属空间'
        return '留言'
      }
    },
    components: {
      Message,
      Friends,
      Private,
      UserSummary,
      PageHeader
    },
    methods: {
      ...mapActions({
        getSpaceDetail: 'spaceStore/getSpaceDetail'
      }),
      getDetail(quiet) {
        if (!this.spaceId) return
        this.getSpaceDetail({sid: this.spaceId, quiet: quiet ? 1 : 0}).then((rsp) => {
          this.detail = rsp
          this.applyPendingTab()
        }).catch((error) => {
          if (error.message && error.message.indexOf('status code 404') !== -1) {
            this.tipContent = '资源不存在'
          }
        })
      },
      checkCanIn(space) {
        let result = 0
        let currentUserId = this.user && this.user.id
        if (space.deleted === 1) {
          result = -3
          this.tipContent = '纪念馆已被屏蔽，请联系客服申诉'
        } else if (currentUserId === space.creatorId) {
          result = 0
        } else if (space.config.viewScope === 'member') {
          let index = space.config.friendIds.findIndex(id => id === currentUserId)
          if (index === -1) {
            this.tipContent = '纪念馆已禁止访客进入，请联系馆主进行操作'
            result = -1
          } else {
            let idx = space.config.blackListIds.findIndex(id => id === currentUserId)
            if (idx > -1) {
              result = -2
              this.tipContent = '您无法浏览该馆'
            }
          }
        } else {
          let idx = space.config.blackListIds.findIndex(id => id === currentUserId)
          if (idx > -1) {
            result = -2
            this.tipContent = '您无法浏览该馆'
          }
        }
        return result
      },
      goBack() {
        this.$router.go(-1)
      },
      // 发表留言/私语/亲属空间成功后，自动切换到对应 Tab，方便看到刚发布的内容
      onIssuePosted(data) {
        let tabMap = {PUBLIC: 'message', SPACE: 'friends', PRIVATE: 'private'}
        let tab = (data && tabMap[data.type]) || 'message'
        if (tab === 'friends' && !this.showFriendsTab) {
          tab = 'message'
        }
        this.activeTab = tab
      },
      // 发表留言返回时，切换到对应 Tab（公共→留言 / 亲属→亲属空间 / 私语→私语）。
      // 亲属空间 Tab 仅纪念馆（detail.type===0）才展示，否则回退到留言。
      applyPendingTab() {
        let tab = this.pendingTab
        if (!tab) return
        if (tab === 'friends' && !this.showFriendsTab) {
          tab = 'message'
        }
        this.activeTab = tab
        this.pendingTab = ''
      }
    },
    created() {
      if (this.$route.params.id) {
        this.spaceId = this.$route.params.id
        this.getDetail(false)
      }
      // 从发表页返回携带 ?tab=，先记下，等详情加载完（用于判断亲属空间是否可显示）再切换
      let tab = this.$route.query.tab
      if (tab === 'message' || tab === 'friends' || tab === 'private') {
        this.pendingTab = tab
        if (tab !== 'friends') {
          this.activeTab = tab
        }
      }
      // 发表返回后切换对应 Tab（create 页改用 go(-1)，不会重新进入 created，需此处监听）
      eventHub.$on(constant.EVENT_POST_ISSUE_SUCCESS, this.onIssuePosted)
      },
      beforeDestroy() {
      eventHub.$off(constant.EVENT_POST_ISSUE_SUCCESS, this.onIssuePosted)
      }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .space-content-container {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;

    /deep/ .van-nav-bar {
      background: @MAIN_THEME_COLOR;
      .van-nav-bar__title,
      .van-icon {
        color: white;
      }
    }

    .space-content-body {
      height: 100%;
      box-sizing: border-box;
      &.iphonex-height {
        padding-bottom: 30px;
      }
      .tip-wrapper {
        padding: 40px 20px;
        text-align: center;
        color: #888;
        .iconfont {
          font-size: 40px;
          color: #f5a623;
        }
      }
    }

    /deep/ .van-tabs {
      //顶部 PageHeader 占 48px，tabs 撑满剩余高度
      height: ~'calc(100% - 48px)';
      .van-tabs__content {
        height: ~'calc(100% - 44px)';
        .van-tab__pane {
          height: 100%;
        }
      }
      .message-container,
      .friends-container,
      .private-container,
      .main-container {
        height: 100%;
      }
    }
  }
</style>
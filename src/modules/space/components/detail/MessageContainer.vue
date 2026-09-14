<template>
  <div class="space-content-container">
    <div class="space-content-body" :class="{'iphonex-height':isIPhoneX}">
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
            <van-tab title="生平" name="info">
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

  import Message from './Message'
  import Friends from './Friends'
  import Private from './Private'
  import UserSummary from '../userinfo/UserSummary'

  export default {
    name: 'MessageContainer',
    data() {
      return {
        spaceId: '',
        detail: null,
        activeTab: 'message',
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
      }
    },
    components: {
      Message,
      Friends,
      Private,
      UserSummary
    },
    methods: {
      ...mapActions({
        getSpaceDetail: 'spaceStore/getSpaceDetail'
      }),
      getDetail(quiet) {
        if (!this.spaceId) return
        this.getSpaceDetail({sid: this.spaceId, quiet: quiet ? 1 : 0}).then((rsp) => {
          this.detail = rsp
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
      }
    },
    created() {
      if (this.$route.params.id) {
        this.spaceId = this.$route.params.id
        this.getDetail(false)
      }
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
      height: 100%;
      .van-tabs__content {
        height: calc(100% - 44px);
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
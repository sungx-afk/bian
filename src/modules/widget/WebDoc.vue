<template>
  <div class="web-doc">
    <div class="doc-header">
      <i class="iconfont icon-fanhui back" @click="goBack"></i>
      <span class="title">{{ title }}</span>
    </div>
    <div class="doc-body">
      <div class="loading" v-if="loading"><span class="spinner"></span></div>
      <iframe v-if="safeUrl" class="frame" :src="safeUrl" frameborder="0" @load="onLoad"></iframe>
    </div>
  </div>
</template>

<script>
  // 只允许打开官方隐私政策 / 用户协议域名，避免通过 url 参数跳转到任意页面
  const ALLOWED_HOSTS = ['web-ba.yugusoft.com']
  const ALLOWED_PROTOCOL = 'https:'

  export default {
    name: 'WebDoc',
    data () {
      return {
        loading: true,
        rawUrl: (this.$route.query && this.$route.query.url) || ''
      }
    },
    computed: {
      // 校验白名单，非法地址返回空串（页面不加载）
      safeUrl () {
        if (!this.rawUrl) return ''
        try {
          const url = new URL(this.rawUrl)
          if (url.protocol !== ALLOWED_PROTOCOL) return ''
          if (ALLOWED_HOSTS.indexOf(url.host) < 0) return ''
          return url.href
        } catch (e) {
          return ''
        }
      },
      title () {
        const key = this.$route.query && this.$route.query.title
        return key ? this.$t(key) : ''
      }
    },
    methods: {
      // 返回上一页：回到发起跳转的那个页面（账号设置 / 纪念馆详情等）
      goBack () {
        this.$router.go(-1)
      },
      onLoad () {
        this.loading = false
      }
    }
  }
</script>

<style lang="less" rel="stylesheet/less" scoped>
  @import '~@/config/config.less';

  .web-doc {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #fff;
    .doc-header {
      position: relative;
      flex: 0 0 44px;
      height: 44px;
      line-height: 44px;
      text-align: center;
      font-size: 16px;
      color: #333;
      border-bottom: 1px solid #eee;
      .back {
        position: absolute;
        left: 12px;
        font-size: 18px;
        color: #666;
      }
    }
    .doc-body {
      position: relative;
      flex: 1 1 auto;
      overflow: hidden;
      .frame {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
      }
      .loading {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
      }
      .spinner {
        display: block;
        width: 24px;
        height: 24px;
        border: 2px solid #eee;
        border-top-color: @SECOND_THEME_COLOR;
        border-radius: 50%;
        animation: web-doc-spin 0.8s linear infinite;
      }
    }
  }
  @keyframes web-doc-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

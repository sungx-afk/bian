<template>
  <div class="doc-page">
    <div class="doc-header">
      <i class="iconfont icon-fanhui back" @click="goBack"></i>
      <span>隐私政策</span>
    </div>
    <div class="doc-body">
      <p class="update">更新日期：2026-09-24　生效日期：2026-09-24</p>

      <h3>一、我们收集哪些信息</h3>
      <p>1. <b>账号信息</b>：微信授权登录时获取的 openid、昵称、头像；使用 Apple 登录时获取的 Apple 账号标识（sub）与您选择共享的邮箱。我们不会收集您的微信密码或 Apple ID 密码。</p>
      <p>2. <b>您主动提供的内容</b>：纪念馆名称、逝者照片与生平、留言、挽联、墓志铭等。其中涉及他人个人信息时，请您确保已取得相关权利人同意。</p>
      <p>3. <b>设备与日志信息</b>：为排查故障与保障安全，我们会记录设备型号、系统版本、平台标识（iOS / Android / 微信）、访问时间。</p>
      <p>4. <b>相册与相机</b>：仅在您主动上传照片时调用，用于选择或拍摄照片，不会在后台读取您的相册。</p>

      <h3>二、我们如何使用信息</h3>
      <p>1. 用于创建并展示纪念馆、识别您的账号、同步您的尊贵馆（会员）状态与购买记录。</p>
      <p>2. 用于处理您的举报与屏蔽请求，维护社区秩序。</p>
      <p>3. 用于改进产品体验（统计为聚合数据，不含个人身份）。</p>
      <p>我们不会将您的个人信息出售给任何第三方。</p>

      <h3>三、第三方服务</h3>
      <p>1. <b>七牛云存储</b>：存储您上传的图片。</p>
      <p>2. <b>Apple 登录（Sign in with Apple）</b>：用于 iOS App 内登录。</p>
      <p>3. <b>微信开放平台</b>：用于微信内授权登录、分享与支付。</p>
      <p>4. <b>Apple App Store 内购</b>：用于 iOS App 内的订阅与支付。</p>
      <p>这些第三方仅在本政策所述目的范围内处理数据，并受其自身隐私政策约束。</p>

      <h3>四、信息的存储与保护</h3>
      <p>数据存储于中国大陆境内的服务器，我们通过访问控制、传输加密等措施保护数据安全。请您妥善保管自己的账号，因您自身原因导致账号信息泄露的，由您自行承担责任。</p>

      <h3>五、您的权利</h3>
      <p>1. 您可以随时在 App「我的」中修改昵称、头像。</p>
      <p>2. 您可以<b>注销账号</b>：在「我的 → 注销账号」中提交，注销后我们将对个人信息进行脱敏或删除，且无法恢复。如需协助，请联系客服。</p>
      <p>3. 您可以对侵害您权益的内容发起举报，我们会在核实后处理。</p>

      <h3>六、儿童隐私</h3>
      <p>本服务面向成年人。如我们发现误收集了儿童个人信息，会尽快删除。</p>

      <h3>七、联系我们</h3>
      <p>如您对本政策有任何疑问，可通过 App 内的客服入口或发送邮件至 liushuang@yugusoft.com 与我们联系，我们将在 15 个工作日内回复。</p>

      <h3>八、政策更新</h3>
      <p>本政策如有更新，我们会在本页公布更新后的版本，重大变更会通过 App 内提示告知。</p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Privacy',
    methods: {
      goBack() {
        this.$router.go(-1)
      }
    }
  }
</script>

<style lang="less" rel="stylesheet/less" scoped>
  @import '~@/config/config.less';

  .doc-page {
    min-height: 100vh;
    background: #fff;
    .doc-header {
      position: relative;
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
      padding: 16px 16px 40px;
      color: #444;
      font-size: 14px;
      line-height: 1.9;
      .update {
        color: #999;
        font-size: 12px;
      }
      h3 {
        margin: 18px 0 6px;
        font-size: 15px;
        color: #222;
      }
      p {
        margin: 4px 0;
      }
    }
  }
</style>

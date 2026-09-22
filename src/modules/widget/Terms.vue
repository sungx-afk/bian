<template>
  <div class="doc-page">
    <div class="doc-header">
      <i class="iconfont icon-fanhui back" @click="goBack"></i>
      <span>服务条款（自动续期订阅）</span>
    </div>
    <div class="doc-body">
      <p class="update">更新日期：2026-09-22　生效日期：2026-09-22</p>

      <h3>一、服务内容</h3>
      <p>本条款适用于「尊贵馆」按年订阅服务（App Store 产品 ID：com.yugusoft.bian.yearly）。订阅生效期间，来访人员在指定纪念馆内使用祭奠物品不再单独计费。</p>

      <h3>二、订阅周期与价格</h3>
      <p>1. 订阅周期为 <b>1 年</b>，具体价格以 App Store 订阅页面展示为准（以人民币计价）。</p>
      <p>2. 订阅成功后，服务立即生效，有效期至当前订阅周期结束。</p>

      <h3>三、自动续期与扣款</h3>
      <p>1. 本订阅为<b>自动续期订阅</b>。在当前订阅期届满前 24 小时内，Apple 会自动从您绑定的支付方式扣取下一周期费用，订阅期顺延 1 年。</p>
      <p>2. 如您不再需要，请在当前订阅期届满前至少 24 小时关闭自动续期，否则将按上述规则自动扣款。</p>

      <h3>四、管理与取消</h3>
      <p>1. 打开 iPhone「设置 → 顶部 Apple ID → 订阅」，选择本服务的订阅项，即可查看有效期或<b>取消自动续期</b>。</p>
      <p>2. 取消后，当前已付费周期内的服务仍然有效，到期后不再续订。</p>
      <p>3. 删除 App 不会自动取消订阅，请按上述路径手动关闭。</p>

      <h3>五、退款</h3>
      <p>订阅费用由 Apple 收取，退款需通过 Apple 处理：可在 App Store 的购买历史中申请，或联系 Apple 客服。我们无法直接为您办理退款。</p>

      <h3>六、恢复购买</h3>
      <p>同一 Apple ID 在更换设备或重新安装 App 后，可在「纪念馆详情 → 恢复购买」中恢复已购订阅，无需重复付费。</p>

      <h3>七、其他</h3>
      <p>1. 若纪念馆因违规被封禁，本订阅服务同时终止，已付费用按上述退款途径处理。</p>
      <p>2. 个人信息的处理方式请见《隐私政策》。</p>
      <p>3. 如有疑问，可通过 App 内客服入口或发送邮件至 liushuang@yugusoft.com 联系我们。</p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Terms',
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

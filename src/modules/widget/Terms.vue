<template>
  <div class="doc-page">
    <div class="doc-header">
      <i class="iconfont icon-fanhui back" @click="goBack"></i>
      <span>{{ $t('服务条款（自动续期订阅）') }}</span>
    </div>
    <div class="doc-body">
      <p class="update">{{ $t('更新日期：2026-09-22 生效日期：2026-09-22') }}</p>

      <h3>{{ $t('一、服务内容') }}</h3>
      <p>{{ $t('本条款适用于「会员」按年订阅服务（App Store 产品 ID：com.yugusoft.bian.yearly）。订阅生效期间，来访人员在指定纪念馆内使用祭奠物品不再单独计费。') }}</p>

      <h3>{{ $t('二、订阅周期与价格') }}</h3>
      <p>{{ $t('1. 订阅周期为') }} <b>{{ $t('1 年') }}</b>{{ $t('，具体价格以 App Store 订阅页面展示为准（以人民币计价）。') }}</p>
      <p>{{ $t('2. 订阅成功后，服务立即生效，有效期至当前订阅周期结束。') }}</p>

      <h3>{{ $t('三、自动续期与扣款') }}</h3>
      <p>{{ $t('1. 本订阅为') }}<b>{{ $t('自动续期订阅') }}</b>{{ $t('。在当前订阅期届满前 24 小时内，Apple 会自动从您绑定的支付方式扣取下一周期费用，订阅期顺延 1 年。') }}</p>
      <p>{{ $t('2. 如您不再需要，请在当前订阅期届满前至少 24 小时关闭自动续期，否则将按上述规则自动扣款。') }}</p>

      <h3>{{ $t('四、管理与取消') }}</h3>
      <p>{{ $t('1. 打开 iPhone「设置 → 顶部 Apple ID → 订阅」，选择本服务的订阅项，即可查看有效期或') }}<b>{{ $t('取消自动续期') }}</b>。</p>
      <p>{{ $t('2. 取消后，当前已付费周期内的服务仍然有效，到期后不再续订。') }}</p>
      <p>{{ $t('3. 删除 App 不会自动取消订阅，请按上述路径手动关闭。') }}</p>

      <h3>{{ $t('五、退款') }}</h3>
      <p>{{ $t('订阅费用由 Apple 收取，退款需通过 Apple 处理：可在 App Store 的购买历史中申请，或联系 Apple 客服。我们无法直接为您办理退款。') }}</p>

      <h3>{{ $t('六、恢复购买') }}</h3>
      <p>{{ $t('同一 Apple ID 在更换设备或重新安装 App 后，可在「纪念馆详情 → 恢复购买」中恢复已购订阅，无需重复付费。') }}</p>

      <h3>{{ $t('七、其他') }}</h3>
      <p>{{ $t('1. 若纪念馆因违规被封禁，本订阅服务同时终止，已付费用按上述退款途径处理。') }}</p>
      <p>{{ $t('2. 个人信息的处理方式请见《隐私政策》。') }}</p>
      <p>{{ $t('3. 如有疑问，可通过 App 内客服入口或发送邮件至 liushuang@yugusoft.com 联系我们。') }}</p>

      <h3>{{ $t('八、使用许可（EULA）') }}</h3>
      <p>{{ $t('我们在本 App 内向您授予有限的、不可转让的、可撤销的使用许可，仅限您在自己拥有或控制的 Apple 设备上按本条款使用本 App。您不得复制、反编译、反向工程、转授权或商业再分发本 App。本 App 按「现状」提供，我们不对其适用性、准确性作明示或默示担保。在法律允许的最大范围内，我们不对因使用或无法使用本 App 造成的任何损失承担责任。') }}</p>
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

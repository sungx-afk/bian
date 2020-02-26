<template>
  <div class="agreement-area">
    <div class="text">
      1、任何使用彼岸云纪念网站（彼岸网）的用户均需仔细阅读本协议，用户登录使用彼岸网站即代表同意本服务协议。
    </div>
    <div class="text">
      2. 每个纪念馆创建后由创建人选择共享的亲友，我们不会公开纪念馆，也不提供名称搜索。创建人可自行设置仅亲属可访问。
    </div>
    <div class="text">
      3. 创建人自行管理纪念馆的留言，访问黑名单。
    </div>
    <div class="text">
      4.请遵守国家的法律法规，不发布违法违规信息，并对自己的行为承担全部民事和刑事责任。请尊重网络道德，不侵犯他人的权利和个人隐私。网站有权对违反规定的用户进行禁言、删除数据、禁止访问等操作。
    </div>
    <div class="text">
      5.创建人可随时删除创建的纪念馆和相关联的内容。
    </div>
    <div class="text">
      6.彼岸网不保证网站的永久存续，如遇不可抗力或经营上无力支撑网站运营，网站有权终止服务。
    </div>
    <div class="text">
      7.本网站适用中华人民共和国法律。我们保留随时更改我们的网站和上述免责及条款的权利。
    </div>
    <div class="text right">
      鱼骨（北京）科技有限公司
    </div>
  </div>
</template>

<script>
    export default {
        name: "Agreement"
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .agreement-area{
    width: 100%;
    height: 100%;
    padding: 20px 20px 120px;
    box-sizing:border-box;
    overflow-y: auto;
    .text{
      color: @FONT_SECOND_COLOR;
      padding: 5px 0px;
      font-size: 16px;
      line-height: 28px;
      &.right{
        text-align: right;
        margin-top:20px;
      }
    }
  }

</style>

<template>
  <div class="activity-list-wrapper">
    <van-cell title="张三的祭奠仪式" clickable>
      <!-- 使用 right-icon 插槽来自定义右侧图标 -->
      <template #right-icon>
        <i class="iconfont icon-gengduo"></i>
      </template>
    </van-cell>
    <van-cell title="张三的祭奠仪式" clickable>
      <!-- 使用 right-icon 插槽来自定义右侧图标 -->
      <template #right-icon>
        <i class="iconfont icon-gengduo"></i>
      </template>
    </van-cell>

    <div class="new-activity-btn" @click="goNewActivity">
      <i class="iconfont icon-anonymous-iconfont"></i>
    </div>

  </div>
</template>

<script>
  import {Link,gUuid} from '@/config/utils'
  export default{
    methods:{
      goNewActivity(){
        let url = '/space/meeting/107122';
        Link(url);
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .activity-list-wrapper{

    .new-activity-btn{
      width:50px;
      height:50px;
      line-height:50px;
      color:#fff;
      text-align: center;
      background: @MAIN_THEME_COLOR;
      border-radius: 100%;
      position: fixed;
      bottom: 25px;
      right: 20px;
      .iconfont{
        font-size:20px;
      }
    }
  }
</style>

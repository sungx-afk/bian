<template>
  <div class="private-container">
    <div class="private-tip">**私语仅自己可见</div>
    <issue-list :space="space" :type="type"></issue-list>
  </div>

</template>

<script>
  import IssueList from '../issue/IssueList'
    export default {
      name: "Private",
      props:{
        space:{
          type:Object,
          default:null
        },
        type:{
          type:String,
          default:''
        }
      },
      components:{
        IssueList
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .private-container{
    height: 100%;
    .private-tip{
      font-size:14px;
      padding:10px;
      margin-bottom: 5px;
      background:white;
      color: @MAIN_THEME_COLOR;
    }
  }


</style>

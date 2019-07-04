<template>
  <div class="message-container">
    <issue-list :space="space" :type="type"></issue-list>
  </div>
</template>

<script>
  import IssueList from '../issue/IssueList'
    export default {
      name: "Message",
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
  .message-container {
    height: 100%;
    overflow-y: auto;
  }

</style>

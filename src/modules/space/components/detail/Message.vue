<template>
  <issue-list :space="space" :type="type"></issue-list>
</template>

<script>
  import IssueList from './IssueList'
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

<style scoped>

</style>

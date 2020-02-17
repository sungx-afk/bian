<template>
  <div class="report-container">
    <router-view></router-view>
  </div>
</template>

<script>
    export default {
      name: "Report",
      data(){
        return{
          step:'list',
          categoryList:[{
            id:'porn',
            name:'色情'
          }]
        }
      },
      methods:{
        goSubmitStep(){
          this.step = 'submit'
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .report-container{
    .category-wrapper{
      display: flex;
      flex-direction: column;

      .category-title{
        height: 50px;
        line-height: 50px;
        font-size: 24px;
        text-align: center;
      }
      .list-wrapper{
        border-top:1px solid #eeeeee;
      }
    }
  }

</style>

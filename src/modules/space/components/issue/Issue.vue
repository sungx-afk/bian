<template>
  <div class="issue-container">
    <router-view></router-view>
  </div>
</template>
<script>

  export default{
    data(){
      return {

      }
    },
    components: {

    },
    computed:{

    },
    methods:{

    },
    created() {

    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .issue-container {
    display: flex;
    height: 100%;
    flex-direction: column;
  }

</style>

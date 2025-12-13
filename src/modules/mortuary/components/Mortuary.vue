<template>
  <div class="mortuary-container">
    <router-view></router-view>
  </div>
</template>
<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'

  export default{
    data(){
      return {

      }
    },
    components: {

    },
    computed:{
      isIPhoneX(){
        return false
      }
    },
    methods:{

    },
    created() {

    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .mortuary-container {
    display: flex;
    height: 100%;
    flex-direction: column;
  }

</style>

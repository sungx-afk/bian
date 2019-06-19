<template>
  <div class="home">
      this is home page
  </div>
</template>
<style rel="stylesheet/less" lang="less">

</style>
<script>
  import {mapGetters} from 'vuex';

  export default{
    data(){
      return {

      }
    },
    components: {

    },
    methods:{
      getSpaceList(){
        $API.home.getSpaceList({},rsp=>{

        },error=>{

        })
      }
    },
    created() {
      this.getSpaceList()
    }
  }
</script>

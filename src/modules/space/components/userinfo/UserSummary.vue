<template>
  <div class="user-summary-container" :class="{'safe-navigator':safeNavigator}">
    <Summary></Summary>
    <Story></Story>
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  
  import Summary from './Summary';
  import Story from './story/Story';

    export default {
      name: "UserSummary",
      components:{
        Summary,
        Story
      },
      data(){
        return{
          
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user',
          space:'spaceStore/spaceDetail'
        }),
        safeNavigator(){
          let result = false

          let plat = getPlat()
          if (plat === 'web'){
            result = true
          }

          return result
        }
      },
      methods:{
        
      },
      created() {
        
      },
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .user-summary-container{
    height: 100%;
    overflow-y: auto;
    background: @BG_GRAY2;
    padding-bottom: 100px;
    &.safe-navigator{
      padding-top: 40px;
    }
  }
</style>

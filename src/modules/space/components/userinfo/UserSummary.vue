<template>
  <div class="user-summary-container" :class="{'safe-navigator':safeNavigator}">
    <van-tabs v-model="tabActive" @change="onTabChange" color="#825621">
      <van-tab title="介绍">
        <template v-if="tabActive === 0">
          <Summary></Summary>
        </template>
      </van-tab>
      <van-tab title="文章">
        <template v-if="tabActive === 1">
          <Story></Story>
        </template>
      </van-tab>
    </van-tabs>
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
          tabActive:0,
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
        onTabChange(e){

        },
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

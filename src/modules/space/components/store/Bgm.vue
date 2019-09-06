<template>
  <div class="bgm-container">
    <van-cell-group title="预置">
      <van-cell v-for="item in presetBgm" :key="item.key" :title="item.name" :label="item.author" size="large" @click.stop="selectPresetBgm(item)">
        <div v-if="showSelected(item)">
          <i class="iconfont icon-duigou1"></i>
        </div>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';

    export default {
      name: "Bgm",
      methods:{
        ...mapActions({
          setUserSetting: 'userStore/setUserSetting',
        }),
        showSelected(item){
          let result = false
          if (this.userSetting['bgm_key']){
            return item.key === this.userSetting['bgm_key']
          }else{
            if (item.key === 'preset_1'){
              result = true
            }
          }
          return result
        },
        selectPresetBgm(item){
          this.setUserSetting({key:'bgm_key',value:item.key}).then(rsp=>{
            this.playBgm(0)
          })
        }
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .bgm-container{
    .icon-duigou1{
      color: @MAIN_THEME_COLOR;
    }
  }

</style>

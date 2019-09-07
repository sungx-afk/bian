<template>
  <div class="bgm-container">
    <van-cell-group title="预置">
      <van-cell v-for="item in presetBgm" :key="item.key" :title="item.name" :label="item.author" size="large" @click.stop="selectPresetBgm(item)">
        <div v-if="showPresetSelected(item)">
          <i class="iconfont icon-duigou1"></i>
        </div>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script>
  import constant from '@/config/constant'
    export default {
      name: "Bgm",
      data(){
        return{
          spaceId:'',
        }
      },
      methods:{
        showPresetSelected(item){
          let result = false
          if (this.currentBgmKey){
            result = item.key === this.currentBgmKey
          }
          return result
        },
        selectPresetBgm(item){
          this.playBgm(0,{bgmKey:item.key})
          $API.space.updateSpaceBgm({
            sid:this.spaceId,
            bgMusic:item.key
          },rsp=>{
            eventHub.$emit(constant.EVENT_UPDATE_BGM_SUCCESS,{bgm:item.key,spaceId:this.spaceId})
          })
        }
      },
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
          }
          if (query.key){
            this.initBgm(query.key)
          }
        }
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .bgm-container{
    height: 100%;
    background: @BG_WHITE;
    .icon-duigou1{
      color: @MAIN_THEME_COLOR;
    }
  }

</style>

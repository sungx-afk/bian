<template>
  <div class="space-manage-container">
    <van-tabs v-model="tabActive" @change="onTabChange" color="#825621">
      <van-tab title="记录">
        <template v-if="tabActive === 0">
          <event :space.sync="detail"></event>
        </template>
      </van-tab>
      <van-tab title="访客列表">
        <template v-if="tabActive === 1">
          <visitor :space.sync="detail"></visitor>
        </template>
      </van-tab>
      <van-tab title="设置">
        <template v-if="tabActive === 2">
          <setting :space.sync="detail"></setting>
        </template>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
  import Event from './manage/Event'
  import Visitor from './manage/Visitor'
  import Setting from './manage/Setting'

    export default {
      name: "SpaceManage",
      components:{
        Event,
        Visitor,
        Setting
      },
      data(){
        return{
          tabActive:0,
          spaceId:'',
          detail:null,
        }
      },
      methods:{
        onTabChange(e){

        },
        getSpaceDetail(){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.detail = rsp
          })
        },
        registerEvent(){

        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          console.log(this.spaceId)
          this.getSpaceDetail()
          this.registerEvent()
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .space-manage-container{
    height: 100%;
    background: @BG_WHITE;
  }

</style>

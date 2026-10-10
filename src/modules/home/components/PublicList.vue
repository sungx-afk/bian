<template>
  <div class="public-list-container">
    <van-list
      v-model="loading"
      :finished="finished"
      finished-text="没有更多数据了"
      @load="onLoadMoreData">
      <item v-for="item in list" :key="item.id" :item="item"
            v-on:item-press="goSpaceDetail">
      </item>
    </van-list>
  </div>
</template>

<script>
  import {Link} from '@/config/utils'
  import {setPendingBackgroundId} from '@/modules/space/components/sacrifice/pendingSpace'

  import Item from '@/modules/widget/space/Item'
    export default {
      name: "PublicList",
      components:{
        Item
      },
      data(){
        return{
          start:0,
          count:0,
          list:[],
          loading:false,
          finished:false
        }
      },
      methods:{
        getSpacesPublic(){
          $API.home.getSpacesPublic({start:this.start,limit:20},(rsp)=>{
            this.list = rsp
          },(error)=>{
            console.log("error:",error)
          })
        },
        goSpaceDetail(item){
          this.tryHandleBgm(item)
          // 进馆前把列表项已带的主题信息(backgroundId)透传，供祭拜页首帧直接用，避免闪默认主题
          setPendingBackgroundId(item)
          this.linkToSpaceDetail(item.id)
        },
        linkToSpaceDetail(spaceId){
          Link(`/space/sacrifice/${spaceId}`)
        },
        onLoadMoreData(){

        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

</style>

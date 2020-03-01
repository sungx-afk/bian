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
          this.linkToSpaceDetail(item.id)
        },
        linkToSpaceDetail(spaceId){
          Link(`/space/detail/${spaceId}`)
        },
        onLoadMoreData(){

        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

</style>

<template>
  <div class="visitor-container" v-bind:style="{ 'height': containerHeight + 'px' }">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <van-list
        v-model="loading"
        :finished="finished"
        finished-text="没有更多数据了"
        @load="onLoadMoreData">
        <van-cell
          v-for="item in list"
          :key="item.id">
          <div class="list-item">
            <div class="left-content">
              <img class="avatar" :src="item.user && item.user.avatarUrl" />
              <div class="title">{{item.user && item.user.name}}</div>
              <van-tag v-if="item.user && item.user.black" class="black-tag">黑名单用户</van-tag>
            </div>
            <div class="right-content" @click.stop="showMoreMenu" >
              <i class="more iconfont icon-gengduo"></i>
            </div>
          </div>
        </van-cell>
      </van-list>
    </template>
  </div>
</template>

<script>
  const LIMIT = 20

  import NoData from '@/modules/widget/space/NoData'
    export default {
      name: "Visitor",
      props:{
        space:{
          type:Object,
          default:null,
        }
      },
      components:{
        NoData
      },
      data(){
        return{
          list:[],
          loading:false,
          finished:false,
          noData:false,
          containerHeight:0
        }
      },
      methods:{
        initContainerHeight(){
          this.containerHeight = document.body.clientHeight - 44
        },
        getVisitorList(start){
          let that = this
          let limit = LIMIT

          if (start === undefined){
            start = 0
          }
          $API.space.getSpaceVisitorList({
              sid:that.space.id
            }, rsp=>{
            that.loading = false
            rsp = rsp.map(item=>{
              let o = item
              let index = that.space.config.blackListIds.findIndex(id=>id === item.userId)
              if (index > -1){
                o.user.black = true
              }
              return o
            })
            if (start === 0){
              let list = []
              for (let i = 0; i < 30; i++) {
                let item = rsp[0]
                list.push(JSON.parse(JSON.stringify(item)))
              }
              this.list = list
            }else{
              this.list = this.list.concat(rsp)
            }
            if (that.list.length === 0){
              that.noData = true
              that.finished = true
            }else if(rsp.length < limit){
              that.finished = true
            }
          },error=>{
            that.loading = false
          })
        },
        onLoadMoreData(){
          if (this.space){
            let start = this.list.length
            this.getVisitorList(start)
          }
        }
      },
      created() {
        this.initContainerHeight()
        if (this.space){
          this.getVisitorList(0)
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .visitor-container{
    overflow-y: scroll;
    .list-item{
      display: flex;
      align-items: center;
      .left-content{
        display: flex;
        align-items: center;
        .avatar{
          width: 30px;
          height: 30px;
          border-radius: 15px;
        }
        .title{
          margin-left: 10px;
        }
        .black-tag{
          margin-left: 10px;
        }
      }
      .right-content{
        height:20px;
        margin-left: auto;
        .more{
          width: 20px;
          height: 20px;
        }
      }
    }
  }
</style>
